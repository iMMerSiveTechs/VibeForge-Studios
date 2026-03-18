import { describe, test, expect } from "bun:test";
import { parseCodegenResponse } from "../vce-codegen";

describe("parseCodegenResponse", () => {
  describe("Raw JSON input", () => {
    test("parses valid raw JSON correctly", () => {
      const input = JSON.stringify({
        files: [
          { path: "app/index.tsx", content: "export default App;", action: "create" },
        ],
        explanation: "Created the app entry point",
      });

      const result = parseCodegenResponse(input);
      expect(result).not.toBeNull();
      expect(result!.files).toHaveLength(1);
      expect(result!.files[0]!.path).toBe("app/index.tsx");
      expect(result!.files[0]!.content).toBe("export default App;");
      expect(result!.files[0]!.action).toBe("create");
      expect(result!.explanation).toBe("Created the app entry point");
    });

    test("parses raw JSON with multiple files", () => {
      const input = JSON.stringify({
        files: [
          { path: "app/index.tsx", content: "index content", action: "create" },
          { path: "components/Button.tsx", content: "button content", action: "create" },
          { path: "old-file.tsx", content: "", action: "delete" },
        ],
        explanation: "Multiple file changes",
      });

      const result = parseCodegenResponse(input);
      expect(result).not.toBeNull();
      expect(result!.files).toHaveLength(3);
    });
  });

  describe("Markdown-fenced JSON", () => {
    test("extracts JSON from ```json fence", () => {
      const input = `Here is the generated code:

\`\`\`json
{
  "files": [
    { "path": "app/index.tsx", "content": "const App = () => {};", "action": "create" }
  ],
  "explanation": "Created app"
}
\`\`\`

Let me know if you need changes.`;

      const result = parseCodegenResponse(input);
      expect(result).not.toBeNull();
      expect(result!.files).toHaveLength(1);
      expect(result!.files[0]!.path).toBe("app/index.tsx");
      expect(result!.explanation).toBe("Created app");
    });

    test("extracts JSON from ``` fence without json label", () => {
      const input = `\`\`\`
{
  "files": [
    { "path": "test.ts", "content": "test", "action": "update" }
  ],
  "explanation": "Updated test"
}
\`\`\``;

      const result = parseCodegenResponse(input);
      expect(result).not.toBeNull();
      expect(result!.files).toHaveLength(1);
    });
  });

  describe("JSON embedded in text", () => {
    test("extracts JSON object containing files array from surrounding text", () => {
      const input = `I'll generate the code for you. Here's the result:

Sure, here is the output: {"files": [{"path": "app.tsx", "content": "hello", "action": "create"}], "explanation": "done"}

Hope this helps!`;

      const result = parseCodegenResponse(input);
      expect(result).not.toBeNull();
      expect(result!.files).toHaveLength(1);
      expect(result!.files[0]!.path).toBe("app.tsx");
    });
  });

  describe("Invalid input", () => {
    test("returns null for completely invalid input", () => {
      const result = parseCodegenResponse("This is just plain text with no JSON at all.");
      expect(result).toBeNull();
    });

    test("returns null for empty string", () => {
      const result = parseCodegenResponse("");
      expect(result).toBeNull();
    });

    test("returns null for malformed JSON", () => {
      const result = parseCodegenResponse('{"files": [broken json}');
      expect(result).toBeNull();
    });
  });

  describe("Missing files array", () => {
    test("returns null when files key is missing", () => {
      const input = JSON.stringify({ explanation: "no files here" });
      const result = parseCodegenResponse(input);
      expect(result).toBeNull();
    });

    test("returns null when files is not an array", () => {
      const input = JSON.stringify({ files: "not an array", explanation: "bad" });
      const result = parseCodegenResponse(input);
      expect(result).toBeNull();
    });

    test("returns null for JSON object without files in fenced block", () => {
      const input = `\`\`\`json
{ "name": "test", "value": 42 }
\`\`\``;
      const result = parseCodegenResponse(input);
      expect(result).toBeNull();
    });
  });

  describe("Edge cases", () => {
    test("handles missing explanation field gracefully", () => {
      const input = JSON.stringify({
        files: [{ path: "a.ts", content: "code", action: "create" }],
      });
      const result = parseCodegenResponse(input);
      expect(result).not.toBeNull();
      expect(result!.explanation).toBe("");
    });

    test("handles empty files array", () => {
      const input = JSON.stringify({ files: [], explanation: "nothing to do" });
      const result = parseCodegenResponse(input);
      expect(result).not.toBeNull();
      expect(result!.files).toHaveLength(0);
    });
  });
});
