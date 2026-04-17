/**
 * Script: Remove debug console.log statements from server
 * Phase 1 Cleanup
 * 
 * Preserves:
 * - Startup messages in index.ts
 * - Comments / JSDoc
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '..', 'src');

// Files where console.log is legitimate (startup messages)
const PRESERVE_FILES = new Set([
  // We'll keep index.ts startup logs — but remove debug logs in it
]);

// Lines patterns to KEEP even if they have console.log (startup/informational)
const KEEP_PATTERNS = [
  /console\.log\(\s*['"`]={2,}/,         // console.log('====...')
  /console\.log\(\s*['"`]🚀/,            // Startup
  /console\.log\(\s*['"`]📝/,            // Environment info
  /console\.log\(\s*['"`]🌐.*Frontend/,  // Frontend URL
  /console\.log\(\s*['"`]📋/,            // Endpoints header
  /console\.log\(\s*['"`]\s+-\s/,        // Endpoint list items
  /console\.log\(\s*['"`]✅.*Simulation/,  // Module init
  /console\.log\(\s*['"`]✅.*InfluxDB/,    // InfluxDB init
  /console\.log\(\s*['"`]✅.*Socket/,      // Socket init
];

let totalFilesModified = 0;
let totalLinesRemoved = 0;

function findFiles(dir, extensions) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      results.push(...findFiles(fullPath, extensions));
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

function shouldKeepLine(line) {
  return KEEP_PATTERNS.some(pattern => pattern.test(line));
}

function removeConsoleLogs(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  if (!content.includes('console.log')) return;

  const lines = content.split('\n');
  const newLines = [];
  let linesRemoved = 0;
  let inMultiLineConsole = false;
  let braceDepth = 0;
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track block comments
    if (trimmed.startsWith('/*') || trimmed.startsWith('/**')) {
      inBlockComment = true;
    }
    if (inBlockComment) {
      if (trimmed.includes('*/')) inBlockComment = false;
      newLines.push(line);
      continue;
    }

    if (inMultiLineConsole) {
      for (const ch of line) {
        if (ch === '(') braceDepth++;
        if (ch === ')') braceDepth--;
      }
      linesRemoved++;
      if (braceDepth <= 0) {
        inMultiLineConsole = false;
        braceDepth = 0;
      }
      continue;
    }

    if (trimmed.startsWith('//') || trimmed.startsWith('*')) {
      newLines.push(line);
      continue;
    }

    if (trimmed.match(/console\.log\s*\(/)) {
      // Check if this is a line we should keep
      if (shouldKeepLine(line)) {
        newLines.push(line);
        continue;
      }
      
      let depth = 0;
      for (const ch of line) {
        if (ch === '(') depth++;
        if (ch === ')') depth--;
      }
      if (depth > 0) {
        inMultiLineConsole = true;
        braceDepth = depth;
      }
      linesRemoved++;
      continue;
    }

    newLines.push(line);
  }

  if (linesRemoved > 0) {
    let result = newLines.join('\n').replace(/\n{3,}/g, '\n\n');
    fs.writeFileSync(filePath, result, 'utf-8');
    const relPath = path.relative(path.resolve(__dirname, '..'), filePath);
    console.log(`  ✅ ${relPath} (${linesRemoved} lines removed)`);
    totalFilesModified++;
    totalLinesRemoved += linesRemoved;
  }
}

console.log('🧹 Removing debug console.log statements from server...\n');

const files = findFiles(srcDir, ['.ts', '.tsx', '.js', '.jsx']);
console.log(`Found ${files.length} source files to scan.\n`);

for (const file of files) {
  removeConsoleLogs(file);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📊 Summary:`);
console.log(`   Files modified:    ${totalFilesModified}`);
console.log(`   Lines removed:     ${totalLinesRemoved}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
