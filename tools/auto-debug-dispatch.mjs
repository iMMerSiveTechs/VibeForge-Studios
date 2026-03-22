#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { GoogleGenerativeAI } from '@google/generative-ai';

const colors = {
 reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m',
 yellow: '\x1b[33m', cyan: '\x1b[36m', gray: '\x1b[90m', bold: '\x1b[1m',
};

const log = {
 success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
 error: (msg) => console.error(`${colors.red}✗${colors.reset} ${msg}`),
 warn: (msg) => console.warn(`${colors.yellow}⚠${colors.reset} ${msg}`),
 info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
};

function parseArgs() {
 const args = process.argv.slice(2);
 const opts = { filePath: null, directory: null, dryRun: false, diff: false, model: 'gemini-2.0-flash', scan: false };
 for (let i = 0; i < args.length; i++) {
   if (args[i] === '--scan') { opts.scan = true; opts.directory = args[i + 1]; i++; }
   else if (args[i] === '--dry-run') opts.dryRun = true;
   else if (args[i] === '--diff') opts.diff = true;
   else if (args[i] === '--model') { opts.model = args[i + 1]; i++; }
   else if (!args[i].startsWith('--')) opts.filePath = args[i];
 }
 return opts;
}

function getApiKey() {
 const key = process.env.GEMINI_API_KEY;
 if (!key) {
   log.error('GEMINI_API_KEY not set');
   console.log(`\nGet key from https://aistudio.google.com/app/apikey\nThen: export GEMINI_API_KEY="your-key-here"\n`);
   process.exit(1);
 }
 return key;
}

function findCodeFiles(dirPath) {
 const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.mts'];
 const files = [];
 function walk(dir) {
   try {
     for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
       if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
       const fullPath = path.join(dir, entry.name);
       if (entry.isDirectory()) walk(fullPath);
       else if (extensions.includes(path.extname(entry.name))) files.push(fullPath);
     }
   } catch { log.warn(`Could not read: ${dir}`); }
 }
 walk(dirPath);
 return files;
}

function createGitBackup(filePath) {
 try {
   execSync(`git add "${filePath}"`, { stdio: 'pipe' });
   execSync(`git commit -m "auto-debug: pre-fix snapshot of ${path.basename(filePath)}"`, { stdio: 'pipe' });
   log.success(`Git snapshot created`);
   return true;
 } catch {
   log.warn('Git unavailable — creating .backup file');
   fs.writeFileSync(`${filePath}.backup`, fs.readFileSync(filePath, 'utf8'));
   return false;
 }
}

function stripMarkdown(response) {
 let text = response;
 const match = text.match(/```(?:javascript|js|jsx|typescript|ts|tsx|mjs|mts)?\n([\s\S]*?)\n```/);
 if (match) return match[1].trim();
 const generic = text.match(/```\n([\s\S]*?)\n```/);
 if (generic) return generic[1].trim();
 return text.trim();
}

function generateDiff(original, fixed) {
 const orig = original.split('\n'), fix = fixed.split('\n');
 const lines = [];
 for (let i = 0; i < Math.max(orig.length, fix.length); i++) {
   if (orig[i] === fix[i]) lines.push(`${colors.gray} ${orig[i] || ''}${colors.reset}`);
   else {
     if (orig[i]) lines.push(`${colors.red}-${orig[i]}${colors.reset}`);
     if (fix[i]) lines.push(`${colors.green}+${fix[i]}${colors.reset}`);
   }
 }
 return lines.join('\n');
}

async function callGemini(apiKey, prompt, model) {
 log.info(`Calling ${model}...`);
 const ai = new GoogleGenerativeAI(apiKey);
 const gemini = ai.getGenerativeModel({ model });
 const sys = `You are an expert code debugger. Fix bugs with minimal changes. Return ONLY fixed code in a markdown code block. No explanations.`;
 const response = await gemini.generateContent({ contents: [{ role: 'user', parts: [{ text: sys + '\n\n' + prompt }] }] });
 return response.response.text();
}

async function processFile(filePath, opts) {
 if (!fs.existsSync(filePath)) { log.error(`Not found: ${filePath}`); process.exit(1); }
 log.info(`Processing: ${path.basename(filePath)}`);
 const content = fs.readFileSync(filePath, 'utf8');
 const apiKey = getApiKey();

 let response;
 try {
   response = await callGemini(apiKey, `Fix this ${path.extname(filePath)} file:\n\n${content}`, opts.model);
 } catch (err) {
   if (err.message?.includes('429')) { log.error('Rate limit — try tomorrow or use --model gemini-2.0-flash'); process.exit(1); }
   throw err;
 }

 const fixed = stripMarkdown(response);
 if (opts.dryRun) { log.info('DRY RUN:\n'); console.log(generateDiff(content, fixed)); return; }
 if (opts.diff) { console.log(generateDiff(content, fixed)); }
 createGitBackup(filePath);
 fs.writeFileSync(filePath, fixed, 'utf8');
 log.success(`Fixed: ${path.basename(filePath)}`);
}

async function main() {
 const opts = parseArgs();
 if (!opts.filePath && !opts.scan) {
   console.log(`Usage:\n  node auto-debug-dispatch.mjs <file>\n  node auto-debug-dispatch.mjs --scan <dir>\n  Flags: --dry-run --diff --model <name>\n`);
   process.exit(0);
 }
 if (opts.scan) {
   const files = findCodeFiles(opts.directory);
   log.info(`Found ${files.length} files`);
   for (const f of files) { try { await processFile(f, opts); } catch (e) { log.error(`${f}: ${e.message}`); } }
 } else {
   await processFile(opts.filePath, opts);
 }
}

main().catch(e => { log.error(e.message); process.exit(1); });
