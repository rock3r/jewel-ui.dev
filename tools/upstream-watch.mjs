// Watches Jewel commits landing in JetBrains/intellij-community and opens a docs issue
// here for each one that changes what the guides describe. The guides are written by
// hand against a Jewel version, so they drift every time the public API moves; this is
// the reminder, not the fix.
//
//   node tools/upstream-watch.mjs --since 2026-09-21T10:33:00Z   look back to a date
//   node tools/upstream-watch.mjs                                last 3 days (the default)
//   node tools/upstream-watch.mjs --dry-run                      classify, write nothing
//   node tools/upstream-watch.mjs --only SHA,SHA --bundle "Title" file one issue for
//                                                                 hand-picked commits
//
// Needs GITHUB_TOKEN (or GH_TOKEN) with issues: write on this repository. Unauthenticated
// calls to intellij-community run out after 60 an hour; a backfill makes about one per
// commit. GITHUB_REPOSITORY picks the repository to file in (default rock3r/jewel-ui.dev).
//
// Source of truth: commits on intellij-community master that touch platform/jewel and
// carry a GitOrigin-RevId trailer, which is how merged work arrives from the monorepo. PRs
// are not: some land as direct commits, and some PRs are closed by hand after the bot
// commit. The PR number comes from the "closes …/pull/N" line when there is one.
//
// Classification is by changed paths, with no judgement call in the loop:
//   docs-update   an api-dump or metalava signature file changed, or a user doc in
//                 platform/jewel/docs/
//   skip          only tests, samples, showcase, build, CI or agent skills changed, or
//                 main sources changed with no public API change (a behaviour fix)
//   needs-triage  the API moved in a change that calls itself a sample, or a dependency
//                 upgrade also changed main sources. Someone decides; the issue says why.
//
// One issue per JEWEL ticket. Commits that share a ticket share the issue. There is no
// state file: every issue carries hidden markers with its tickets and commit SHAs, and a
// run reads the existing upstream issues before it writes, so reruns are idempotent.
import { readFileSync, readdirSync, statSync, appendFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const UPSTREAM = 'JetBrains/intellij-community';
const REPO = process.env.GITHUB_REPOSITORY || 'rock3r/jewel-ui.dev';
const ASSIGNEE = 'rock3r';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const API = 'https://api.github.com';

const LABELS = {
  'docs-update': { color: '0e8a16', description: 'A guide needs updating for an upstream change' },
  upstream: { color: '5319e7', description: 'Tracks a change that landed in intellij-community' },
  'needs-triage': { color: 'fbca04', description: 'Not sure it needs docs; a person decides' },
};

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const sinceArg = args[args.indexOf('--since') + 1];
const since =
  args.includes('--since') && sinceArg
    ? new Date(sinceArg)
    : new Date(Date.now() - 3 * 24 * 3600 * 1000);
if (Number.isNaN(since.getTime())) throw new Error(`--since: not a date: ${sinceArg}`);
if (!TOKEN) throw new Error('set GITHUB_TOKEN or GH_TOKEN');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
const bundle = args.includes('--bundle') ? args[args.indexOf('--bundle') + 1] : null;
if (bundle && !only) throw new Error('--bundle needs --only');

// ---------------------------------------------------------------- GitHub REST

async function gh(path, { method = 'GET', body } = {}) {
  const url = path.startsWith('http') ? path : `${API}${path}`;
  for (let attempt = 1; ; attempt += 1) {
    const res = await fetch(url, {
      method,
      headers: {
        authorization: `Bearer ${TOKEN}`,
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
        'user-agent': 'jewel-ui.dev-upstream-watch',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.ok) return { data: res.status === 204 ? null : await res.json(), res };
    const retry = res.status >= 500 || (res.status === 403 && res.headers.get('retry-after'));
    if (retry && attempt < 4) {
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      continue;
    }
    const remaining = res.headers.get('x-ratelimit-remaining');
    throw new Error(`${method} ${url}: HTTP ${res.status} (rate limit left: ${remaining})\n` +
      (await res.text()).slice(0, 500));
  }
}

async function ghAll(path) {
  const out = [];
  let next = `${API}${path}${path.includes('?') ? '&' : '?'}per_page=100`;
  while (next) {
    const { data, res } = await gh(next);
    out.push(...data);
    next = /<([^>]+)>;\s*rel="next"/.exec(res.headers.get('link') || '')?.[1];
  }
  return out;
}

// ---------------------------------------------------------------- classification

const JEWEL = 'platform/jewel/';
const API_FILE = /(^|\/)api-dump[^/]*\.txt$|\/metalava\/[^/]+\.txt$/;
const USER_DOC = /^platform\/jewel\/docs\/[^/]+\.md$/;
// Contributor docs live next to the user docs. Their names say which they are.
const NOT_USER_DOC = /build|bazel|e2e|release|\bci\b|contribut|upgrade|test|detekt/i;
const NON_PRODUCT = [
  /\/src\/(test|e2eTest|spectreTest|testFixtures|jmh)\//,
  /-tests\//,
  /^platform\/jewel\/samples\//,
  /showcase/i,
  /(^|\/)BUILD\.bazel$|\.bzl$|\.bazel$|MODULE\.bazel$/,
  /\.iml$|\.gradle\.kts$|(^|\/)gradle\/|gradle\.properties$|libs\.versions\.toml$/,
  /(^|\/)\.github\//,
  /(^|\/)\.agents\//,
  /detekt/i,
  /RELEASE NOTES\.md$/,
  /^platform\/jewel\/[^/]+\.md$/,
  /^platform\/jewel\/docs\//,
  /^platform\/jewel\/scripts\//,
];
const DEPENDENCY_FILE = /libs\.versions\.toml$|MODULE\.bazel$|jewel_deps/;
const SKIP_SUBJECT =
  /\[build\]|\bbump\b|update spectre|release notes|\bbazel\b|\bCI\b|detekt|\be2e\b|showcase/i;
// A version bump adds metalava files named for the next version; that is not an API change.
const VERSION_BUMP = /bump jewel version|prepare release notes/i;
const SAMPLE_SUBJECT = /\bsample|showcase/i;

const isApiFile = (f) => f.startsWith(JEWEL) && API_FILE.test(f);
// Metalava files are per version, so a new release adds a whole file. Only edits count.
const isApiChange = (f) =>
  isApiFile(f.filename) && !isNonProductApi(f.filename) &&
  (!/\/metalava\//.test(f.filename) || f.status === 'modified');
const isUserDoc = (f) => USER_DOC.test(f) && !NOT_USER_DOC.test(f.split('/').pop());
const isNonProduct = (f) => NON_PRODUCT.some((re) => re.test(f));
// The showcase sample publishes an API dump too. Nobody depends on it.
const isNonProductApi = (f) => /^platform\/jewel\/samples\/|-tests\//.test(f);

function classify(subject, files, tickets) {
  // Monorepo-wide commits (icon sets, build cleanups) touch platform/jewel in passing. The
  // Jewel team files everything it ships under a JEWEL ticket.
  if (!tickets.some((t) => t.startsWith('JEWEL-'))) return { kind: 'skip', reason: 'not a JEWEL ticket' };
  if (VERSION_BUMP.test(subject)) return { kind: 'skip', reason: 'version bump or release notes' };
  const names = files.map((f) => f.filename);
  const api = files.filter(isApiChange).map((f) => f.filename);
  const docs = names.filter(isUserDoc);
  if (api.length || docs.length) {
    const what = [api.length && 'the public API dump', docs.length && 'a user doc'].filter(Boolean);
    if (SAMPLE_SUBJECT.test(subject)) {
      return {
        kind: 'needs-triage',
        reason: `${what.join(' and ')} changed, but the subject says it is a sample change. ` +
          'Check whether the new API is public and meant for users.',
      };
    }
    return { kind: 'docs-update', reason: `${what.join(' and ')} changed.` };
  }
  const product = names.filter((f) => !isNonProduct(f));
  if (!product.length) return { kind: 'skip', reason: 'only tests, samples, build, CI or skills' };
  if (SKIP_SUBJECT.test(subject)) return { kind: 'skip', reason: 'build or release housekeeping' };
  if (names.some((f) => DEPENDENCY_FILE.test(f))) {
    return {
      kind: 'needs-triage',
      reason: 'a dependency upgrade that also changed main sources, with no public API change. ' +
        'Check whether any page states the dependency version or the changed behaviour.',
    };
  }
  return { kind: 'skip', reason: 'behaviour change in main sources, no public API change' };
}

// ---------------------------------------------------------------- docs hints

function walkMd(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      // docs/tooling is copied from jewel-tooling and documents a different product.
      if (relative(ROOT, full) !== 'docs/tooling') walkMd(full, out);
    } else if (name.endsWith('.md')) out.push(full);
  }
  return out;
}
const DOC_PAGES = walkMd(join(ROOT, 'docs')).map((f) => ({
  path: relative(ROOT, f),
  lines: readFileSync(f, 'utf8').split('\n'),
}));

// A symbol is a candidate for a page by name, and the page by topic.
const TOPICS = [
  [/markdown/i, 'docs/guides/markdown.md'],
  [/scroll|LazyColumn|LazyTree|\bTree|SelectableLazy|lazy\.tree|ListComboBox/i,
    'docs/guides/lists-and-trees.md'],
  [/\bIcon|Painter|PaletteReplacement|IconKey/i, 'docs/guides/icons.md'],
  [/(?<!Markdown\w*)Styling\b|ComponentStyling|ThemeDefinition|ColorPalette|isIslands|GlobalColors/i,
    'docs/guides/theming.md'],
  [/DecoratedWindow|TitleBar|decorated-window|decorated\.window/i,
    'docs/guides/decorated-windows.md'],
  [/Typography|TextStyle|FontFamily/i, 'docs/guides/typography.md'],
  [/SwingBridge|LafBridge|bridge\.theme|BridgeTheme/i, 'docs/guides/swing-bridge.md'],
  [/SwingPanel|JewelComposePanel|ComposePanel/i, 'docs/guides/swing-interop.md'],
  [/CodeHighlighter|highlighting/i, 'docs/guides/code-highlighting.md'],
];
// Components no current page covers. The proposal is one new page per family.
const NEW_PAGES = [
  [/\bOnOffButton|FilterableLazyColumn|SearchTextField|SearchArea\b|\bGroupHeader\b/,
    'a new **Components** page (`docs/guides/components.md`)'],
  [/MenuComboBox|PopupMenu|PopupContainer|\bPopup\b|\bDropdown\b|onDismissRequest/,
    'a new **Menus & popups** page (`docs/guides/menus-and-popups.md`)'],
];
const NEW_PAGE_SYMBOLS =
  /\b(OnOffButton|FilterableLazyColumn|SearchTextField|SearchArea|GroupHeader|MenuComboBox|PopupMenu|PopupContainer|Popup|Dropdown)\b/g;

const COMMON = new Set(['default', 'equals', 'hashCode', 'toString', 'copy', 'Companion',
  'Modifier', 'String', 'Boolean', 'Unit', 'Composer', 'Deprecated', 'Composable', 'Color']);

// Names on changed signature lines. Metalava lines read "method … name(", "class Name",
// "property … name;"; api-dump lines read "f:pkg.Name" and "- name(…)".
function changedSymbols(patch, sign = '-') {
  const names = new Set();
  for (const line of patch.split('\n')) {
    // Removed and replaced lines: what a guide may still mention.
    if (line[0] !== sign || line[1] === sign) continue;
    for (const m of line.matchAll(/\b(?:method|ctor|property|field)\b[^(;]*?\b(\w+)\s*[(;]/g)) {
      names.add(m[1]);
    }
    for (const m of line.matchAll(/\b(?:class|interface|enum|object)\s+([\w.$]+)/g)) {
      names.add(m[1].split(/[.$]/).pop());
    }
    for (const m of line.matchAll(/^[+-]\s*(?:[a-z]+:)?([\w.$]+)$/g)) names.add(m[1].split(/[.$]/).pop());
    for (const m of line.matchAll(/^[+-]\s*-\s*\w*:?(\w+)\(/g)) names.add(m[1]);
  }
  return [...names]
    .map((n) => n.replace(/Kt$/, ''))
    .filter((n) => n.length >= 4 && /[A-Z]/.test(n) && !COMMON.has(n))
    .filter((n) => !/^(get|set|is|component)[A-Z0-9]/.test(n));
}

function mentions(symbols) {
  const hits = [];
  for (const name of symbols) {
    const re = new RegExp(`\\b${name}\\b`);
    for (const page of DOC_PAGES) {
      page.lines.forEach((text, i) => {
        if (re.test(text)) hits.push({ name, at: `${page.path}:${i + 1}`, text: text.trim() });
      });
    }
  }
  return hits;
}

// ---------------------------------------------------------------- upstream commits

const parseTickets = (msg) => [...new Set([...msg.matchAll(/\bJEWEL-\d+\b/g)].map((m) => m[0]))];
const subjectOf = (msg) => msg.split('\n')[0].trim();
const cleanTitle = (subject) => subject.replace(/^(\[[^\]]+\]\s*)+/, '').trim();
const prOf = (msg) =>
  /closes\s+https:\/\/github\.com\/JetBrains\/intellij-community\/pull\/(\d+)/i.exec(msg)?.[1];
const moduleOf = (file) => {
  const rest = file.slice(JEWEL.length);
  const i = rest.search(/\/(src|api-dump|metalava)/);
  return i > 0 ? rest.slice(0, i) : dirname(rest);
};

async function upstreamCommits() {
  const list = only
    ? await Promise.all(only.map(async (sha) => (await gh(`/repos/${UPSTREAM}/commits/${sha}`)).data))
    : await ghAll(
      `/repos/${UPSTREAM}/commits?sha=master&path=platform/jewel&since=${since.toISOString()}`,
    );
  const out = [];
  for (const item of list) {
    const msg = item.commit.message;
    if (!/^GitOrigin-RevId:/m.test(msg)) continue;
    const { data } = await gh(`/repos/${UPSTREAM}/commits/${item.sha}`);
    out.push({
      sha: item.sha,
      short: item.sha.slice(0, 9),
      date: item.commit.committer.date,
      subject: subjectOf(msg),
      tickets: parseTickets(subjectOf(msg)).length ? parseTickets(subjectOf(msg)) : parseTickets(msg),
      pr: prOf(msg),
      files: data.files || [],
      truncatedFiles: (data.files || []).length >= 300,
    });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date)); // oldest first
}

// Commits sharing any ticket land in one group, so one issue covers the whole ticket.
function groupByTicket(commits) {
  const groups = [];
  for (const c of commits) {
    const keys = c.tickets.length ? c.tickets : [`sha:${c.sha}`];
    const hit = groups.filter((g) => keys.some((k) => g.keys.has(k)));
    const target = hit[0] || { keys: new Set(), commits: [] };
    if (!hit.length) groups.push(target);
    for (const other of hit.slice(1)) {
      other.keys.forEach((k) => target.keys.add(k));
      target.commits.push(...other.commits);
      groups.splice(groups.indexOf(other), 1);
    }
    keys.forEach((k) => target.keys.add(k));
    target.commits.push(c);
  }
  for (const g of groups) g.commits.sort((a, b) => a.date.localeCompare(b.date));
  return groups;
}

// ---------------------------------------------------------------- issue text

const BLOB = (sha, path) =>
  `https://github.com/${UPSTREAM}/blob/${sha}/${path.split('/').map(encodeURIComponent).join('/')}`;
const MAX_DIFF_LINES = 50;

// Prefer metalava's file: it keeps parameter names and marks defaults "optional". The
// "-stable-" twin and api-dump.txt say the same thing with less, so they are fallbacks.
function apiSection(c) {
  const byModule = new Map();
  for (const f of c.files.filter(isApiChange)) {
    const mod = moduleOf(f.filename);
    if (!byModule.has(mod)) byModule.set(mod, []);
    byModule.get(mod).push(f);
  }
  const rank = (f) => (/metalava\/[^/]*-api-(?!stable)/.test(f.filename) ? 0
    : /api-dump\.txt$/.test(f.filename) ? 1 : 2);
  const parts = [];
  const symbols = new Set();
  const removed = new Set();
  for (const [mod, files] of byModule) {
    files.sort((a, b) => rank(a) - rank(b));
    const best = files[0];
    for (const f of files) {
      if (!f.patch) continue;
      changedSymbols(f.patch, '-').forEach((s) => removed.add(s));
      changedSymbols(f.patch, '+').forEach((s) => symbols.add(s));
    }
    let block;
    if (!best.patch) {
      block = `_Diff too large for the API; see [${best.filename.split('/').pop()}](` +
        `${BLOB(c.sha, best.filename)})._`;
    } else {
      const lines = best.patch.split('\n').filter((l) => /^[+-@]/.test(l) && !/^@@ -\d/.test(l) ||
        /^@@/.test(l));
      const kept = lines.slice(0, MAX_DIFF_LINES);
      const more = lines.length - kept.length;
      block = '```diff\n' + kept.join('\n') + '\n```' +
        (more > 0 ? `\n_${more} more lines in [the file](${BLOB(c.sha, best.filename)})._` : '');
    }
    parts.push(`**${mod}** ([\`${best.filename.split('/').pop()}\`](${BLOB(c.sha, best.filename)}))` +
      `\n\n${block}`);
  }
  return { text: parts.join('\n\n'), symbols: [...symbols, ...removed], removed: [...removed] };
}

function commitSection(c) {
  const lines = [`### ${c.subject}`, '', `<!-- upstream-sha: ${c.sha} -->`, ''];
  lines.push(`- Commit: [\`${c.short}\`](https://github.com/${UPSTREAM}/commit/${c.sha}), ` +
    `landed ${c.date.replace('T', ' ').replace('Z', ' UTC')}`);
  lines.push(c.pr
    ? `- PR: [#${c.pr}](https://github.com/${UPSTREAM}/pull/${c.pr})`
    : '- PR: none, this landed as a direct commit');
  const reason = c.class.reason[0].toUpperCase() + c.class.reason.slice(1);
  lines.push(`- Classification: **${c.class.kind}**. ${reason}`);
  const docs = c.files.filter((f) => isUserDoc(f.filename));
  for (const d of docs) {
    lines.push(`- Upstream doc (${d.status}): [\`${d.filename.slice(JEWEL.length)}\`]` +
      `(${BLOB(c.sha, d.filename)})`);
  }
  const main = c.files.filter((f) => /\/src\/main\//.test(f.filename));
  if (main.length) {
    lines.push('', '**Main sources changed** (where the API lives, at this commit):', '');
    for (const f of main.slice(0, 25)) {
      lines.push(`- [\`${f.filename.slice(JEWEL.length)}\`](${BLOB(c.sha, f.filename)}) ` +
        `(${f.status}, +${f.additions}/−${f.deletions})`);
    }
    if (main.length > 25) lines.push(`- …and ${main.length - 25} more in the commit`);
  }
  if (c.truncatedFiles) lines.push('', '_The commit has 300+ files; the list above may be partial._');
  const api = apiSection(c);
  lines.splice(lines.findIndex((l) => l.startsWith('- Classification')) + 1, 0,
    `- Likely docs: ${pageLine(pagesFor(commitHaystack(c, api.symbols)))}`);
  if (api.text) lines.push('', '**Public API changes:**', '', api.text);
  return { text: lines.join('\n'), symbols: api.symbols, removed: api.removed };
}

function pagesFor(haystack) {
  return {
    pages: [...new Set(TOPICS.filter(([re]) => re.test(haystack)).map(([, p]) => p))],
    proposals: NEW_PAGES.filter(([re]) => re.test(haystack)).map(([, p]) => p),
    fresh: [...new Set([...haystack.matchAll(NEW_PAGE_SYMBOLS)].map((m) => m[1]))],
  };
}

const commitHaystack = (c, symbols) =>
  [c.subject, ...symbols, ...c.files.filter(isApiChange).map((f) => f.filename)].join('\n');

function pageLine({ pages, proposals, fresh }) {
  const parts = pages.map((p) => `\`${p}\``);
  if (proposals.length) parts.push(`new page for ${fresh.map((x) => `\`${x}\``).join(', ')}`);
  return parts.length ? parts.join(', ') : 'no page matched by topic';
}

function hintsSection(group, symbols, removed) {
  const haystack = group.commits.map((c) => commitHaystack(c, [])).concat(symbols).join('\n');
  const { pages, proposals, fresh } = pagesFor(haystack);
  const hits = mentions(removed);
  const out = ['## Where the docs need to change', ''];
  if (pages.length) out.push(...pages.map((p) => `- [\`${p}\`](https://github.com/${REPO}/blob/master/${p})`));
  if (proposals.length) {
    out.push(`- No current page covers ${fresh.map((s) => `\`${s}\``).join(', ')}. ` +
      `Proposal: ${proposals.join(', or ')}, added to \`NAV\` in \`build-docs.mjs\`.`);
  }
  if (!pages.length && !proposals.length) out.push('- No page matched by topic. Pick one, or close.');
  if (hits.length) {
    out.push('', 'Existing mentions in `docs/` of symbols that were removed or changed:', '');
    for (const h of hits.slice(0, 30)) {
      out.push(`- \`${h.at}\` mentions \`${h.name}\`: \`${h.text.slice(0, 80).replace(/`/g, "'")}\``);
    }
  }
  return out.join('\n');
}

const CHECKLIST = `## Before closing

Follow [AGENTS.md](https://github.com/${REPO}/blob/master/AGENTS.md) and [STYLE.md](https://github.com/${REPO}/blob/master/STYLE.md):

- [ ] Verify every signature, default and parameter name against the source at the linked commit, and against the Jewel version the guide targets
- [ ] \`rumdl fmt docs\` reports nothing to fix and \`rumdl check docs\` passes
- [ ] \`node build-docs.mjs docs public/docs\` (add new pages to \`NAV\`)
- [ ] \`node check-links.mjs\` reports no broken links`;

function issueFor(group) {
  const relevant = group.commits;
  const tickets = [...group.keys].filter((k) => k.startsWith('JEWEL-'));
  const lead = relevant.find((c) => c.class.kind === 'docs-update') || relevant.at(-1);
  const prs = [...new Set(relevant.map((c) => c.pr).filter(Boolean))];
  const title = group.title
    ? `[docs] ${group.title}`
    : `[docs] ${tickets.length ? `${tickets.join(', ')}: ` : ''}${cleanTitle(lead.subject)}` +
      (prs.length ? ` (${prs.map((p) => `#${p}`).join(', ')})` : '');
  const sections = relevant.map(commitSection);
  const symbols = [...new Set(sections.flatMap((s) => s.symbols))];
  const removed = [...new Set(sections.flatMap((s) => s.removed))];
  const triage = relevant.every((c) => c.class.kind === 'needs-triage');
  const body = [
    ...tickets.map((t) => `<!-- upstream-ticket: ${t} -->`),
    triage
      ? 'An upstream Jewel change landed that **may** need a docs update. Decide, then relabel to keep it or close it.'
      : 'An upstream Jewel change landed that changes what the guides describe.',
    '',
    tickets.length
      ? `${tickets.length > 1 ? 'Tickets' : 'Ticket'}: ${tickets.map((t) => `[${t}](https://youtrack.jetbrains.com/issue/${t})`).join(', ')}`
      : 'Ticket: none in the commit message',
    '',
    hintsSection(group, symbols, removed),
    '',
    '## Upstream changes',
    '',
    sections.map((s) => s.text).join('\n\n'),
    '',
    CHECKLIST,
    '',
    '<sub>Opened by `tools/upstream-watch.mjs`. The hidden markers keep reruns from duplicating it.</sub>',
  ].join('\n');
  const labels = ['docs-update', 'upstream', ...(triage ? ['needs-triage'] : [])];
  return { title: title.slice(0, 250), body: fit(body), labels, sections };
}

// GitHub rejects bodies over 65,536 characters. Halve the largest diff until it fits.
function fit(body) {
  const LIMIT = 64000;
  for (let guard = 0; body.length > LIMIT && guard < 50; guard += 1) {
    const blocks = [...body.matchAll(/```diff\n([\s\S]*?)\n```/g)];
    if (!blocks.length) break;
    const big = blocks.reduce((a, b) => (b[1].length > a[1].length ? b : a));
    const lines = big[1].split('\n');
    const kept = lines.slice(0, Math.max(1, Math.floor(lines.length / 2)));
    const cut = lines.length - kept.length;
    const note = cut ? `\n_${cut} more lines trimmed to fit; see the linked file._` : '';
    const replacement = '```diff\n' + kept.join('\n') + '\n```' + note;
    if (replacement.length >= big[0].length) break;
    body = body.slice(0, big.index) + replacement + body.slice(big.index + big[0].length);
  }
  return body.length > LIMIT ? body.slice(0, LIMIT) : body;
}

// ---------------------------------------------------------------- main

async function ensureLabels() {
  const have = new Set((await ghAll(`/repos/${REPO}/labels`)).map((l) => l.name));
  for (const [name, spec] of Object.entries(LABELS)) {
    if (have.has(name)) continue;
    console.log(`creating label ${name}`);
    if (!dryRun) await gh(`/repos/${REPO}/labels`, { method: 'POST', body: { name, ...spec } });
  }
}

async function existingIssues() {
  const issues = await ghAll(`/repos/${REPO}/issues?labels=upstream&state=all`);
  return issues.filter((i) => !i.pull_request).map((i) => ({
    number: i.number,
    state: i.state,
    url: i.html_url,
    body: i.body || '',
    shas: new Set([...(i.body || '').matchAll(/<!-- upstream-sha: ([0-9a-f]{40}) -->/g)].map((m) => m[1])),
    tickets: new Set([...(i.body || '').matchAll(/<!-- upstream-ticket: (JEWEL-\d+) -->/g)].map((m) => m[1])),
  }));
}

const summary = [];
const log = (line) => {
  console.log(line);
  summary.push(line);
};

const commits = await upstreamCommits();
for (const c of commits) {
  c.class = bundle
    ? { kind: 'docs-update', reason: 'Picked by hand: it shipped before the guides were last revised.' }
    : classify(c.subject, c.files, c.tickets);
}
log(only ? '## Hand-picked upstream Jewel commits\n' : `## Upstream Jewel commits since ${since.toISOString()}\n`);
log(`${commits.length} commits with GitOrigin-RevId on ${UPSTREAM} master.\n`);
log('| Commit | PR | Class | Subject |');
log('|---|---|---|---|');
for (const c of commits) {
  log(`| \`${c.short}\` | ${c.pr ? `#${c.pr}` : '–'} | ${c.class.kind} | ` +
    `${c.subject.replace(/\|/g, '\\|')} (${c.class.reason}) |`);
}
log('');

if (!dryRun) await ensureLabels();
const existing = dryRun && args.includes('--no-read') ? [] : await existingIssues();
const known = new Set(existing.flatMap((i) => [...i.shas]));

const fresh = commits.filter((c) => c.class.kind !== 'skip' && !known.has(c.sha));
const groups = bundle
  ? fresh.length ? [{ keys: new Set(fresh.flatMap((c) => c.tickets)), commits: fresh, title: bundle }] : []
  : groupByTicket(fresh);
const opened = [];
for (const group of groups) {
  const issue = issueFor(group);
  const prior = group.title ? null : existing.find((i) => [...group.keys].some((k) => i.tickets.has(k)));
  if (prior) {
    // Same ticket, new commits: add them to the issue the reader already has.
    log(`- #${prior.number}: adding ${group.commits.map((c) => c.short).join(', ')}`);
    if (dryRun) continue;
    const extra = issue.sections.map((s) => s.text).join('\n\n');
    const markers = [...group.keys].filter((k) => k.startsWith('JEWEL-') && !prior.tickets.has(k))
      .map((t) => `<!-- upstream-ticket: ${t} -->`).join('\n');
    const body = fit(`${markers ? `${markers}\n` : ''}${prior.body}\n\n## More upstream changes\n\n${extra}`);
    await gh(`/repos/${REPO}/issues/${prior.number}`, {
      method: 'PATCH',
      body: { body, ...(prior.state === 'closed' ? { state: 'open' } : {}) },
    });
    await gh(`/repos/${REPO}/issues/${prior.number}/comments`, {
      method: 'POST',
      body: { body: `More upstream commits for this ticket landed: ` +
        group.commits.map((c) => `${UPSTREAM}@${c.short}`).join(', ') + '. The body lists them.' },
    });
    opened.push({ number: prior.number, url: prior.url, title: '(updated)', labels: [] });
    continue;
  }
  log(`- new: ${issue.title} [${issue.labels.join(', ')}]`);
  if (dryRun) {
    if (args.includes('--print')) console.log(`\n----- ${issue.title}\n${issue.body}\n-----\n`);
    continue;
  }
  const { data } = await gh(`/repos/${REPO}/issues`, {
    method: 'POST',
    body: { title: issue.title, body: issue.body, labels: issue.labels, assignees: [ASSIGNEE] },
  });
  log(`  opened ${data.html_url}`);
  opened.push({ number: data.number, url: data.html_url, title: issue.title, labels: issue.labels });
}
if (!groups.length) log('Nothing new to file.');

if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary.join('\n') + '\n');
if (process.env.UPSTREAM_WATCH_JSON) {
  appendFileSync(process.env.UPSTREAM_WATCH_JSON, JSON.stringify(opened, null, 2));
}
