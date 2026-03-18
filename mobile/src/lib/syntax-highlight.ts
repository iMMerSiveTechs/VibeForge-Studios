export type TokenType =
  | "keyword"
  | "string"
  | "comment"
  | "number"
  | "punctuation"
  | "tag"
  | "attribute"
  | "plain";

export interface Token {
  type: TokenType;
  text: string;
}

export const TOKEN_COLORS: Record<TokenType, string> = {
  keyword: "#C3A6FF",
  string: "#68D391",
  comment: "#4A5568",
  number: "#FFB74D",
  punctuation: "#4A5568",
  tag: "#95CBDE",
  attribute: "#A75FBB",
  plain: "#E8EDF2",
};

const JS_KEYWORDS = new Set([
  "const",
  "let",
  "var",
  "function",
  "return",
  "if",
  "else",
  "for",
  "while",
  "import",
  "export",
  "from",
  "default",
  "class",
  "extends",
  "interface",
  "type",
  "async",
  "await",
  "try",
  "catch",
  "throw",
  "new",
  "this",
  "true",
  "false",
  "null",
  "undefined",
  "typeof",
  "void",
  "switch",
  "case",
  "break",
  "continue",
  "do",
  "in",
  "of",
  "instanceof",
  "delete",
  "yield",
  "enum",
  "implements",
  "static",
  "readonly",
  "abstract",
  "declare",
  "module",
  "namespace",
  "as",
  "is",
]);

const CSS_KEYWORDS = new Set([
  "import",
  "media",
  "keyframes",
  "font-face",
  "charset",
  "supports",
  "namespace",
]);

// Build a combined regex for JS/TS tokenization
// Order matters: comments before division, strings before identifiers
const JS_PATTERN =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(`(?:\\[\s\S]|[^`\\])*`|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*')|(0x[\da-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b([a-zA-Z_$][\w$]*)\b|([{}()\[\];:.,<>=+\-*/%!&|^~?@#])/g;

const HTML_PATTERN =
  /(<!--[\s\S]*?-->)|(<\/?)([\w-]+)|(\s)([\w-]+)(=)|("(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*')|(>)|([^<]+)/g;

const CSS_PATTERN =
  /(\/\*[\s\S]*?\*\/)|("(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*')|(#[\da-fA-F]{3,8}\b|\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|s|ms|deg|fr)?)|(@[\w-]+)|([\w-]+)(?=\s*:)|([{}();:,>+~\[\]=*.])|([^{}();:,>+~\[\]=*.@"'\s/]+)/g;

const JSON_PATTERN =
  /("(?:\\[\s\S]|[^"\\])*")(\s*:)?|(0x[\da-fA-F]+|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}()\[\]:,])/g;

function tokenizeJS(code: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;

  JS_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = JS_PATTERN.exec(code)) !== null) {
    // Add plain text between matches
    if (match.index > lastIndex) {
      tokens.push({ type: "plain", text: code.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      // Comment
      tokens.push({ type: "comment", text: match[1] });
    } else if (match[2]) {
      // String
      tokens.push({ type: "string", text: match[2] });
    } else if (match[3]) {
      // Number
      tokens.push({ type: "number", text: match[3] });
    } else if (match[4]) {
      // Identifier — check if keyword
      if (JS_KEYWORDS.has(match[4])) {
        tokens.push({ type: "keyword", text: match[4] });
      } else {
        tokens.push({ type: "plain", text: match[4] });
      }
    } else if (match[5]) {
      // Punctuation
      tokens.push({ type: "punctuation", text: match[5] });
    }

    lastIndex = JS_PATTERN.lastIndex;
  }

  // Remaining text
  if (lastIndex < code.length) {
    tokens.push({ type: "plain", text: code.slice(lastIndex) });
  }

  return tokens;
}

function tokenizeHTML(code: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;

  HTML_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = HTML_PATTERN.exec(code)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "plain", text: code.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      // Comment
      tokens.push({ type: "comment", text: match[1] });
    } else if (match[2] && match[3]) {
      // Tag opening < or </
      tokens.push({ type: "punctuation", text: match[2] });
      tokens.push({ type: "tag", text: match[3] });
    } else if (match[4] && match[5] && match[6]) {
      // Attribute name=
      tokens.push({ type: "plain", text: match[4] });
      tokens.push({ type: "attribute", text: match[5] });
      tokens.push({ type: "punctuation", text: match[6] });
    } else if (match[7]) {
      // Attribute value string
      tokens.push({ type: "string", text: match[7] });
    } else if (match[8]) {
      // Closing >
      tokens.push({ type: "punctuation", text: match[8] });
    } else if (match[9]) {
      // Text content
      tokens.push({ type: "plain", text: match[9] });
    }

    lastIndex = HTML_PATTERN.lastIndex;
  }

  if (lastIndex < code.length) {
    tokens.push({ type: "plain", text: code.slice(lastIndex) });
  }

  return tokens;
}

function tokenizeCSS(code: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;

  CSS_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = CSS_PATTERN.exec(code)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "plain", text: code.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      tokens.push({ type: "comment", text: match[1] });
    } else if (match[2]) {
      tokens.push({ type: "string", text: match[2] });
    } else if (match[3]) {
      tokens.push({ type: "number", text: match[3] });
    } else if (match[4]) {
      // @-rule
      const keyword = match[4].slice(1);
      if (CSS_KEYWORDS.has(keyword)) {
        tokens.push({ type: "keyword", text: match[4] });
      } else {
        tokens.push({ type: "attribute", text: match[4] });
      }
    } else if (match[5]) {
      // Property name
      tokens.push({ type: "tag", text: match[5] });
    } else if (match[6]) {
      tokens.push({ type: "punctuation", text: match[6] });
    } else if (match[7]) {
      tokens.push({ type: "plain", text: match[7] });
    }

    lastIndex = CSS_PATTERN.lastIndex;
  }

  if (lastIndex < code.length) {
    tokens.push({ type: "plain", text: code.slice(lastIndex) });
  }

  return tokens;
}

function tokenizeJSON(code: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;

  JSON_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = JSON_PATTERN.exec(code)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "plain", text: code.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      // String — if followed by colon it's a key
      if (match[2]) {
        tokens.push({ type: "attribute", text: match[1] });
        tokens.push({ type: "punctuation", text: match[2] });
      } else {
        tokens.push({ type: "string", text: match[1] });
      }
    } else if (match[3]) {
      tokens.push({ type: "number", text: match[3] });
    } else if (match[4]) {
      tokens.push({ type: "keyword", text: match[4] });
    } else if (match[5]) {
      tokens.push({ type: "punctuation", text: match[5] });
    }

    lastIndex = JSON_PATTERN.lastIndex;
  }

  if (lastIndex < code.length) {
    tokens.push({ type: "plain", text: code.slice(lastIndex) });
  }

  return tokens;
}

export function tokenize(code: string, language: string): Token[] {
  const lang = language.toLowerCase();

  switch (lang) {
    case "typescript":
    case "javascript":
    case "ts":
    case "tsx":
    case "js":
    case "jsx":
      return tokenizeJS(code);
    case "html":
      return tokenizeHTML(code);
    case "css":
      return tokenizeCSS(code);
    case "json":
      return tokenizeJSON(code);
    default:
      // Fallback: try JS tokenization for unknown languages
      return tokenizeJS(code);
  }
}
