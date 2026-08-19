// Builds the documentation site from docs/**/*.md into public/docs/.
// No dependencies: the Markdown surface used by these pages is small and fixed
// (h1-h3, flat bullets, fenced code, admonitions, inline formatting), so a
// bespoke renderer is smaller and more predictable than pulling in a parser.
//
// Design tokens are kept in sync with DESIGN.md and the landing page by hand.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';

const SRC = process.argv[2] ?? 'docs';
const OUT = process.argv[3] ?? 'public/docs';

// Navigation mirrors the ordering in docs/index.md. Adding a page means adding
// it here; the build fails loudly if a page on disk is missing from the nav.
const NAV = [
  { title: null, pages: ['index.md'] },
  { title: 'Get started', pages: ['start/plugin.md', 'start/standalone.md'] },
  {
    title: 'Guides',
    pages: [
      'guides/theming.md',
      'guides/swing-bridge.md',
      'guides/icons.md',
      'guides/typography.md',
      'guides/lists-and-trees.md',
      'guides/markdown.md',
      'guides/decorated-windows.md',
      'guides/swing-interop.md',
      'guides/code-highlighting.md',
    ],
  },
  {
    title: 'Best practices',
    pages: ['best-practices/portable-ui.md', 'best-practices/testing.md', 'best-practices/proguard.md'],
  },
  { title: 'Reference', pages: ['versioning.md'] },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .trim()
    .replace(/\s+/g, '-');

// ---------------------------------------------------------------- highlighting

const KOTLIN_KEYWORDS =
  /\b(package|import|fun|val|var|class|object|interface|data|sealed|enum|companion|override|private|internal|public|protected|return|if|else|when|for|while|do|in|is|as|null|true|false|this|super|by|get|set|const|lateinit|suspend|typealias|operator|inline|reified|vararg|out|abstract|open|annotation|init|throw|try|catch|finally)\b/;

// One pass, one alternation: each token is escaped as it is emitted, so nothing
// is escaped twice and no span can be produced inside a string or comment.
function highlightKotlin(code) {
  const re = new RegExp(
    [
      /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/.source, // comment
      /("""[\s\S]*?"""|"(?:[^"\\\n]|\\.)*")/.source, // string
      /(@\w+)/.source, // annotation
      /\b(\d[\w.]*)\b/.source, // number
      /([A-Za-z_]\w*)(?=\s*\()/.source, // call
      /([A-Za-z_]\w*)/.source, // word
    ].join('|'),
    'g'
  );
  let out = '';
  let last = 0;
  let m;
  while ((m = re.exec(code))) {
    out += esc(code.slice(last, m.index));
    const [text, comment, str, anno, num, call, word] = m;
    if (comment) out += `<span class="c-com">${esc(text)}</span>`;
    else if (str) out += `<span class="c-str">${esc(text)}</span>`;
    else if (anno) out += `<span class="c-kw">${esc(text)}</span>`;
    else if (num) out += `<span class="c-num">${esc(text)}</span>`;
    else if (call) out += `<span class="c-fn">${esc(text)}</span>`;
    else if (word) out += KOTLIN_KEYWORDS.test(word) ? `<span class="c-kw">${esc(text)}</span>` : esc(text);
    last = m.index + text.length;
  }
  return out + esc(code.slice(last));
}

// ---------------------------------------------------------------------- inline

function inline(md, hrefFix) {
  // Split on code spans first so nothing inside them is further formatted.
  const parts = md.split(/(`[^`]+`)/);
  return parts
    .map((part) => {
      if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
        return `<code>${esc(part.slice(1, -1))}</code>`;
      }
      let s = esc(part);
      s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => {
        const fixed = hrefFix(href);
        const external = /^https?:/.test(fixed);
        const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${fixed}"${attrs}>${text}</a>`;
      });
      s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      s = s.replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
      s = s.replace(/&lt;(https?:\/\/[^&]+)&gt;/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
      return s;
    })
    .join('');
}

// ----------------------------------------------------------------------- block

function renderBlocks(lines, hrefFix, headings) {
  let html = '';
  let i = 0;

  const paragraphText = (buf) => buf.join(' ').replace(/\s+/g, ' ').trim();

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    // Heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const text = h[2];
      const id = slug(text);
      if (level === 2 || level === 3) headings.push({ level, id, text: text.replace(/`/g, '') });
      const body = inline(text, hrefFix);
      html +=
        level === 1
          ? `<h1>${body}</h1>\n`
          : `<h${level} id="${id}"><a class="anchor" href="#${id}">${body}</a></h${level}>\n`;
      i++;
      continue;
    }

    // Fenced code
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const lang = fence[1] || 'text';
      const buf = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) buf.push(lines[i++]);
      i++; // closing fence
      const code = buf.join('\n');
      const rendered = lang === 'kotlin' ? highlightKotlin(code) : esc(code);
      html += `<div class="code"><pre><code class="lang-${lang}">${rendered}</code></pre></div>\n`;
      continue;
    }

    // Admonition: !!! type "Title", body indented by four spaces
    const adm = line.match(/^!!!\s+(\w+)(?:\s+"([^"]*)")?\s*$/);
    if (adm) {
      const kind = adm[1];
      const title = adm[2] ?? kind[0].toUpperCase() + kind.slice(1);
      i++;
      const buf = [];
      while (i < lines.length && (!lines[i].trim() || /^ {4}/.test(lines[i]))) {
        buf.push(lines[i].replace(/^ {4}/, ''));
        i++;
      }
      while (buf.length && !buf[buf.length - 1].trim()) buf.pop();
      html += `<div class="adm adm-${esc(kind)}"><p class="adm-title">${inline(title, hrefFix)}</p>\n`;
      html += renderBlocks(buf, hrefFix, []);
      html += `</div>\n`;
      continue;
    }

    // Bullet list. Continuation lines are indented; items are flat.
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && (/^[-*]\s+/.test(lines[i]) || (/^\s+\S/.test(lines[i]) && items.length))) {
        if (/^[-*]\s+/.test(lines[i])) items.push([lines[i].replace(/^[-*]\s+/, '')]);
        else items[items.length - 1].push(lines[i].trim());
        i++;
      }
      html += '<ul>\n';
      for (const item of items) html += `<li>${inline(paragraphText(item), hrefFix)}</li>\n`;
      html += '</ul>\n';
      continue;
    }

    // Paragraph
    const buf = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6}\s|```|!!!\s|[-*]\s)/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    if (buf.length) html += `<p>${inline(paragraphText(buf), hrefFix)}</p>\n`;
  }

  return html;
}

// ------------------------------------------------------------------ page shell

const CSS = `
:root { color-scheme: dark light; }
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; }

.page {
  --bg: #1E1F22; --panel: #2B2D30; --line: #393B40; --line-strong: #4E5157;
  --btn-border: #6F737A; --fg: #DFE1E5; --fg-2: #B4B8BF; --fg-3: #9DA0A8;
  --accent: #3574F0; --accent-hover: #366ACE; --link: #6B9BFA; --on-accent: #FFFFFF;
  --code-bg: #2B2D30; --sel: rgba(53, 116, 240, 0.16);
  --kw: #CF8E6D; --str: #6AAB73; --fn: #56A8F5; --com: #9DA0A8; --num: #2AACB8;
}
.page[data-theme="light"] {
  --bg: #FFFFFF; --panel: #F7F8FA; --line: #EBECF0; --line-strong: #C9CCD6;
  --btn-border: #818594; --fg: #27282E; --fg-2: #494B57; --fg-3: #6C707E;
  --accent: #3574F0; --accent-hover: #3369D6; --link: #315FBD; --on-accent: #FFFFFF;
  --code-bg: #F7F8FA; --sel: rgba(53, 116, 240, 0.10);
  --kw: #0033B3; --str: #067D17; --fn: #00627A; --com: #6C707E; --num: #1750EB;
}

.page {
  font-family: Inter, "Helvetica Neue", Helvetica, Arial, sans-serif;
  background: var(--bg); color: var(--fg);
  -webkit-font-smoothing: antialiased;
  scrollbar-color: var(--line-strong) transparent; scrollbar-width: thin;
  min-height: 100vh; font-size: 15px; line-height: 1.6;
}

/* header */
.top {
  position: sticky; top: 0; z-index: 20;
  display: flex; align-items: center; gap: 14px;
  height: 52px; padding: 0 20px;
  background: var(--bg); border-bottom: 1px solid var(--line);
}
.brand { display: flex; align-items: center; gap: 9px; text-decoration: none; color: var(--fg); }
.brand svg { display: block; width: 20px; height: 20px; }
.brand b { font-family: Archivo, Helvetica, Arial, sans-serif; font-weight: 700; font-size: 15.5px; letter-spacing: -0.01em; }
.brand span { color: var(--fg-3); font-size: 13.5px; }
.top-sp { flex: 1; }
.top a.tl { color: var(--fg-2); text-decoration: none; font-size: 13.5px; }
.top a.tl:hover { color: var(--fg); }
.tbtn {
  font: inherit; font-size: 13px; cursor: pointer;
  background: transparent; color: var(--fg-2);
  border: 1px solid var(--line-strong); border-radius: 6px; padding: 4px 10px;
}
.tbtn:hover { color: var(--fg); border-color: var(--btn-border); }

/* shell */
.shell { display: grid; grid-template-columns: 264px minmax(0, 1fr) 200px; gap: 0; align-items: start; }
@media (max-width: 1100px) { .shell { grid-template-columns: 240px minmax(0, 1fr); } .onthis { display: none; } }
@media (max-width: 760px) { .shell { grid-template-columns: minmax(0, 1fr); } .side { display: none; } }

/* left nav */
.side {
  position: sticky; top: 52px; align-self: start;
  height: calc(100vh - 52px); overflow-y: auto;
  border-right: 1px solid var(--line); padding: 20px 8px 40px 20px;
}
.side h4 {
  margin: 20px 0 6px; padding: 0 10px;
  font-size: 11.5px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--fg-3);
}
.side h4:first-child { margin-top: 0; }
.side a {
  display: block; padding: 5px 10px; margin: 1px 0;
  border-radius: 4px; text-decoration: none;
  color: var(--fg-2); font-size: 13.5px; line-height: 1.35;
}
.side a:hover { background: var(--panel); color: var(--fg); }
.side a[aria-current="page"] { background: var(--sel); color: var(--fg); font-weight: 500; }

/* content */
.main { padding: 34px 40px 90px; min-width: 0; }
.doc { max-width: 68ch; }
.doc h1 {
  font-family: Archivo, Helvetica, Arial, sans-serif;
  font-size: 30px; line-height: 1.15; font-weight: 700; letter-spacing: -0.02em;
  margin: 0 0 18px;
}
.doc h2 {
  font-family: Archivo, Helvetica, Arial, sans-serif;
  font-size: 20px; line-height: 1.25; font-weight: 600; letter-spacing: -0.01em;
  margin: 34px 0 10px; padding-top: 14px; border-top: 1px solid var(--line);
}
.doc h3 {
  font-family: Archivo, Helvetica, Arial, sans-serif;
  font-size: 16px; font-weight: 600; margin: 24px 0 8px;
}
.doc h2 a.anchor, .doc h3 a.anchor { color: inherit; text-decoration: none; }
.doc h2 a.anchor:hover::after, .doc h3 a.anchor:hover::after {
  content: " #"; color: var(--fg-3); font-weight: 400;
}
.doc p { margin: 0 0 14px; }
.doc ul { margin: 0 0 14px; padding-left: 20px; }
.doc li { margin: 5px 0; }
.doc a { color: var(--link); text-decoration: none; }
.doc a:hover { text-decoration: underline; }
.doc code {
  font-family: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 0.86em; background: var(--panel);
  border: 1px solid var(--line); border-radius: 4px; padding: 1px 5px;
}
.doc .code {
  background: var(--code-bg); border: 1px solid var(--line);
  border-radius: 8px; margin: 0 0 16px; overflow-x: auto;
}
.doc .code pre { margin: 0; padding: 13px 16px; }
.doc .code code {
  font-family: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 12.9px; line-height: 1.62; background: none; border: 0; padding: 0;
  white-space: pre;
}
.c-kw { color: var(--kw); } .c-str { color: var(--str); }
.c-fn { color: var(--fn); } .c-com { color: var(--com); } .c-num { color: var(--num); }

.adm {
  border: 1px solid var(--line-strong); border-left-width: 3px;
  border-radius: 6px; padding: 12px 15px; margin: 0 0 16px; background: var(--panel);
}
.adm-title { font-weight: 600; margin: 0 0 6px !important; font-size: 14px; }
.adm-warning { border-left-color: #E0A200; }
.adm-note { border-left-color: var(--accent); }
.adm > :last-child { margin-bottom: 0 !important; }

/* on this page */
.onthis { position: sticky; top: 52px; align-self: start; padding: 34px 20px 40px 0; max-height: calc(100vh - 52px); overflow-y: auto; }
.onthis h4 { margin: 0 0 8px; font-size: 11.5px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--fg-3); }
.onthis a { display: block; padding: 3px 0; color: var(--fg-3); text-decoration: none; font-size: 12.5px; line-height: 1.35; }
.onthis a:hover { color: var(--fg); }
.onthis a.lv3 { padding-left: 12px; }

.footer { margin-top: 46px; padding-top: 16px; border-top: 1px solid var(--line); color: var(--fg-3); font-size: 12.5px; }
.footer a { color: var(--link); text-decoration: none; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 3px; }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
`;

const JS = `
(function () {
  var page = document.querySelector('.page');
  function setTheme(t) {
    page.setAttribute('data-theme', t);
    var b = document.getElementById('theme-btn');
    if (b) b.textContent = t === 'dark' ? 'Light' : 'Dark';
    try { localStorage.setItem('jewel-theme', t); } catch (e) {}
  }
  var saved = null;
  try { saved = localStorage.getItem('jewel-theme'); } catch (e) {}
  if (!saved) saved = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  setTheme(saved);
  var btn = document.getElementById('theme-btn');
  if (btn) btn.addEventListener('click', function () {
    setTheme(page.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
})();
`;

const LOGO = `<svg viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" fill="#000"/><path d="M256 76L436 256L256 436L76 256L256 76Z" fill="#FFF"/><path d="M256 76L436 256H256V76Z" fill="#CCC"/><path d="M76 256L256 436V256H76Z" fill="#CCC"/><path d="M256 436L436 256H256V436Z" fill="#808080"/></svg>`;

// ------------------------------------------------------------------- the build

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (entry.endsWith('.md')) out.push(p);
  }
  return out;
}

const onDisk = walk(SRC).map((p) => relative(SRC, p)).sort();
const inNav = NAV.flatMap((s) => s.pages);
const missing = onDisk.filter((p) => !inNav.includes(p));
if (missing.length) {
  console.error(`Pages on disk but absent from NAV in build-docs.mjs: ${missing.join(', ')}`);
  process.exitCode = 1;
}
const absent = inNav.filter((p) => !onDisk.includes(p));
if (absent.length) {
  console.error(`Pages in NAV but absent from disk: ${absent.join(', ')}`);
  process.exitCode = 1;
}

const titleOf = (rel) => {
  const first = readFileSync(join(SRC, rel), 'utf8').split('\n').find((l) => /^#\s+/.test(l));
  return first ? first.replace(/^#\s+/, '').trim() : rel;
};
const titles = Object.fromEntries(inNav.map((p) => [p, titleOf(p)]));

const htmlPath = (rel) => rel.replace(/\.md$/, '.html');

function build(rel) {
  const md = readFileSync(join(SRC, rel), 'utf8');
  const depth = rel.split('/').length - 1;
  const up = depth ? '../'.repeat(depth) : './';

  // Links: .md becomes .html; anything already absolute or external is left alone.
  const hrefFix = (href) => {
    if (/^(https?:|mailto:|#)/.test(href)) return href;
    return href.replace(/\.md(?=$|#)/, '.html');
  };

  const headings = [];
  const body = renderBlocks(md.split('\n'), hrefFix, headings);

  const nav = NAV.map((section) => {
    const items = section.pages
      .map((p) => {
        const current = p === rel ? ' aria-current="page"' : '';
        return `<a href="${up}${htmlPath(p)}"${current}>${esc(titles[p])}</a>`;
      })
      .join('\n');
    return (section.title ? `<h4>${esc(section.title)}</h4>\n` : '') + items;
  }).join('\n');

  const onThis = headings.length
    ? `<h4>On this page</h4>\n` +
      headings.map((h) => `<a class="lv${h.level}" href="#${h.id}">${esc(h.text)}</a>`).join('\n')
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titles[rel])} — Jewel docs</title>
<meta name="color-scheme" content="dark light">
<meta name="robots" content="noindex">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<style>${CSS}</style>
</head>
<body>
<div class="page" data-theme="dark">
  <header class="top">
    <a class="brand" href="${up}index.html">${LOGO}<b>Jewel</b><span>docs</span></a>
    <div class="top-sp"></div>
    <a class="tl" href="https://github.com/JetBrains/intellij-community/tree/master/platform/jewel" target="_blank" rel="noopener noreferrer">Source</a>
    <a class="tl" href="https://youtrack.jetbrains.com/issues/JEWEL" target="_blank" rel="noopener noreferrer">Issues</a>
    <button class="tbtn" id="theme-btn" type="button">Light</button>
  </header>
  <div class="shell">
    <nav class="side" aria-label="Documentation">
${nav}
    </nav>
    <main class="main">
      <article class="doc">
${body}      <p class="footer">Jewel is a joint project by Google and JetBrains. Docs source on
        <a href="https://github.com/JetBrains/intellij-community/tree/master/platform/jewel" target="_blank" rel="noopener noreferrer">GitHub</a>.</p>
      </article>
    </main>
    <aside class="onthis">${onThis}</aside>
  </div>
</div>
<script>${JS}</script>
</body>
</html>
`;
}

let count = 0;
for (const rel of inNav) {
  const out = join(OUT, htmlPath(rel));
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, build(rel));
  count++;
}
console.log(`built ${count} doc pages into ${OUT}`);
