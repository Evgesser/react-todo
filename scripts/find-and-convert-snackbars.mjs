#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';

const SRC = path.join(process.cwd(), 'src');

function walk(dir, files = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    if (it.name === 'node_modules' || it.name === '.git') continue;
    const full = path.join(dir, it.name);
    if (it.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx|js|jsx)$/.test(it.name)) files.push(full);
  }
  return files;
}

const files = walk(SRC);
const results = [];

const simplePatterns = [
  /enqueueSnackbar\(\s*t\.([a-zA-Z0-9_.]+)\s*(,|\))/g,
  /setSnackbarMsg\(\s*t\.([a-zA-Z0-9_.]+)\s*\)/g,
  /onSnackbar\(\s*t\.([a-zA-Z0-9_.]+)\s*\)/g,
  /setSnackbar\(\s*t\.([a-zA-Z0-9_.]+)\s*(,|\))/g,
  /showSnackbar\(\s*t\.([a-zA-Z0-9_.]+)\s*(,|\))/g,
  /notify\(\s*t\.([a-zA-Z0-9_.]+)\s*(,|\))/g,
  /toast\(\s*t\.([a-zA-Z0-9_.]+)\s*(,|\))/g,
  /alert\(\s*t\.([a-zA-Z0-9_.]+)\s*(,|\))/g,
  /message=\{\s*t\.([a-zA-Z0-9_.]+)\s*\}/g,
  /message:\s*t\.([a-zA-Z0-9_.]+)/g,
];

const complexPatterns = [
  /`[^`]*\$\{\s*t\.([a-zA-Z0-9_.]+)\s*\}[^`]*`/g,
  /t\.([a-zA-Z0-9_.]+)\s*\+\s*[a-zA-Z0-9_$.]+/g,
  /[a-zA-Z0-9_$.]+\s*\+\s*t\.([a-zA-Z0-9_.]+)/g,
];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  let fileMatches = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const rx of simplePatterns) {
      rx.lastIndex = 0;
      let m;
      while ((m = rx.exec(line)) !== null) {
        fileMatches.push({ line: i + 1, match: m[0], key: m[1], type: 'simple' });
      }
    }
    for (const rx of complexPatterns) {
      rx.lastIndex = 0;
      let m;
      while ((m = rx.exec(line)) !== null) {
        fileMatches.push({ line: i + 1, match: m[0], key: m[1], type: 'complex' });
      }
    }
  }

  if (fileMatches.length) {
    const hasUseLanguage = /useLanguage\s*\(|from\s+['"][^'"]*LanguageContext[^'"]*['"]/.test(text);
    const hasFormatMessage = /formatMessage\s*\(/.test(text);
    results.push({ file, matches: fileMatches, hasUseLanguage, hasFormatMessage });
  }
}

if (results.length === 0) {
  console.log('No occurrences found.');
  process.exit(0);
}

console.log('Found occurrences:');
for (const r of results) {
  console.log('\n' + r.file);
  for (const m of r.matches) {
    console.log(`  L${m.line}: [${m.type}] ${m.match}  -> key: ${m.key}`);
  }
  console.log(`  has useLanguage(): ${r.hasUseLanguage}, has formatMessage(): ${r.hasFormatMessage}`);
}

if (process.argv.includes('--apply')) {
  console.log('\n--apply: performing replacements where safe');
  for (const r of results) {
    if (!r.hasUseLanguage && !r.hasFormatMessage) {
      console.log(`Skipping ${r.file} (no useLanguage/formatMessage present)`);
      continue;
    }
    let text = fs.readFileSync(r.file, 'utf8');

    text = text.replace(/enqueueSnackbar\(\s*t\.([a-zA-Z0-9_.]+)\s*(,|\))/g, (_, key, tail) => `enqueueSnackbar(formatMessage('${key}')${tail}`);
    text = text.replace(/setSnackbarMsg\(\s*t\.([a-zA-Z0-9_.]+)\s*\)/g, (_, key) => `setSnackbarMsg(formatMessage('${key}'))`);
    text = text.replace(/onSnackbar\(\s*t\.([a-zA-Z0-9_.]+)\s*\)/g, (_, key) => `onSnackbar(formatMessage('${key}'))`);
    text = text.replace(/setSnackbar\(\s*t\.([a-zA-Z0-9_.]+)\s*(,|\))/g, (_, key, tail) => `setSnackbar(formatMessage('${key}')${tail}`);
    text = text.replace(/showSnackbar\(\s*t\.([a-zA-Z0-9_.]+)\s*(,|\))/g, (_, key, tail) => `showSnackbar(formatMessage('${key}')${tail}`);
    text = text.replace(/notify\(\s*t\.([a-zA-Z0-9_.]+)\s*(,|\))/g, (_, key, tail) => `notify(formatMessage('${key}')${tail}`);
    text = text.replace(/toast\(\s*t\.([a-zA-Z0-9_.]+)\s*(,|\))/g, (_, key, tail) => `toast(formatMessage('${key}')${tail}`);
    text = text.replace(/alert\(\s*t\.([a-zA-Z0-9_.]+)\s*(,|\))/g, (_, key, tail) => `alert(formatMessage('${key}')${tail}`);

    text = text.replace(/message=\{\s*t\.([a-zA-Z0-9_.]+)\s*\}/g, (_, key) => `message={formatMessage('${key}')}`);
    text = text.replace(/message:\s*t\.([a-zA-Z0-9_.]+)/g, (_, key) => `message: formatMessage('${key}')`);

    text = text.replace(/\$\{\s*t\.([a-zA-Z0-9_.]+)\s*\}/g, (_, key) => `\${formatMessage('${key}')}`);

    fs.writeFileSync(r.file, text, 'utf8');
    console.log(`Patched ${r.file}`);
  }
  console.log('Done. Please run typecheck.');
} else {
  console.log('\nRun this script with --apply to automatically patch files that already use useLanguage()/formatMessage.');
  console.log('Files with complex matches (template literals / concatenations) will need manual review.');
}
