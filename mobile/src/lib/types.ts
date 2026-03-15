export interface Project {
  id: string;
  name: string;
  bundleId: string;
  notes: string;
  vfAppSpec: string | null;
  previewState: string;
  files: string;
  artifacts: string;
  sourceRunId: string | null;
  createdAt: string;
  updatedAt: string;
  runs?: Run[];
}

export interface Run {
  id: string;
  projectId: string;
  status: string;
  inputSystem: string;
  inputUser: string;
  inputModel: string;
  inputMaxTokens: number;
  inputTemperature: number;
  outputTextExcerpt: string;
  outputStoredPath: string | null;
  usageInputTokens: number | null;
  usageOutputTokens: number | null;
  parseHasVfApp: boolean;
  parseHasVfPack: boolean;
  parseFileCount: number;
  error: string | null;
  createdAt: string;
  project?: { name: string };
}

export interface VfAppSpec {
  name: string;
  start: string;
  screens: Record<string, VfScreen>;
}

export interface VfScreen {
  title: string;
  body: VfNode[];
}

export type VfNode =
  | { type: "section"; children?: VfNode[] }
  | { type: "card"; children?: VfNode[] }
  | { type: "row"; children?: VfNode[] }
  | { type: "divider" }
  | { type: "spacer" }
  | { type: "text"; variant?: "h1" | "h2" | "body" | "caption"; value: string }
  | { type: "metric"; label: string; value: string }
  | { type: "input"; key: string; label: string; placeholder?: string }
  | { type: "textarea"; key: string; label: string; placeholder?: string }
  | { type: "toggle"; key: string; label: string }
  | { type: "list"; key: string; titleKey?: string; subtitleKey?: string }
  | { type: "button"; label: string; variant?: "primary" | "secondary" | "accent" | "ghost" | "danger"; action: VfAction }
  | { type: "camera"; key: string; label?: string; mode?: "photo" | "video" }
  | { type: "image"; source: string; width?: number; height?: number; aspectRatio?: number }
  | { type: "video"; source: string; height?: number }
  | { type: "audio"; source: string; label?: string }
  | { type: "map"; key?: string; latitude: number; longitude: number; latitudeDelta?: number; longitudeDelta?: number; markers?: string }
  | { type: "chart"; chartType: "line" | "bar" | "pie"; data: string; label?: string; width?: number; height?: number }
  | { type: "gallery"; key: string; columns?: number };

export type VfAction =
  | { type: "nav"; to: string }
  | { type: "set"; path: string; value: unknown }
  | { type: "append"; path: string; value: unknown }
  | { type: "remove"; path: string; index: number }
  | { type: "toast"; message: string };

export interface FileItem {
  path: string;
  content: string;
}

export interface GenerateResponse {
  run: Run;
  project: Project;
  parsed: {
    hasVfApp: boolean;
    hasVfPack: boolean;
    fileCount: number;
  };
}

export interface Settings {
  [key: string]: string;
}

export interface ZipUploadResponse {
  project: Project;
  extracted: {
    fileCount: number;
    hasVfApp: boolean;
    files: string[];
  };
}
