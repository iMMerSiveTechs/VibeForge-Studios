// Shared AI utilities for generate and analyze-zip routes

// ---- Types ----

export interface ParsedOutput {
  hasVfApp: boolean;
  hasVfPack: boolean;
  fileCount: number;
  vfApp: Record<string, unknown> | null;
  vfPack: { files: Array<{ path: string; content: string }> } | null;
  snippetFiles: Array<{ path: string; content: string }>;
}

export type Provider = "anthropic" | "openai" | "gemini";

export interface AIResponse {
  textContent: string;
  inputTokens?: number;
  outputTokens?: number;
}

// ---- Constants ----

export const DEFAULT_SYSTEM_PROMPT = `You are VibeForge, an expert React Native/Expo mobile app developer. Your mission is to build COMPLETE, PRODUCTION-READY mobile applications that users can immediately preview and use.

CRITICAL REQUIREMENTS:
1. ALWAYS generate full, working React Native/Expo apps - NEVER refuse or provide minimal specs
2. Output code in VF_PACK JSON format with 5-20+ files for a complete app structure
3. Include ALL necessary files: screens, components, navigation, types, utilities, and assets
4. Use modern React Native patterns: TypeScript, hooks, functional components
5. Style with NativeWind/Tailwind CSS classes
6. Implement proper navigation using Expo Router (file-based routing)
7. Add state management (Context API, Zustand, or Redux if complex)
8. Include error handling, loading states, and edge cases
9. Make it beautiful, intuitive, and production-grade

VF_PACK FORMAT (use this for code output):
\`\`\`json
{
  "files": [
    { "path": "app/index.tsx", "content": "..." },
    { "path": "app/(tabs)/home.tsx", "content": "..." },
    { "path": "components/Button.tsx", "content": "..." },
    { "path": "types/index.ts", "content": "..." },
    { "path": "hooks/useData.ts", "content": "..." }
  ]
}
\`\`\`

TYPICAL APP STRUCTURE:
- app/index.tsx - Entry/splash screen
- app/(tabs)/*.tsx - Main tab screens
- app/[dynamic].tsx - Dynamic routes
- components/*.tsx - Reusable UI components
- hooks/*.ts - Custom React hooks
- types/*.ts - TypeScript types/interfaces
- utils/*.ts - Helper functions
- constants/*.ts - App constants, colors, config

BEST PRACTICES:
- Use Expo SDK packages (expo-router, expo-image, expo-linear-gradient, etc.)
- Implement responsive designs with proper spacing and typography
- Add animations with react-native-reanimated when appropriate
- Include proper TypeScript types for all props and data
- Handle async operations with proper loading/error states
- Use SafeAreaView, ScrollView, and FlatList appropriately
- Add haptic feedback, icons, and delightful micro-interactions
- Support both iOS and Android design patterns

WHAT TO BUILD:
When user asks "build a [X] app", generate a COMPLETE app with:
- Multiple screens with proper navigation
- Full CRUD operations if data-driven
- Beautiful, modern UI with consistent design system
- Proper form validation and user feedback
- Empty states, loading states, error states
- Realistic mock data or API integration patterns
- Comments explaining complex logic

OUTPUT REQUIREMENTS:
1. MUST output VF_PACK JSON with complete file structure
2. Each file should have proper imports, exports, and implementation
3. Code should compile and run without errors
4. Minimum 5 files, typically 10-20 for full apps
5. Be creative and exceed expectations

NEVER output minimal specs or refuse to build. ALWAYS generate complete, working code that users can immediately use and deploy.`;

export const CODE_ANALYSIS_SYSTEM_PROMPT = `You are a mobile app analyzer. Given source code files extracted from a zip archive, analyze the app's screens, navigation, components, data models, and user flows. Then generate a COMPLETE VF_APP specification that recreates this app's functionality as an interactive mobile preview.

Output ONLY a JSON code fence with this exact structure:
\`\`\`json
{
  "name": "App Name",
  "start": "screenKey",
  "screens": {
    "screenKey": {
      "title": "Screen Title",
      "body": [ ...nodes... ]
    }
  }
}
\`\`\`

AVAILABLE NODE TYPES (use these exactly):
- { "type": "text", "variant": "h1"|"h2"|"body"|"caption", "value": "string" }
- { "type": "button", "label": "string", "action": { "type": "nav", "to": "screenKey" } }
- { "type": "button", "label": "string", "action": { "type": "toast", "message": "string" } }
- { "type": "button", "label": "string", "action": { "type": "set", "path": "key", "value": "any" } }
- { "type": "input", "key": "fieldName", "label": "string", "placeholder": "string" }
- { "type": "textarea", "key": "fieldName", "label": "string", "placeholder": "string" }
- { "type": "toggle", "key": "settingName", "label": "string" }
- { "type": "list", "key": "dataKey", "titleKey": "name", "subtitleKey": "description" }
- { "type": "card", "children": [...nodes] }
- { "type": "row", "children": [...nodes] }
- { "type": "section", "children": [...nodes] }
- { "type": "metric", "label": "string", "value": "string" }
- { "type": "divider" }
- { "type": "spacer" }
- { "type": "image", "source": "https://...", "aspectRatio": 1.5 }
- { "type": "chart", "chartType": "line"|"bar"|"pie", "data": "dataKey" }
- { "type": "gallery", "key": "imagesKey", "columns": 2 }
- { "type": "map", "latitude": 37.7749, "longitude": -122.4194 }

RULES:
- Map EACH unique screen/view/page in the source to one entry in "screens"
- The "start" key MUST match an existing screen key
- Use nav actions for all screen-to-screen navigation
- Use input/toggle/list nodes to represent forms, settings, data lists
- Be comprehensive — recreate ALL screens you find in the source
- Output ONLY the JSON code fence, no explanations, no other text`;

// ---- Helpers ----

export function tryParseJson(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export function isVfApp(obj: unknown): obj is Record<string, unknown> {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return "name" in o && "start" in o && "screens" in o;
}

export function isVfPack(
  obj: unknown
): obj is { files: Array<{ path: string; content: string }> } {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return "files" in o && Array.isArray(o.files);
}

export function langToExt(lang: string): string {
  const map: Record<string, string> = {
    typescript: "ts",
    javascript: "js",
    typescriptreact: "tsx",
    javascriptreact: "jsx",
    python: "py",
    ruby: "rb",
    swift: "swift",
    kotlin: "kt",
    html: "html",
    css: "css",
    json: "json",
    yaml: "yml",
    markdown: "md",
    shell: "sh",
    bash: "sh",
    tsx: "tsx",
    jsx: "jsx",
    ts: "ts",
    js: "js",
  };
  return map[lang] ?? lang;
}

export function detectProvider(model: string): Provider {
  const lowerModel = model.toLowerCase();

  // Check for OpenAI models
  if (
    lowerModel.startsWith("gpt-") ||
    lowerModel.startsWith("o1") ||
    lowerModel.startsWith("o3")
  ) {
    return "openai";
  }

  // Check for Gemini models
  if (lowerModel.startsWith("gemini-")) {
    return "gemini";
  }

  // Default to Anthropic (claude-, opus, sonnet, haiku)
  return "anthropic";
}

// Cost-ordered provider preference: Gemini (cheapest) → OpenAI → Anthropic (most expensive)
// Each entry maps a settings key to its default model
const PROVIDER_PRIORITY: Array<{
  keyName: string;
  modelKeyName: string;
  defaultModel: string;
  provider: Provider;
}> = [
  { keyName: "api_key_gemini",  modelKeyName: "model_gemini",  defaultModel: "gemini-2.0-flash",  provider: "gemini" },
  { keyName: "api_key_openai",  modelKeyName: "model_openai",  defaultModel: "gpt-4o",            provider: "openai" },
  { keyName: "api_key_claude",  modelKeyName: "model_claude",  defaultModel: "claude-sonnet-4-5", provider: "anthropic" },
];

// Models that are known-dead / removed from APIs — always replaced with the provider default
const DEAD_MODELS = new Set([
  "gemini-2.5-pro-preview-05-06",
  "gemini-2.5-pro-preview-03-25",
  "gemini-2.0-flash-thinking-exp",
  "gemini-2.0-flash-exp",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-1.0-pro",
  "claude-opus-4-5-20251101",
]);

/**
 * Reads all API keys from the DB settings and returns the cheapest available one.
 * Returns null if no valid key is found.
 */
export async function selectBestProvider(db: {
  setting: { findMany: (args: { where: { userId: string; key: { in: string[] } } }) => Promise<Array<{ key: string; value: string }>> };
}, userId: string): Promise<{ apiKey: string; model: string; provider: Provider } | null> {
  const keyNames = PROVIDER_PRIORITY.flatMap(p => [p.keyName, p.modelKeyName]);
  const rows = await db.setting.findMany({ where: { userId, key: { in: keyNames } } });
  const map = Object.fromEntries(rows.map(r => [r.key, r.value]));

  for (const p of PROVIDER_PRIORITY) {
    const key = map[p.keyName]?.trim();
    if (key && key.length > 0) {
      const storedModel = map[p.modelKeyName]?.trim();
      // Fall back to default if stored model is dead/missing
      const model = (storedModel && !DEAD_MODELS.has(storedModel))
        ? storedModel
        : p.defaultModel;
      return { apiKey: key, model, provider: p.provider };
    }
  }
  return null;
}

// HTTP status codes and error keywords that mean "try next provider"
function isRetryableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("resource_exhausted") ||
    msg.includes("too many requests") ||
    msg.includes("overloaded") ||
    msg.includes("529")
  );
}

/**
 * Collects ALL configured providers from DB (ordered cheapest first),
 * then tries them one by one. Skips a provider on rate/quota errors and
 * falls through to the next. Throws only if all providers fail.
 */
export async function callWithFallback(
  db: { setting: { findMany: (args: { where: { userId: string; key: { in: string[] } } }) => Promise<Array<{ key: string; value: string }>> } },
  userId: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  temperature: number,
): Promise<AIResponse & { usedModel: string }> {
  const keyNames = PROVIDER_PRIORITY.flatMap(p => [p.keyName, p.modelKeyName]);
  const rows = await db.setting.findMany({ where: { userId, key: { in: keyNames } } });
  const map = Object.fromEntries(rows.map(r => [r.key, r.value]));

  const candidates: Array<{ apiKey: string; model: string; provider: Provider }> = [];
  for (const p of PROVIDER_PRIORITY) {
    const key = map[p.keyName]?.trim();
    if (!key) continue;
    const storedModel = map[p.modelKeyName]?.trim();
    const model = (storedModel && !DEAD_MODELS.has(storedModel)) ? storedModel : p.defaultModel;
    candidates.push({ apiKey: key, model, provider: p.provider });
  }

  if (candidates.length === 0) {
    throw new Error("No AI API key configured. Add one in Settings.");
  }

  const errors: string[] = [];
  for (const c of candidates) {
    try {
      let result: AIResponse;
      switch (c.provider) {
        case "anthropic":
          result = await callAnthropicAPI(c.apiKey, c.model, systemPrompt, userPrompt, maxTokens, temperature);
          break;
        case "openai":
          result = await callOpenAIAPI(c.apiKey, c.model, systemPrompt, userPrompt, maxTokens, temperature);
          break;
        case "gemini":
          result = await callGeminiAPI(c.apiKey, c.model, systemPrompt, userPrompt, maxTokens, temperature);
          break;
      }
      return { ...result, usedModel: c.model };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isRetryableError(err)) {
        errors.push(`${c.provider}/${c.model}: rate limited`);
        continue; // try next provider
      }
      // Non-retryable error (bad key, wrong model, etc.) — still try next
      errors.push(`${c.provider}/${c.model}: ${msg.substring(0, 120)}`);
    }
  }

  throw new Error(`All providers failed:\n${errors.join("\n")}`);
}

export function parseResponseText(text: string): ParsedOutput {
  const result: ParsedOutput = {
    hasVfApp: false,
    hasVfPack: false,
    fileCount: 0,
    vfApp: null,
    vfPack: null,
    snippetFiles: [],
  };

  // Strategy 1: Look for ```json code fences containing VF_APP or VF_PACK objects
  // Matches ```json ... ``` with any content in between
  const jsonFenceRegex = /```(?:json)?\s*\n([\s\S]*?)\n```/g;
  let match: RegExpExecArray | null;
  while ((match = jsonFenceRegex.exec(text)) !== null) {
    const content = match[1]?.trim();
    if (!content) continue;

    const parsed = tryParseJson(content);
    if (!parsed) continue;

    if (!result.hasVfApp && isVfApp(parsed)) {
      result.vfApp = parsed;
      result.hasVfApp = true;
    } else if (!result.hasVfPack && isVfPack(parsed)) {
      result.vfPack = parsed;
      result.hasVfPack = true;
      result.fileCount = parsed.files.length;
    }
  }

  // Strategy 2: Look for VF_APP = { ... } and VF_PACK = { ... } patterns
  // (legacy support)
  if (!result.hasVfApp) {
    const vfAppAssignMatch = text.match(/VF_APP\s*=\s*(\{[\s\S]*?\n\})/);
    if (vfAppAssignMatch?.[1]) {
      const parsed = tryParseJson(vfAppAssignMatch[1]);
      if (isVfApp(parsed)) {
        result.vfApp = parsed;
        result.hasVfApp = true;
      }
    }
  }

  if (!result.hasVfPack) {
    const vfPackAssignMatch = text.match(/VF_PACK\s*=\s*(\{[\s\S]*?\n\})/);
    if (vfPackAssignMatch?.[1]) {
      const parsed = tryParseJson(vfPackAssignMatch[1]);
      if (isVfPack(parsed)) {
        result.vfPack = parsed;
        result.hasVfPack = true;
        result.fileCount = parsed.files.length;
      }
    }
  }

  // Strategy 3: Fallback - extract fenced code blocks into /snippets/* files
  if (!result.hasVfApp && !result.hasVfPack) {
    const codeFenceRegex = /```(\w+)\n([\s\S]*?)```/g;
    let codeMatch: RegExpExecArray | null;
    let snippetIndex = 0;
    while ((codeMatch = codeFenceRegex.exec(text)) !== null) {
      const lang = codeMatch[1] ?? "txt";
      const code = codeMatch[2] ?? "";
      if (lang === "json") continue; // Already handled above

      const ext = langToExt(lang);
      result.snippetFiles.push({
        path: `/snippets/snippet_${snippetIndex}.${ext}`,
        content: code,
      });
      snippetIndex++;
    }
    result.fileCount = result.snippetFiles.length;
  }

  return result;
}

// ---- API Callers ----

export async function callAnthropicAPI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  prompt: string,
  maxTokens: number,
  temperature: number
): Promise<AIResponse> {
  const response = await fetch(
    "https://proxy.vibecodeapp.com/anthropic/v1/messages",
    {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("[AI] Anthropic API error:", errText);
    throw new Error(`Anthropic API error (${response.status}): ${errText}`);
  }

  const apiResult = (await response.json()) as {
    content: Array<{ type: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };

  const textContent = apiResult.content
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text!)
    .join("\n");

  return {
    textContent,
    inputTokens: apiResult.usage?.input_tokens,
    outputTokens: apiResult.usage?.output_tokens,
  };
}

export async function callOpenAIAPI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  prompt: string,
  maxTokens: number,
  temperature: number
): Promise<AIResponse> {
  const response = await fetch(
    "https://proxy.vibecodeapp.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("[AI] OpenAI API error:", errText);
    throw new Error(`OpenAI API error (${response.status}): ${errText}`);
  }

  const apiResult = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const textContent = apiResult.choices[0]?.message?.content ?? "";

  return {
    textContent,
    inputTokens: apiResult.usage?.prompt_tokens,
    outputTokens: apiResult.usage?.completion_tokens,
  };
}

export async function callGeminiAPI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  prompt: string,
  maxTokens: number,
  temperature: number
): Promise<AIResponse> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: systemPrompt + "\n\n" + prompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature,
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("[AI] Gemini API error:", errText);
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const apiResult = (await response.json()) as {
    candidates: Array<{
      content: { parts: Array<{ text: string }> };
    }>;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
    };
  };

  const textContent =
    apiResult.candidates[0]?.content?.parts.map((part) => part.text).join("\n") ??
    "";

  return {
    textContent,
    inputTokens: apiResult.usageMetadata?.promptTokenCount,
    outputTokens: apiResult.usageMetadata?.candidatesTokenCount,
  };
}
