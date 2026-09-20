#!/usr/bin/env node
// Copies Jewel Tooling's public user-guide into docs/tooling/ so the Cloudflare
// Worker can serve it without needing the sibling repo at deploy time.
//
//   node sync-tooling-docs.mjs
//
// Looks for ../jewel-tooling/user-guide relative to this repo. When that tree is
// missing, leaves the already-committed docs/tooling/ alone and exits 0 after a
// freshness note. When present, rewrites the Markdown into docs/tooling/, copies
// screenshots (not images/marketplace/), and records the source commit.
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEST = join(HERE, 'docs', 'tooling');
const CANDIDATES = [
  join(HERE, '..', 'jewel-tooling', 'user-guide'),
  join(HERE, '..', 'jewel-tooling', 'user-guide'),
];

const src = CANDIDATES.find((p) => existsSync(p));
const metaPath = join(DEST, '.sync-meta.json');

function walkFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === 'marketplace') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

function mapRel(rel) {
  if (rel === 'README.md') return 'index.md';
  if (rel === 'agents/README.md') return 'agents/index.md';
  return rel;
}

const ESCAPES = [
  ['../CONTRIBUTING.md', 'https://github.com/rock3r/jewel-tooling/blob/master/CONTRIBUTING.md'],
  ['../docs/architecture.md', 'https://github.com/rock3r/jewel-tooling/blob/master/docs/architecture.md'],
  ['../docs/testing.md', 'https://github.com/rock3r/jewel-tooling/blob/master/docs/testing.md'],
  ['../docs/recording-adapter.md', 'https://github.com/rock3r/jewel-tooling/blob/master/docs/recording-adapter.md'],
];

function rewriteMarkdown(text) {
  let out = text;
  // Preserve fragments on contributor escapes.
  for (const [from, to] of ESCAPES) {
    const esc = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`\\]\\(${esc}(#[^)]*)?\\)`, 'g'), (_, frag) => `](${to}${frag || ''})`);
  }
  // In-tree README.md links become index.md (same directory or agents/).
  out = out.replace(/\]\((?:\.\.\/)?README\.md(#[^)]*)?\)/g, '](index.md$1)');
  out = out.replace(/\]\((?:\.\.\/)?agents\/README\.md(#[^)]*)?\)/g, '](agents/index.md$1)');
  return out;
}

if (!src) {
  if (!existsSync(DEST)) {
    console.error('docs/tooling/ is missing and ../jewel-tooling/user-guide was not found.');
    process.exit(1);
  }
  let note = 'sibling jewel-tooling/user-guide not found; keeping committed docs/tooling/';
  if (existsSync(metaPath)) {
    const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
    note += ` (last sync ${meta.commit} from ${meta.when})`;
  }
  console.log(note);
  process.exit(0);
}

const toolingRoot = join(src, '..');
const commit = execFileSync('git', ['-C', toolingRoot, 'rev-parse', 'HEAD'], {
  encoding: 'utf8',
}).trim();
const short = commit.slice(0, 7);

// Refresh destination but keep the directory itself.
mkdirSync(DEST, { recursive: true });
for (const name of readdirSync(DEST)) {
  rmSync(join(DEST, name), { recursive: true, force: true });
}

const files = walkFiles(src);
let mdCount = 0;
let assetCount = 0;
for (const full of files) {
  const rel = relative(src, full).replaceAll('\\\\', '/');
  if (rel.startsWith('images/marketplace/') || rel.includes('/marketplace/')) continue;
  if (rel.endsWith('.md')) {
    const destRel = mapRel(rel);
    const dest = join(DEST, destRel);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, rewriteMarkdown(readFileSync(full, 'utf8')));
    mdCount += 1;
  } else if (/\.(png|jpe?g|gif|webp|svg)$/i.test(rel)) {
    const dest = join(DEST, rel);
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(full, dest);
    assetCount += 1;
  }
}

const meta = {
  commit,
  short,
  when: new Date().toISOString(),
  source: relative(HERE, src).replaceAll('\\\\', '/'),
  markdownFiles: mdCount,
  assets: assetCount,
};
writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');
console.log(
  `synced ${mdCount} markdown pages and ${assetCount} assets from ${meta.source} @ ${short}`
);
