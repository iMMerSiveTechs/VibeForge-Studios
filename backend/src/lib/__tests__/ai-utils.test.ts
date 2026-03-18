import { describe, test, expect } from "bun:test";
import { detectProvider, parseResponseText } from "../ai-utils";

describe("detectProvider", () => {
  test("identifies OpenAI GPT models", () => {
    expect(detectProvider("gpt-4o")).toBe("openai");
    expect(detectProvider("gpt-4")).toBe("openai");
    expect(detectProvider("gpt-3.5-turbo")).toBe("openai");
  });

  test("identifies OpenAI o1/o3 models", () => {
    expect(detectProvider("o1-preview")).toBe("openai");
    expect(detectProvider("o1-mini")).toBe("openai");
    expect(detectProvider("o3-mini")).toBe("openai");
  });

  test("identifies Gemini models", () => {
    expect(detectProvider("gemini-2.0-flash")).toBe("gemini");
    expect(detectProvider("gemini-pro")).toBe("gemini");
    expect(detectProvider("gemini-1.5-pro")).toBe("gemini");
  });

  test("defaults to Anthropic for claude models", () => {
    expect(detectProvider("claude-sonnet-4-5")).toBe("anthropic");
    expect(detectProvider("claude-3-opus")).toBe("anthropic");
    expect(detectProvider("claude-3-haiku")).toBe("anthropic");
  });

  test("defaults to Anthropic for unknown models", () => {
    expect(detectProvider("some-unknown-model")).toBe("anthropic");
    expect(detectProvider("custom-llm")).toBe("anthropic");
  });

  test("is case-insensitive", () => {
    expect(detectProvider("GPT-4o")).toBe("openai");
    expect(detectProvider("Gemini-Pro")).toBe("gemini");
  });
});

describe("parseResponseText", () => {
  describe("VF_APP marker detection", () => {
    test("detects VF_APP in json code fence", () => {
      const text = `Here is the app spec:
\`\`\`json
{
  "name": "Todo App",
  "start": "home",
  "screens": {
    "home": { "title": "Home", "body": [] }
  }
}
\`\`\``;

      const result = parseResponseText(text);
      expect(result.hasVfApp).toBe(true);
      expect(result.vfApp).not.toBeNull();
      expect((result.vfApp as any).name).toBe("Todo App");
    });

    test("detects VF_APP assignment pattern", () => {
      const text = `VF_APP = {
  "name": "My App",
  "start": "main",
  "screens": { "main": { "title": "Main", "body": [] } }
}`;

      const result = parseResponseText(text);
      expect(result.hasVfApp).toBe(true);
      expect(result.vfApp).not.toBeNull();
    });
  });

  describe("VF_PACK marker detection", () => {
    test("detects VF_PACK in json code fence", () => {
      const text = `\`\`\`json
{
  "files": [
    { "path": "app/index.tsx", "content": "export default App;" },
    { "path": "components/Button.tsx", "content": "export const Button = () => {};" }
  ]
}
\`\`\``;

      const result = parseResponseText(text);
      expect(result.hasVfPack).toBe(true);
      expect(result.vfPack).not.toBeNull();
      expect(result.fileCount).toBe(2);
    });

    test("detects VF_PACK assignment pattern", () => {
      const text = `VF_PACK = {
  "files": [
    { "path": "index.ts", "content": "hello" }
  ]
}`;

      const result = parseResponseText(text);
      expect(result.hasVfPack).toBe(true);
      expect(result.fileCount).toBe(1);
    });
  });

  describe("Snippet fallback", () => {
    test("extracts code snippets when no VF_APP or VF_PACK found", () => {
      const text = `Here is some TypeScript code:
\`\`\`typescript
const hello = "world";
\`\`\`

And some JavaScript:
\`\`\`javascript
function foo() {}
\`\`\``;

      const result = parseResponseText(text);
      expect(result.hasVfApp).toBe(false);
      expect(result.hasVfPack).toBe(false);
      expect(result.snippetFiles.length).toBe(2);
      expect(result.snippetFiles[0]!.path).toContain("snippet_0");
      expect(result.snippetFiles[0]!.path).toContain(".ts");
      expect(result.snippetFiles[1]!.path).toContain(".js");
    });
  });

  describe("No markers", () => {
    test("returns empty result for plain text", () => {
      const result = parseResponseText("Just some plain text without any code.");
      expect(result.hasVfApp).toBe(false);
      expect(result.hasVfPack).toBe(false);
      expect(result.fileCount).toBe(0);
      expect(result.vfApp).toBeNull();
      expect(result.vfPack).toBeNull();
      expect(result.snippetFiles).toEqual([]);
    });

    test("returns empty result for empty string", () => {
      const result = parseResponseText("");
      expect(result.hasVfApp).toBe(false);
      expect(result.hasVfPack).toBe(false);
      expect(result.fileCount).toBe(0);
    });
  });
});
