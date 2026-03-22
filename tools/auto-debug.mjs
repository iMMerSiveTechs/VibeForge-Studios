#!/usr/bin/env node
/**
 * auto-debug.mjs — Autonomous AI Code Fixer
 * 
 * Usage:
 *   node tools/auto-debug.mjs <file>              # Fix a single file
 *   node tools/auto-debug.mjs <file> --dry-run     # Preview fix without overwriting
 *   node tools/auto-debug.mjs <file> --diff         # Show diff of changes
 *   node tools/auto-debug.mjs <dir> --scan          # Scan directory for issues
 * 
 * Environment:
 *   GEMINI_API_KEY — Your Google AI Studio API key
 *   AUTO_DEBUG_MODEL — Model to use (default: gemini-2.0-flash)
 * 
 * Safety: Always use Git. Commit before running. `git checkout -- <file>` to undo.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { resolve, extname, basename } from 'path';
import { execSync } from 'child_process';

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.AUTO_DEBUG_MODEL || 'gemini-2.0-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const CODE_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.py', '.rb', '.go', '.rs', '.swift', '.kt',
  '.html', '.css', '.scss', '.json', '.yaml', '.yml',
  '.sh', '.bash', '.zsh'
]);

// --- Helpers ---

function checkGit() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    const hasUncommitted = status.length > 0;
    if (hasUncommitted) {
      console.log('⚠️  Uncommitted changes detected. Recommended: git commit before auto-fix.');
      console.log('   (You can undo any AI changes with: git checkout -- <file>)\n');
    }
    return true;
  } catch {
    console.log('⚠️  Not a git repo. Strongly recommend initializing git for safety.\n');
    return false;
  }
}

async function callGemini(prompt) {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192
    }
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function extractCode(response) {
  // Strip markdown code blocks if present
  let code = response.trim();
  const codeBlockMatch = code.match(/```[\w]*\n([\s\S]*?)```/);
  if (codeBlockMatch) {
    code = codeBlockMatch[1].trim();
  }
  return code;
}

function showDiff(original, fixed, filePath) {
  const origLines = original.split('\n');
  const fixedLines = fixed.split('\n');
  console.log(`\n📊 Diff for ${filePath}:`);
  console.log('─'.repeat(60));
  
  const maxLines = Math.max(origLines.length, fixedLines.length);
  let changes = 0;
  
  for (let i = 0; i < maxLines; i++) {
    if (origLines[i] !== fixedLines[i]) {
      if (origLines[i]) console.log(`  - L${i + 1}: ${origLines[i]}`);
      if (fixedLines[i]) console.log(`  + L${i + 1}: ${fixedLines[i]}`);
      changes++;
    }
  }
  
  if (changes === 0) console.log('  No changes detected.');
  else console.log(`\n  ${changes} line(s) changed.`);
  console.log('─'.repeat(60));
}

// --- Commands ---

async function fixFile(filePath, opts = {}) {
  const { dryRun = false, showChanges = false } = opts;
  
  console.log(`\n🔍 Scanning ${filePath}...`);
  const original = readFileSync(filePath, 'utf8');
  const ext = extname(filePath);
  
  const prompt = `Act as a Senior Full-Stack Engineer. Review and fix the following ${ext} code file.

RULES:
- Return ONLY the complete, corrected code
- Do NOT use markdown formatting (no \`\`\` blocks)
- Do NOT include explanations, greetings, or comments that weren't in the original
- Preserve the original code style and formatting
- Fix bugs, type errors, missing imports, and logic issues
- If the code is already correct, return it unchanged

File: ${basename(filePath)}
Code:
${original}`;

  console.log(`📡 Sending to ${MODEL}...`);
  const response = await callGemini(prompt);
  const fixed = extractCode(response);

  if (fixed === original.trim()) {
    console.log('✅ No issues found — code looks clean.');
    return false;
  }

  if (showChanges || dryRun) {
    showDiff(original, fixed, filePath);
  }

  if (dryRun) {
    console.log('\n🏷️  Dry run — no files modified.');
    return true;
  }

  writeFileSync(filePath, fixed + '\n', 'utf8');
  console.log(`✅ ${filePath} overwritten with fixed code.`);
  console.log(`   Undo: git checkout -- ${filePath}`);
  return true;
}

async function scanDir(dirPath) {
  console.log(`\n📂 Scanning directory: ${dirPath}\n`);
  const files = [];
  
  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith('.') || entry === 'node_modules' || entry === 'dist' || entry === 'build') continue;
      const full = resolve(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (CODE_EXTENSIONS.has(extname(entry))) files.push(full);
    }
  }
  
  walk(dirPath);
  console.log(`Found ${files.length} code files.\n`);
  
  // Quick scan — just check for obvious issues
  const prompt = `Act as a Senior Code Reviewer. I have ${files.length} files in a project. 
Here are the filenames:
${files.map(f => `- ${f.replace(dirPath + '/', '')}`).join('\n')}

Based on the filenames alone, which files are most likely to have issues and should be reviewed first? 
Give me a prioritized list of the top 5 files to check, with a one-line reason each.`;

  console.log(`📡 Asking ${MODEL} for scan priority...`);
  const response = await callGemini(prompt);
  console.log('\n' + response);
}

// --- Main ---

async function main() {
  if (!API_KEY) {
    console.error('❌ GEMINI_API_KEY not set.');
    console.error('   Get your key at: https://aistudio.google.com/apikey');
    console.error('   Then run: export GEMINI_API_KEY="your_key_here"');
    console.error('   Or add to ~/.zshrc for persistence.');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const flags = args.filter(a => a.startsWith('--'));
  const positional = args.filter(a => !a.startsWith('--'));

  if (positional.length === 0) {
    console.log(`
🔧 auto-debug — Autonomous AI Code Fixer (powered by ${MODEL})

Usage:
  node tools/auto-debug.mjs <file>              Fix a file (overwrites in place)
  node tools/auto-debug.mjs <file> --dry-run     Preview without overwriting
  node tools/auto-debug.mjs <file> --diff         Fix and show diff
  node tools/auto-debug.mjs <dir> --scan          Scan directory for priorities

Environment:
  GEMINI_API_KEY=<key>                           Required
  AUTO_DEBUG_MODEL=gemini-2.0-flash              Optional (default: gemini-2.0-flash)

Safety: Always commit with Git before running. Undo: git checkout -- <file>
`);
    process.exit(0);
  }

  const target = resolve(positional[0]);
  checkGit();

  if (flags.includes('--scan')) {
    await scanDir(target);
  } else {
    await fixFile(target, {
      dryRun: flags.includes('--dry-run'),
      showChanges: flags.includes('--diff') || flags.includes('--dry-run')
    });
  }
}

main().catch(err => {
  console.error('💥 Fatal:', err.message);
  process.exit(1);
});
