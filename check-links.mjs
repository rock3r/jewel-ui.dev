// Checks internal links between the Markdown docs. Strict link checking is part of
// the contract (see docs/STYLE.md); a cross-link that points at nothing is worse than
// no cross-link, because the reader trusts it.
//
//   node check-links.mjs            report and exit non-zero on any broken link
//   node check-links.mjs --drafting tolerate links to pages not yet written
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, normalize, sep } from 'node:path';

const ROOT = 'docs';
const PUBLIC = 'public';
const drafting = process.argv.includes('--drafting');

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function headingIds(md) {
  const ids = new Set();
  for (const line of md.split('\n')) {
    const m = line.match(/^#{1,6}\s+(.*)$/);
    if (m) ids.add(slugify(m[1].trim()));
  }
  return ids;
}

const pages = new Map(); // rel path -> heading ids
for (const full of walk(ROOT).filter((f) => f.endsWith('.md'))) {
  const rel = relative(ROOT, full);
  const text = readFileSync(full, 'utf8');
  pages.set(rel, { text, ids: headingIds(text) });
}

// Trailing-slash targets are "generated sections". Only accept ones that exist under public/.
function generatedExists(urlPath) {
  // urlPath like /api/ or /docs/releases/ or releases/ (relative)
  let p = urlPath;
  if (p.startsWith('/')) p = p.slice(1);
  if (p.endsWith('/')) p = p.slice(0, -1);
  if (!p) return existsSync(PUBLIC);
  const abs = join(PUBLIC, p);
  return existsSync(abs);
}

let resolved = 0;
const missing = [];
const badFragments = [];
const badSections = [];

for (const [page, { text, ids: pageIds }] of [...pages.entries()].sort()) {
  for (const [, , target] of text.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
    if (/^(https?:|mailto:)/.test(target)) continue;

    // Same-page fragment: [x](#heading)
    if (target.startsWith('#')) {
      const frag = target.slice(1);
      if (!frag) continue;
      if (!pageIds.has(frag)) badFragments.push([page, target]);
      else resolved += 1;
      continue;
    }

    const hash = target.indexOf('#');
    const pathPart = hash === -1 ? target : target.slice(0, hash);
    const frag = hash === -1 ? '' : target.slice(hash + 1);

    if (!pathPart) continue;

    // Generated section (trailing slash), absolute or relative.
    if (pathPart.endsWith('/')) {
      const asPublic = pathPart.startsWith('/')
        ? pathPart
        : '/' + normalize(join(dirname(page), pathPart)).split(sep).join('/');
      // docs-relative "releases/" resolves under public/docs/releases
      let probe = pathPart;
      if (!probe.startsWith('/')) {
        probe = normalize(join('docs', dirname(page), pathPart)).split(sep).join('/');
      } else {
        probe = probe.slice(1);
      }
      if (probe.endsWith('/')) probe = probe.slice(0, -1);
      if (existsSync(join(PUBLIC, probe)) || existsSync(join(PUBLIC, probe + sep + 'index.html'))) {
        resolved += 1;
      } else {
        badSections.push([page, target, probe]);
      }
      continue;
    }

    const to = normalize(join(dirname(page), pathPart));
    if (pages.has(to)) {
      if (frag && !pages.get(to).ids.has(frag)) {
        badFragments.push([page, target]);
      } else {
        resolved += 1;
      }
      continue;
    }
    // Screenshots and other committed assets under docs/ count as resolved.
    try {
      if (statSync(join(ROOT, to)).isFile()) {
        resolved += 1;
        continue;
      }
    } catch {}
    missing.push([page, target, to]);
  }
}

console.log(`${resolved} internal links resolved across ${pages.size} pages`);
let failed = false;
if (badSections.length) {
  console.log(`\n${badSections.length} link(s) to missing generated sections:`);
  for (const [from, target, probe] of badSections) {
    console.log(`  ${from} -> ${target}   (no public/${probe})`);
  }
  failed = true;
}
if (badFragments.length) {
  console.log(`\n${badFragments.length} link(s) with unknown heading fragment:`);
  for (const [from, target] of badFragments) console.log(`  ${from} -> ${target}`);
  failed = true;
}
if (missing.length) {
  console.log(`\n${missing.length} link(s) with no target page:`);
  for (const [from, target, to] of missing) console.log(`  ${from} -> ${target}   (looked for ${to})`);
  failed = true;
}
if (failed && !drafting) {
  console.log('\nRun with --drafting while pages are still being written.');
  process.exitCode = 1;
} else if (!failed) {
  console.log('no broken links');
}
