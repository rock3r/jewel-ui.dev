// Checks internal links between the Markdown docs. Strict link checking is part of
// the contract (see docs/STYLE.md); a cross-link that points at nothing is worse than
// no cross-link, because the reader trusts it.
//
//   node check-links.mjs            report and exit non-zero on any broken link
//   node check-links.mjs --drafting tolerate links to pages not yet written
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative, normalize } from 'node:path';

const ROOT = 'docs';
const drafting = process.argv.includes('--drafting');

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const pages = new Set(
  walk(ROOT).filter((f) => f.endsWith('.md')).map((f) => relative(ROOT, f))
);

let resolved = 0;
const missing = [];
const sections = [];

for (const page of [...pages].sort()) {
  const text = readFileSync(join(ROOT, page), 'utf8');
  for (const [, , target] of text.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
    if (/^(https?:|#|mailto:)/.test(target)) continue;
    const [path] = target.split('#');
    if (!path) continue;

    // A trailing slash means a generated section (components, api) that the site
    // build produces rather than a Markdown page in this repo.
    if (path.endsWith('/')) {
      sections.push([page, target]);
      continue;
    }

    const to = normalize(join(dirname(page), path));
    if (pages.has(to)) resolved += 1;
    else missing.push([page, target, to]);
  }
}

console.log(`${resolved} internal links resolved across ${pages.size} pages`);
if (sections.length) {
  console.log(`${sections.length} link(s) to generated sections (not checked here):`);
  for (const [from, target] of sections) console.log(`  ${from} -> ${target}`);
}
if (missing.length) {
  console.log(`\n${missing.length} link(s) with no target page:`);
  for (const [from, target, to] of missing) console.log(`  ${from} -> ${target}   (looked for ${to})`);
  if (!drafting) {
    console.log('\nRun with --drafting while pages are still being written.');
    process.exitCode = 1;
  }
} else {
  console.log('no broken links');
}
