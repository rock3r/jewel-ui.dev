#!/usr/bin/env node
// Pulls published Jewel Dokka (javadoc jars from Maven Central) into public/api/.
// The site links to /api/; those pages are generated, not hand-written (see AGENTS.md).
//
 //   node sync-api-docs.mjs              # version from public/index.html, else Maven latest
//   node sync-api-docs.mjs --version V
//
 // Requires network. Commits the unpacked HTML under public/api/ so Cloudflare
 // Workers can serve it without a Jewel checkout at deploy time.
import { createWriteStream, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { Readable } from 'node:stream';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'public', 'api');
const MAVEN = 'https://repo1.maven.org/maven2/org/jetbrains/jewel';

// Public modules that publish a -javadoc.jar. Names match Maven Central.
const MODULES = [
  { id: 'jewel-foundation', title: 'Foundation', blurb: 'Theme, utilities, and the shared primitives.' },
  { id: 'jewel-ui', title: 'UI', blurb: 'The component library.' },
  { id: 'jewel-int-ui-standalone', title: 'Int UI standalone', blurb: 'Standalone Int UI theme and painters.' },
  { id: 'jewel-decorated-window', title: 'Decorated window', blurb: 'Custom title bar and window chrome.' },
  { id: 'jewel-markdown-core', title: 'Markdown', blurb: 'CommonMark rendering with Jewel components.' },
  {
    id: 'jewel-markdown-int-ui-standalone-styling',
    title: 'Markdown · Int UI styling',
    blurb: 'Standalone Int UI styling for the Markdown renderer.',
  },
];

function argVersion() {
  const i = process.argv.indexOf('--version');
  return i >= 0 ? process.argv[i + 1] : null;
}

function versionFromSite() {
  const index = join(HERE, 'public', 'index.html');
  if (!existsSync(index)) return null;
  const html = readFileSync(index, 'utf8');
  const m = html.match(/\b(\d+\.\d+\.\d+-\d[\w.]*)\b/);
  return m ? m[1] : null;
}

async function mavenLatest() {
  const xml = await fetch(`${MAVEN}/jewel-ui/maven-metadata.xml`).then((r) => {
    if (!r.ok) throw new Error(`maven-metadata.xml HTTP ${r.status}`);
    return r.text();
  });
  const m = xml.match(/<latest>([^<]+)<\/latest>/);
  if (!m) throw new Error('no <latest> in maven-metadata.xml');
  return m[1];
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

function unpackJar(jar, dest) {
  mkdirSync(dest, { recursive: true });
  execFileSync('jar', ['xf', jar], { cwd: dest, stdio: 'pipe' });
}

function writeIndex(version, present) {
  const items = present
    .map(
      (m) => `    <li class="card">
      <a href="./${m.id}/"><strong>${m.title}</strong></a>
      <span>${m.blurb}</span>
    </li>`
    )
    .join('\n');
  const html = `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>API reference — Jewel</title>
<meta name="color-scheme" content="dark light">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700&family=Inter:wght@400;500;600&display=swap">
<style>
:root { color-scheme: dark light; }
body { margin: 0; font-family: Inter, Helvetica, Arial, sans-serif; background: #1E1F22; color: #DFE1E5; }
@media (prefers-color-scheme: light) {
  body { background: #fff; color: #27282E; }
  a { color: #315FBD; }
  .card { background: #F7F8FA; border-color: #EBECF0; }
  .muted { color: #6C707E; }
}
a { color: #6B9BFA; text-decoration: none; }
a:hover { text-decoration: underline; }
.wrap { max-width: 720px; margin: 0 auto; padding: 48px 24px 80px; }
h1 { font-family: Archivo, Helvetica, Arial, sans-serif; font-size: 28px; letter-spacing: -0.02em; margin: 0 0 12px; }
.muted { color: #9DA0A8; font-size: 14.5px; line-height: 1.55; margin: 0 0 28px; }
ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.card {
  display: flex; flex-direction: column; gap: 4px;
  padding: 14px 16px; border-radius: 8px;
  background: #2B2D30; border: 1px solid #393B40;
}
.card span { color: inherit; opacity: 0.72; font-size: 13.5px; line-height: 1.45; }
.top { font-size: 13.5px; margin-bottom: 28px; }
</style>
</head>
<body>
  <div class="wrap">
    <p class="top"><a href="/docs/">← Docs</a></p>
    <h1>API reference</h1>
    <p class="muted">Generated Dokka for Jewel <code>${version}</code>, published from Maven Central.
      Each module opens its own reference. Start with <a href="./jewel-ui/">UI</a> for components.</p>
    <ul>
${items}
    </ul>
  </div>
</body>
</html>
`;
  writeFileSync(join(OUT, 'index.html'), html);
}

const version = argVersion() || versionFromSite() || (await mavenLatest());
console.log(`syncing API docs for Jewel ${version}`);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const scratch = join(tmpdir(), `jewel-api-${version}`);
rmSync(scratch, { recursive: true, force: true });
mkdirSync(scratch, { recursive: true });

const present = [];
for (const mod of MODULES) {
  const url = `${MAVEN}/${mod.id}/${version}/${mod.id}-${version}-javadoc.jar`;
  const jar = join(scratch, `${mod.id}.jar`);
  process.stdout.write(`  ${mod.id}… `);
  try {
    await download(url, jar);
  } catch (e) {
    console.log(`skip (${e.message})`);
    continue;
  }
  const dest = join(OUT, mod.id);
  unpackJar(jar, dest);
  present.push(mod);
  console.log('ok');
}

if (!present.length) {
  console.error('no javadoc jars downloaded');
  process.exit(1);
}

writeIndex(version, present);
writeFileSync(
  join(OUT, '.sync-meta.json'),
  JSON.stringify(
    {
      version,
      when: new Date().toISOString(),
      modules: present.map((m) => m.id),
      source: 'maven-central-javadoc-jar',
    },
    null,
    2
  ) + '\n'
);

console.log(`wrote ${present.length} modules into public/api/`);
