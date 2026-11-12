// Keeps the Jewel version on the landing page in step with Maven Central. The header
// chip, the Gradle snippet and the version-format example in src/Main.dc.html all read
// from two fields, and a hand-maintained version number is what VERSIONS.md was before
// it drifted six releases behind (see STYLE.md). This is the generator that replaces it.
//
//   node update-version.mjs                        update src/Main.dc.html in place
//   node update-version.mjs --dry-run              report what would change, write nothing
//   node update-version.mjs path/to/Main.dc.html   read a different source file
//
// In CI the result is proven version-only by verify-version-bump.mjs before it deploys.
//
// What counts as the latest release, and why it is sorted rather than read from <latest>,
// lives in jewel-version.mjs, which sync-api-docs.mjs shares.
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { fetchLatestRelease } from './jewel-version.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const SRC = args.find((a) => !a.startsWith('--')) ?? 'src/Main.dc.html';

const { artifact, version, listed, releases } = await fetchLatestRelease('jewel-int-ui-standalone');

console.log(`Maven Central lists ${releases.length} released versions of jewel-int-ui-standalone`);
console.log(`latest: ${artifact}  (Jewel ${version})`);
if (listed.length !== releases.length) {
  console.log(`skipped ${listed.length - releases.length} entry/entries that are not releases`);
}

const source = readFileSync(SRC, 'utf8');
let updated = source;
let changed = false;
// The verifier needs what the file said before, to prove the diff is only the version.
const previous = {};

for (const [field, value] of [['version', version], ['artifact', artifact]]) {
  const pattern = new RegExp(`(^[ \\t]*${field}: ')([^']*)(',[ \\t]*$)`, 'gm');
  const found = [...updated.matchAll(pattern)];
  if (found.length !== 1) {
    throw new Error(`expected one \`${field}: '…'\` line in ${SRC}, found ${found.length}`);
  }
  const current = found[0][2];
  previous[field] = current;
  if (current === value) {
    console.log(`  ${field}: ${current} (unchanged)`);
    continue;
  }
  console.log(`  ${field}: ${current} -> ${value}`);
  updated = updated.replace(pattern, `$1${value}$3`);
  changed = true;
}

if (!changed) {
  console.log(`\n${SRC} is up to date`);
} else if (dryRun) {
  console.log(`\n--dry-run: ${SRC} left alone`);
} else {
  writeFileSync(SRC, updated);
  console.log(`\nupdated ${SRC}. Rebuild with: node build-site.mjs ${SRC} public`);
}

// The workflow gates the rebuild and the commit on these. Both values have been matched
// against RELEASE, so they are digits and dots and cannot carry anything into a shell.
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `changed=${changed}\nversion=${version}\nartifact=${artifact}\n` +
      `oldVersion=${previous.version}\noldArtifact=${previous.artifact}\n`
  );
}
