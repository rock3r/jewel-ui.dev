#!/usr/bin/env node
// Build modern Dokka HTML for Jewel and publish under public/api/.
// Maven Central only ships the old Javadoc-format -javadoc.jar; we generate
// Dokka's HTML format from the published -sources.jar + binary classpath.
//
//   node sync-api-docs.mjs              # version from public/index.html, else Maven latest
//   node sync-api-docs.mjs --version V
//
// Needs network, JDK 21 (Dokka 2.0 breaks on 25), and tools/api-dokka/gradlew.
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
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir, tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'public', 'api');
const TOOLS = join(HERE, 'tools', 'api-dokka');
const MAVEN = 'https://repo1.maven.org/maven2/org/jetbrains/jewel';

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

const LOGO = `<svg viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" fill="#000"/><path d="M256 76L436 256L256 436L76 256L256 76Z" fill="#FFF"/><path d="M256 76L436 256H256V76Z" fill="#CCC"/><path d="M76 256L256 436V256H76Z" fill="#CCC"/><path d="M256 436L436 256H256V436Z" fill="#808080"/></svg>`;

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

function findJdk21() {
  if (process.env.JEWEL_DOKKA_JAVA_HOME) {
    const h = process.env.JEWEL_DOKKA_JAVA_HOME;
    if (existsSync(join(h, 'bin', 'java'))) return h;
  }
  try {
    const home = execFileSync('/usr/libexec/java_home', ['-v', '21'], { encoding: 'utf8' }).trim();
    if (home) return home;
  } catch {
    /* fall through */
  }
  for (const c of [
    join(homedir(), 'Library/Java/JavaVirtualMachines/temurin-21.0.12.1/Contents/Home'),
    join(homedir(), 'Library/Java/JavaVirtualMachines/temurin-21.0.12/Contents/Home'),
  ]) {
    if (existsSync(join(c, 'bin', 'java'))) return c;
  }
  throw new Error('JDK 21 required (Dokka 2.0 breaks on Java 25). Set JEWEL_DOKKA_JAVA_HOME.');
}

function resolveArtifacts(version, jdkHome) {
  writeFileSync(
    join(TOOLS, 'gradle.properties'),
    [
      'org.gradle.jvmargs=-Xmx2g',
      'dokkaVersion=2.0.0',
      `jewelVersion=${version}`,
      `org.gradle.java.home=${jdkHome}`,
      '',
    ].join('\n'),
  );
  execFileSync(join(TOOLS, 'gradlew'), ['resolveAll'], {
    cwd: TOOLS,
    stdio: 'inherit',
    env: { ...process.env, JAVA_HOME: jdkHome },
  });
  return join(TOOLS, 'build', 'resolved');
}

function unpackSources(jar, dest) {
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  execFileSync('jar', ['xf', jar], { cwd: dest, stdio: 'pipe' });
}

function runDokka({
  cliJar,
  plugins,
  sourcesDir,
  classpath,
  outDir,
  moduleId,
  version,
  jdkHome,
  workDir,
  delayTemplateSubstitution = false,
}) {
  mkdirSync(outDir, { recursive: true });
  mkdirSync(workDir, { recursive: true });
  const cfg = {
    moduleName: moduleId,
    moduleVersion: version,
    outputDir: outDir,
    delayTemplateSubstitution,
    pluginsClasspath: plugins,
    sourceSets: [
      {
        displayName: moduleId.replace(/^jewel-/, ''),
        sourceSetID: { scopeId: moduleId, sourceSetName: 'main' },
        sourceRoots: [sourcesDir],
        classpath,
        analysisPlatform: 'jvm',
      },
    ],
  };
  const jsonPath = join(workDir, `${moduleId}.json`);
  writeFileSync(jsonPath, JSON.stringify(cfg, null, 2));
  execFileSync(join(jdkHome, 'bin', 'java'), ['-Xmx2g', '-jar', cliJar, jsonPath], {
    stdio: 'inherit',
    env: { ...process.env, JAVA_HOME: jdkHome },
  });
}

function runDokkaAggregate({ cliJar, plugins, modules, version, outDir, jdkHome, workDir }) {
  mkdirSync(outDir, { recursive: true });
  mkdirSync(workDir, { recursive: true });
  const cfg = {
    moduleName: 'Jewel',
    moduleVersion: version,
    outputDir: outDir,
    delayTemplateSubstitution: false,
    pluginsClasspath: plugins,
    modules: modules.map((m) => ({
      name: m.id,
      relativePathToOutputDirectory: m.id,
      sourceOutputDirectory: m.partialDir,
      includes: [],
    })),
  };
  const jsonPath = join(workDir, 'aggregate.json');
  writeFileSync(jsonPath, JSON.stringify(cfg, null, 2));
  execFileSync(join(jdkHome, 'bin', 'java'), ['-Xmx2g', '-jar', cliJar, jsonPath], {
    stdio: 'inherit',
    env: { ...process.env, JAVA_HOME: jdkHome },
  });
}

function walkHtml(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkHtml(full, files);
    else if (name.endsWith('.html')) files.push(full);
  }
  return files;
}

function siteChromeCss() {
  return `/* Jewel site chrome sitting above Dokka */
:root {
  --jewel-top-h: 52px;
  --jewel-bg: #1e1f22;
  --jewel-fg: #dfe1e5;
  --jewel-fg-2: #b4b8bf;
  --jewel-fg-3: #9da0a8;
  --jewel-line: #393b40;
  --jewel-btn-border: #6f737a;
}
html:not(.theme-dark) {
  --jewel-bg: #ffffff;
  --jewel-fg: #27282e;
  --jewel-fg-2: #494b57;
  --jewel-fg-3: #6c707e;
  --jewel-line: #ebecf0;
  --jewel-btn-border: #818594;
}
#jewel-top {
  position: fixed; inset: 0 0 auto 0; z-index: 1000;
  height: var(--jewel-top-h); box-sizing: border-box;
  display: flex; align-items: center; gap: 12px;
  padding: 0 18px;
  background: var(--jewel-bg);
  border-bottom: 1px solid var(--jewel-line);
  font-family: Inter, Helvetica, Arial, sans-serif;
  color: var(--jewel-fg);
}
#jewel-top a { color: var(--jewel-fg-2); text-decoration: none; font-size: 13.5px; }
#jewel-top a:hover { color: var(--jewel-fg); }
#jewel-top .brand {
  display: inline-flex; align-items: center; gap: 8px;
  color: var(--jewel-fg) !important; font-weight: 700; font-size: 15px;
  font-family: Archivo, Helvetica, Arial, sans-serif; letter-spacing: -0.01em;
}
#jewel-top .brand svg { width: 20px; height: 20px; display: block; }
#jewel-top .brand-sub { color: var(--jewel-fg-3); margin-left: -4px; }
#jewel-top a[aria-current="page"] { color: var(--jewel-fg); font-weight: 500; }
#jewel-top .sp { flex: 1; }
#jewel-top .tbtn {
  font: inherit; font-size: 13px; cursor: pointer;
  background: transparent; color: var(--jewel-fg-2);
  border: 1px solid var(--jewel-btn-border); border-radius: 6px; padding: 4px 10px;
}
#jewel-top .tbtn:hover { color: var(--jewel-fg); }
body > .root { padding-top: var(--jewel-top-h); }
.navigation { top: var(--jewel-top-h) !important; }
#leftColumn { top: calc(var(--jewel-top-h) + 52px) !important; }
@media (max-width: 759px) {
  #leftColumn { top: var(--jewel-top-h) !important; }
}
`;
}

function siteChromeJs() {
  return `(function () {
  function preferred() {
    try {
      var s = localStorage.getItem('jewel-theme');
      if (s === 'light' || s === 'dark') return s;
    } catch (e) {}
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light' : 'dark';
  }
  function apply(theme) {
    var dark = theme === 'dark';
    document.documentElement.classList.toggle('theme-dark', dark);
    try { localStorage.setItem('jewel-theme', theme); } catch (e) {}
    try { localStorage.setItem('dokka-dark-mode', JSON.stringify(dark)); } catch (e) {}
    var btn = document.getElementById('jewel-theme-btn');
    if (btn) btn.textContent = dark ? 'Light' : 'Dark';
  }
  apply(preferred());
  var btn = document.getElementById('jewel-theme-btn');
  if (btn) btn.addEventListener('click', function () {
    apply(document.documentElement.classList.contains('theme-dark') ? 'light' : 'dark');
  });
  var dokkaBtn = document.getElementById('theme-toggle-button');
  if (dokkaBtn) dokkaBtn.addEventListener('click', function () {
    setTimeout(function () {
      var dark = document.documentElement.classList.contains('theme-dark');
      try { localStorage.setItem('jewel-theme', dark ? 'dark' : 'light'); } catch (e) {}
      var b = document.getElementById('jewel-theme-btn');
      if (b) b.textContent = dark ? 'Light' : 'Dark';
    }, 0);
  });
  window.addEventListener('storage', function (e) {
    if (e.key === 'jewel-theme' && (e.newValue === 'light' || e.newValue === 'dark')) apply(e.newValue);
  });
})();
`;
}

function topBarHtml() {
  return `<header id="jewel-top">
  <a class="brand" href="/" title="Jewel home">${LOGO}<span>Jewel</span></a>
  <a class="brand-sub" href="/docs/">docs</a>
  <a href="/api/" aria-current="page">API</a>
  <div class="sp"></div>
  <a href="https://github.com/JetBrains/intellij-community/tree/master/platform/jewel" target="_blank" rel="noopener noreferrer">Source</a>
  <a href="https://youtrack.jetbrains.com/issues/JEWEL" target="_blank" rel="noopener noreferrer">Issues</a>
  <button class="tbtn" id="jewel-theme-btn" type="button">Light</button>
</header>
`;
}

function injectChrome(root) {
  const cssHref = '/api/_chrome.css';
  const jsHref = '/api/_chrome.js';
  const bar = topBarHtml();
  for (const file of walkHtml(root)) {
    // Dokka loads navigation.html into #sideMenu — never inject site chrome there.
    if (file.endsWith('/navigation.html') || file.endsWith('navigation.html')) continue;
    let html = readFileSync(file, 'utf8');
    if (html.includes('id="jewel-top"')) continue;
    if (!/<html[\s>]/i.test(html)) continue;
    if (!html.includes(cssHref)) {
      html = html.replace(
        /<\/head>/i,
        `  <link rel="stylesheet" href="${cssHref}">\n  <script src="${jsHref}" defer></script>\n</head>`,
      );
    }
    if (/<body[^>]*>/i.test(html)) html = html.replace(/<body[^>]*>/i, (m) => `${m}\n${bar}`);
    else html = bar + html;
    writeFileSync(file, html);
  }
}


const version = argVersion() || versionFromSite() || (await mavenLatest());
const jdkHome = findJdk21();
console.log(`syncing modern Dokka API docs for Jewel ${version}`);
console.log(`using JDK ${jdkHome}`);

const resolved = resolveArtifacts(version, jdkHome);
const cliJar = readFileSync(join(resolved, 'dokka-cli.txt'), 'utf8').trim();
const plugins = readFileSync(join(resolved, 'dokka-plugins.txt'), 'utf8')
  .trim()
  .split('\n')
  .filter(Boolean);

const work = join(tmpdir(), `jewel-api-dokka-${version}`);
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const partialRoot = join(work, 'partial');
const present = [];
for (const mod of MODULES) {
  const srcJar = readFileSync(join(resolved, `${mod.id}-sources.txt`), 'utf8').trim();
  const cp = readFileSync(join(resolved, `${mod.id}-classpath.txt`), 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean);
  const srcDir = join(work, 'sources', mod.id);
  const partialDir = join(partialRoot, mod.id);
  process.stdout.write(`  ${mod.id} (partial)… `);
  try {
    unpackSources(srcJar, srcDir);
    runDokka({
      cliJar,
      plugins,
      sourcesDir: srcDir,
      classpath: cp,
      outDir: partialDir,
      moduleId: mod.id,
      version,
      jdkHome,
      workDir: join(work, 'json'),
      delayTemplateSubstitution: true,
    });
    present.push({ ...mod, partialDir });
    console.log('ok');
  } catch (e) {
    console.log(`fail (${e.message})`);
  }
}

if (!present.length) {
  console.error('no modules generated');
  process.exit(1);
}

console.log('aggregating multimodule publication…');
runDokkaAggregate({
  cliJar,
  plugins,
  modules: present,
  version,
  outDir: OUT,
  jdkHome,
  workDir: join(work, 'json'),
});

writeFileSync(join(OUT, '_chrome.css'), siteChromeCss());
writeFileSync(join(OUT, '_chrome.js'), siteChromeJs());
injectChrome(OUT);

writeFileSync(
  join(OUT, '.sync-meta.json'),
  JSON.stringify(
    {
      version,
      when: new Date().toISOString(),
      modules: present.map((m) => m.id),
      source: 'maven-central-sources-jar+dokka-html-multimodule',
      dokkaVersion: '2.0.0',
    },
    null,
    2,
  ) + '\n',
);

console.log(`wrote multimodule Dokka for ${present.length} modules into public/api/`);
