// Builds the production jewel-ui.dev page from the design source (Main.dc.html).
// Keeps both theme variants in the DOM so the toggle is instant, and wires up the
// two real interactions (theme toggle, setup popover).
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = process.argv[2];
const OUT = process.argv[3];
const raw = readFileSync(SRC, 'utf8');

const tpl = raw.match(/<x-dc>([\s\S]*?)<\/x-dc>/)[1];
const helmet = (tpl.match(/<helmet>([\s\S]*?)<\/helmet>/) || [, ''])[1];
const body = tpl.replace(/<helmet>[\s\S]*?<\/helmet>/, '');
const m = raw.match(/<script data-dc-script data-props='([\s\S]*?)'>([\s\S]*?)<\/script>/);
const props = JSON.parse(m[1]);
const code = m[2];

class DCLogic {
  constructor(p) { this.props = p; }
  setState() {}
}
const Component = new Function('DCLogic', `${code}\nreturn Component;`)(DCLogic);

const lookup = (path, scope) => {
  if (path === 'true') return true;
  if (path === 'false') return false;
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), scope);
};

function matchingClose(html, name, openEnd) {
  const re = new RegExp(`<${name}[\\s>]|</${name}>`, 'g');
  re.lastIndex = openEnd;
  let depth = 1, mm;
  while ((mm = re.exec(html))) {
    if (mm[0].startsWith('</')) {
      if (--depth === 0) return { inner: [openEnd, mm.index], after: mm.index + mm[0].length };
    } else depth++;
  }
  throw new Error(`unclosed <${name}>`);
}

function render(html, scope) {
  let out = '', i = 0, mm;
  const openRe = /<sc-(for|if)\b([^>]*)>/g;
  while ((mm = openRe.exec(html))) {
    out += substitute(html.slice(i, mm.index), scope);
    const name = `sc-${mm[1]}`;
    const attrs = mm[2];
    const { inner, after } = matchingClose(html, name, mm.index + mm[0].length);
    const innerHtml = html.slice(inner[0], inner[1]);

    if (mm[1] === 'for') {
      const listPath = attrs.match(/list="\{\{\s*([\w.$]+)\s*\}\}"/)[1];
      const alias = attrs.match(/as="(\w+)"/)[1];
      out += (lookup(listPath, scope) || [])
        .map((item, idx) => render(innerHtml, { ...scope, [alias]: item, $index: idx }))
        .join('');
    } else {
      const cond = attrs.match(/value="\{\{\s*([\w.$]+)\s*\}\}"/)[1];
      // Both theme variants ship in the DOM; CSS picks one, so the toggle is instant.
      if (cond === 'isDark' || cond === 'isLight') {
        const cls = cond === 'isDark' ? 'only-dark' : 'only-light';
        out += `<span class="${cls}">${render(innerHtml, scope)}</span>`;
      } else {
        out += lookup(cond, scope) ? render(innerHtml, scope) : '';
      }
    }
    i = after;
    openRe.lastIndex = after;
  }
  out += substitute(html.slice(i), scope);
  return out;
}

function substitute(html, scope) {
  return html
    .replace(/\sonClick="\{\{\s*toggleTheme\s*\}\}"/g, ' data-theme-toggle')
    .replace(/\sonClick="\{\{\s*w\.toggle\s*\}\}"/g, ' data-info-toggle')
    .replace(/\son[A-Z]\w*="\{\{[^}]*\}\}"/g, '')
    .replace(/\{\{\s*themeLabel\s*\}\}/g, '<span id="theme-label">Dark</span>')
    .replace(/\{\{\s*w\.popClass\s*\}\}/g, 'info-pop')
    .replace(/\{\{\s*w\.expanded\s*\}\}/g, 'false')
    .replace(/\{\{\s*([\w.$]+)\s*\}\}/g, (_x, path) => {
      const v = lookup(path, scope);
      if (v === undefined) console.error(`MISSING: {{${path}}}`);
      return v == null ? '' : String(v);
    });
}

const defaults = {};
for (const [k, v] of Object.entries(props)) if (!k.startsWith('$')) defaults[k] = v.default;
defaults.dark = true;
const vals = new Component(defaults).renderVals();
const rendered = render(body, vals);
const pageInner = rendered.slice(
  rendered.indexOf('>', rendered.indexOf('<div class="page"')) + 1,
  rendered.lastIndexOf('</div>')
);

const unresolved = pageInner.match(/\{\{[^}]*\}\}|<sc-(for|if)/g);
if (unresolved) {
  console.error('UNRESOLVED:', [...new Set(unresolved)].join(', '));
  process.exitCode = 1;
}

const EXTRA_CSS = `
    .only-dark, .only-light { display: contents; }
    .page[data-theme="dark"] .only-light { display: none; }
    .page[data-theme="light"] .only-dark { display: none; }
`;

const JS = `
(function () {
  var page = document.querySelector('.page');
  var label = document.getElementById('theme-label');
  function setTheme(t) {
    page.setAttribute('data-theme', t);
    if (label) label.textContent = t === 'dark' ? 'Dark' : 'Light';
    try { localStorage.setItem('jewel-theme', t); } catch (e) {}
  }
  var saved = null;
  try { saved = localStorage.getItem('jewel-theme'); } catch (e) {}
  if (!saved) {
    saved = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  setTheme(saved);

  var toggle = document.querySelector('[data-theme-toggle]');
  if (toggle) {
    toggle.addEventListener('click', function () {
      setTheme(page.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  var infoBtn = document.querySelector('[data-info-toggle]');
  var pop = document.getElementById('hot-reload-setup');
  if (infoBtn && pop) {
    infoBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = pop.classList.toggle('is-open');
      infoBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!pop.contains(e.target)) {
        pop.classList.remove('is-open');
        infoBtn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        pop.classList.remove('is-open');
        infoBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }
})();
`;

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Jewel — Compose for Desktop that already looks like the IDE</title>
<meta name="description" content="Jewel implements the IntelliJ Platform's New UI in Compose for Desktop: 40+ components built to the real Int UI specs, plus a Swing bridge that makes your plugin follow the user's theme.">
<meta name="color-scheme" content="dark light">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:title" content="Jewel — Compose for Desktop that already looks like the IDE">
<meta property="og:description" content="The IntelliJ Platform's New UI, in Compose for Desktop. 40+ components built to the real Int UI specs, plus a Swing bridge that follows the user's theme.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://jewel-ui.dev/">
${helmet.trim()}
<style>${EXTRA_CSS}</style>
</head>
<body>
<div class="page" data-theme="dark">
${pageInner}
</div>
<script>${JS}</script>
</body>
</html>
`;

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'index.html'), page);

const srcDir = SRC.replace(/\/[^/]+$/, '');
for (const f of readdirSync(srcDir)) {
  if (f.endsWith('.webp')) copyFileSync(join(srcDir, f), join(OUT, f));
}

// The favicon is the Jewel logo, unmodified.
writeFileSync(join(OUT, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<rect width="512" height="512" fill="#000000"/>
<path d="M256 76L436 256L256 436L76 256L256 76Z" fill="#FFFFFF"/>
<path d="M256 76L436 256H256V76Z" fill="#CCCCCC"/>
<path d="M76 256L256 436V256H76Z" fill="#CCCCCC"/>
<path d="M256 436L436 256H256V436Z" fill="#808080"/>
</svg>
`);

console.log(`built ${join(OUT, 'index.html')} — ${(page.length / 1024).toFixed(0)} KB of HTML, built from ${SRC}`);
