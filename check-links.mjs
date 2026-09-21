// Checks internal links between the Markdown docs. Strict link checking is part of
// the contract (see docs/STYLE.md); a cross-link that points at nothing is worse than
// no cross-link, because the reader trusts it.
//
//   node check-links.mjs            report and exit non-zero on any broken link
//   node check-links.mjs --drafting tolerate links to pages not yet written
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative, normalize } from 'node:path';

const ROOT = 'docs';
const PUBLIC = 'public';
const drafting = process.argv.includes('--drafting');

// Keep in lockstep with slug() in build-docs.mjs. h1 has no id; h2–h6 do.
function slug(s) {
  return s
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function headingIds(text) {
  const ids = new Set();
  for (const line of text.split('\n')) {
    const h = line.match(/^(#{2,6})\s+(.*)$/);
    if (h) ids.add(slug(h[2]));
  }
  return ids;
}

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function generatedExists(sitePath) {
  const dir = join(PUBLIC, sitePath);
  try {
    const st = statSync(dir);
    if (st.isFile()) return true;
    if (st.isDirectory()) return existsSync(join(dir, 'index.html'));
  } catch {
    /* fall through */
  }
  return existsSync(`${dir}.html`);
}

const pages = new Set(walk(ROOT).filter((f) => f.endsWith('.md')).map((f) => relative(ROOT, f)));
const pageText = Object.fromEntries([...pages].map((p) => [p, readFileSync(join(ROOT, p), 'utf8')]));

let resolved = 0;
const missing = [];
const sections = [];

for (const page of [...pages].sort()) {
  const text = pageText[page];
  for (const [, , target] of text.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
    if (/^(https?:|mailto:)/.test(target)) continue;

    const hash = target.indexOf('#');
    const path = hash === -1 ? target : target.slice(0, hash);
    const fragment = hash === -1 ? '' : target.slice(hash + 1);

    if (!path) {
      if (fragment && !headingIds(text).has(fragment)) {
        missing.push([page, target, `#${fragment} on this page`]);
      } else {
        resolved += 1;
      }
      continue;
    }

    // A trailing slash means a generated section (api, and any future gallery)
    // under public/, not a Markdown page in this repo.
    if (path.endsWith('/')) {
      const sitePath = normalize(join('docs', dirname(page), path));
      if (!generatedExists(sitePath)) {
        missing.push([page, target, `public/${sitePath}`]);
        continue;
      }
      sections.push([page, target]);
      resolved += 1;
      continue;
    }

    const to = normalize(join(dirname(page), path));
    if (pages.has(to)) {
      if (fragment && !headingIds(pageText[to]).has(fragment)) {
        missing.push([page, target, `${to}#${fragment}`]);
        continue;
      }
      resolved += 1;
      continue;
    }
    // Screenshots and other committed assets under docs/ count as resolved.
    try {
      if (statSync(join(ROOT, to)).isFile()) {
        resolved += 1;
        continue;
      }
    } catch {
      /* not an asset */
    }
    missing.push([page, target, to]);
  }
}

console.log(`${resolved} internal links resolved across ${pages.size} pages`);
if (sections.length) {
  console.log(`${sections.length} link(s) to generated sections:`);
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
