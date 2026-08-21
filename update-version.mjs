// Keeps the Jewel version on the landing page in step with Maven Central. The header
// chip, the Gradle snippet and the version-format example in src/Main.dc.html all read
// from two fields, and a hand-maintained version number is what VERSIONS.md was before
// it drifted six releases behind (see STYLE.md). This is the generator that replaces it.
//
//   node update-version.mjs                        update src/Main.dc.html in place
//   node update-version.mjs --dry-run              report what would change, write nothing
//   node update-version.mjs path/to/Main.dc.html   read a different source file
//
// The search.maven.org solr API returns an empty response for this artifact, so the
// repository metadata is the source. Ordering matters: the file lists versions in publish
// order, and a fix cherry-picked onto a release branch publishes an older Jewel version
// after a newer one, which would walk the chip backwards. Sort instead of taking the last
// entry, or <release>, which has the same problem.
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';

const METADATA_URL =
  'https://repo1.maven.org/maven2/org/jetbrains/jewel/jewel-int-ui-standalone/maven-metadata.xml';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const SRC = args.find((a) => !a.startsWith('--')) ?? 'src/Main.dc.html';

// [jewel-version]-[ijp-build], both dotted numbers. Anything else is a snapshot or a
// qualifier, and not something to put on the page.
const RELEASE = /^(\d+(?:\.\d+)*)-(\d+(?:\.\d+)*)$/;

const compare = (a, b) => {
  const x = a.split('.').map(Number);
  const y = b.split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i += 1) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
};

const response = await fetch(METADATA_URL, { headers: { accept: 'application/xml' } });
if (!response.ok) throw new Error(`${METADATA_URL} returned HTTP ${response.status}`);
const xml = await response.text();

const listed = [...xml.matchAll(/<version>([^<]+)<\/version>/g)].map((m) => m[1].trim());
if (listed.length === 0) throw new Error(`no <version> entries in ${METADATA_URL}`);

const releases = listed.filter((v) => RELEASE.test(v));
if (releases.length === 0) throw new Error(`none of the ${listed.length} entries is a release`);

// Highest Jewel version wins; among artifacts sharing it, the highest platform build.
const artifact = releases.reduce((best, candidate) => {
  const [, jewel, build] = RELEASE.exec(candidate);
  const [, bestJewel, bestBuild] = RELEASE.exec(best);
  const byJewel = compare(jewel, bestJewel);
  if (byJewel !== 0) return byJewel > 0 ? candidate : best;
  return compare(build, bestBuild) > 0 ? candidate : best;
});
const [, version] = RELEASE.exec(artifact);

console.log(`Maven Central lists ${releases.length} released versions of jewel-int-ui-standalone`);
console.log(`latest: ${artifact}  (Jewel ${version})`);
if (listed.length !== releases.length) {
  console.log(`skipped ${listed.length - releases.length} entry/entries that are not releases`);
}

const source = readFileSync(SRC, 'utf8');
let updated = source;
let changed = false;

for (const [field, value] of [['version', version], ['artifact', artifact]]) {
  const pattern = new RegExp(`(^[ \\t]*${field}: ')([^']*)(',[ \\t]*$)`, 'gm');
  const found = [...updated.matchAll(pattern)];
  if (found.length !== 1) {
    throw new Error(`expected one \`${field}: '…'\` line in ${SRC}, found ${found.length}`);
  }
  const current = found[0][2];
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
    `changed=${changed}\nversion=${version}\nartifact=${artifact}\n`
  );
}
