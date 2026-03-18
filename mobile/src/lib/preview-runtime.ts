/**
 * Preview Runtime — Builds a self-contained HTML page from project source files.
 * Maps React Native components to web equivalents for approximate preview.
 */

interface ProjectFile {
  path: string;
  content: string;
}

/**
 * Build a single HTML page that renders an approximation of the project's React Native code
 */
export function buildPreviewHTML(files: ProjectFile[]): string {
  // Collect all file contents for display
  const fileList = files
    .filter(f => f.path.endsWith(".tsx") || f.path.endsWith(".ts") || f.path.endsWith(".jsx") || f.path.endsWith(".js"))
    .map(f => ({
      path: f.path,
      content: f.content,
    }));

  // Find the entry file (app/index.tsx, index.tsx, App.tsx, etc.)
  const entryFile = fileList.find(f =>
    f.path === "app/index.tsx" || f.path === "app/(tabs)/index.tsx" ||
    f.path === "index.tsx" || f.path === "App.tsx"
  ) ?? fileList[0];

  // Extract component names and their JSX from files
  const components = fileList.map(f => {
    const name = f.path.replace(/^.*\//, "").replace(/\.[^.]+$/, "");
    return { name, path: f.path, content: f.content };
  });

  // Build a simplified HTML preview
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>VibeForge Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #020203; color: #E8EDF2; min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }
    .rn-view { display: flex; flex-direction: column; }
    .rn-text { font-size: 14px; line-height: 1.4; }
    .rn-scroll { overflow-y: auto; -webkit-overflow-scrolling: touch; }
    .rn-pressable { cursor: pointer; user-select: none; }
    .rn-pressable:active { opacity: 0.7; }
    .rn-image { object-fit: cover; }
    .rn-input {
      background: #1a1a2e; border: 1px solid #333; border-radius: 8px;
      color: #E8EDF2; padding: 10px 12px; font-size: 14px; width: 100%;
      outline: none;
    }
    .rn-input:focus { border-color: #95CBDE; }
    .safe-area { padding-top: env(safe-area-inset-top, 44px); padding-bottom: env(safe-area-inset-bottom, 34px); }
    .screen { min-height: 100vh; padding: 16px; }
    /* Tab bar approximation */
    .tab-bar {
      position: fixed; bottom: 0; left: 0; right: 0;
      display: flex; justify-content: space-around; align-items: center;
      background: #0B0C10; border-top: 1px solid #1E1E1E;
      padding: 8px 0 env(safe-area-inset-bottom, 20px);
      z-index: 100;
    }
    .tab-item {
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      color: #4A5568; font-size: 10px; padding: 4px 12px;
    }
    .tab-item.active { color: #95CBDE; }
    /* Console panel */
    #console-panel {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: #0a0a0a; border-top: 1px solid #333;
      max-height: 200px; overflow-y: auto; display: none;
      font-family: monospace; font-size: 11px; padding: 8px;
      z-index: 200;
    }
    #console-panel.visible { display: block; }
    .console-log { color: #95CBDE; margin-bottom: 2px; }
    .console-error { color: #FF6B6B; margin-bottom: 2px; }
    .console-warn { color: #FFB74D; margin-bottom: 2px; }
  </style>
</head>
<body>
  <div id="app" class="safe-area">
    <div class="screen">
      ${entryFile ? renderFilePreview(entryFile.content) : '<p style="color:#4A5568;text-align:center;padding:40px;">No preview available</p>'}
    </div>
    ${components.length > 1 ? renderFileNav(components) : ''}
  </div>
  <div id="console-panel"></div>
  <script>
    // Console capture
    const consolePanel = document.getElementById('console-panel');
    const origLog = console.log;
    const origError = console.error;
    const origWarn = console.warn;

    function addConsoleEntry(type, args) {
      const div = document.createElement('div');
      div.className = 'console-' + type;
      div.textContent = Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      consolePanel.appendChild(div);
      consolePanel.scrollTop = consolePanel.scrollHeight;
      // Send to React Native
      try {
        window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'console', level: type, message: div.textContent }));
      } catch(e) {}
    }

    console.log = function() { origLog.apply(console, arguments); addConsoleEntry('log', arguments); };
    console.error = function() { origError.apply(console, arguments); addConsoleEntry('error', arguments); };
    console.warn = function() { origWarn.apply(console, arguments); addConsoleEntry('warn', arguments); };

    window.onerror = function(msg, src, line, col, err) {
      addConsoleEntry('error', ['Runtime error: ' + msg + ' at line ' + line]);
      return true;
    };

    // Toggle console
    window.toggleConsole = function() {
      consolePanel.classList.toggle('visible');
    };
  </script>
</body>
</html>`;
}

/**
 * Simple JSX-to-HTML converter — extracts visible UI elements from JSX
 */
function renderFilePreview(content: string): string {
  // Extract the return statement JSX
  const returnMatch = content.match(/return\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*\}/);
  if (!returnMatch) {
    // Try to show a code preview instead
    return `<div style="padding:16px;background:#0B0C10;border-radius:8px;border:1px solid #1E1E1E;">
      <pre style="color:#95CBDE;font-size:12px;white-space:pre-wrap;font-family:monospace;">${escapeHtml(content.substring(0, 2000))}</pre>
    </div>`;
  }

  let jsx = returnMatch[1] ?? "";

  // Transform common RN patterns to HTML
  jsx = jsx
    // Views become divs
    .replace(/<View\b([^>]*)>/g, '<div class="rn-view"$1>')
    .replace(/<\/View>/g, '</div>')
    // SafeAreaView
    .replace(/<SafeAreaView\b([^>]*)>/g, '<div class="rn-view safe-area"$1>')
    .replace(/<\/SafeAreaView>/g, '</div>')
    // Text becomes span
    .replace(/<Text\b([^>]*)>/g, '<span class="rn-text"$1>')
    .replace(/<\/Text>/g, '</span>')
    // ScrollView
    .replace(/<ScrollView\b([^>]*)>/g, '<div class="rn-scroll"$1>')
    .replace(/<\/ScrollView>/g, '</div>')
    // Pressable/TouchableOpacity
    .replace(/<(?:Pressable|TouchableOpacity)\b([^>]*)>/g, '<button class="rn-pressable"$1>')
    .replace(/<\/(?:Pressable|TouchableOpacity)>/g, '</button>')
    // TextInput
    .replace(/<TextInput\b([^>]*)\/?>/g, '<input class="rn-input"$1 />')
    // Image
    .replace(/<(?:Image|ExpoImage)\b([^>]*)\/?>/g, '<img class="rn-image"$1 />')
    // Remove style={{ ... }} (too complex to parse inline)
    .replace(/style=\{\{[^}]*\}\}/g, '')
    // Remove className (NativeWind)
    .replace(/className="[^"]*"/g, '')
    // Remove event handlers
    .replace(/on\w+={[^}]*}/g, '')
    // Clean up remaining JSX expressions
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '') // comments
    ;

  return jsx;
}

function renderFileNav(components: Array<{name: string; path: string}>): string {
  return `<div class="tab-bar">
    ${components.slice(0, 5).map((c, i) =>
      `<div class="tab-item ${i === 0 ? 'active' : ''}">${c.name}</div>`
    ).join('')}
  </div>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Debounced version of buildPreviewHTML
 */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function buildPreviewHTMLDebounced(
  files: ProjectFile[],
  callback: (html: string) => void,
  delay: number = 500
): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    callback(buildPreviewHTML(files));
  }, delay);
}
