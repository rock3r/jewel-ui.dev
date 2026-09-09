// Proves that a version bump changed the version and nothing else, so the result can be
// deployed without a person reading the diff.
//
//   node verify-version-bump.mjs <oldVersion> <oldArtifact> <newVersion> <newArtifact>
//
// The method is a round trip. Take each file as it stands now, substitute the new version
// strings back to the old ones, and compare against the committed file byte for byte. If
// they match, the only difference between committed and current is the version, proven for
// the whole file rather than asserted for the lines someone thought to check.
//
// This is stronger than checking which files changed. A full rebuild regenerates
// public/index.html from src/Main.dc.html, so an edit to the source that was committed
// without rebuilding would be swept into the deployed page by the next bump, and a
// file-name whitelist would not notice: the file set is the same either way. Here it fails,
// because reverting the version does not reproduce the committed bytes.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const [oldVersion, oldArtifact, newVersion, newArtifact] = process.argv.slice(2);
if (!oldVersion || !oldArtifact || !newVersion || !newArtifact) {
  console.error('usage: node verify-version-bump.mjs <oldVersion> <oldArtifact> <newVersion> <newArtifact>');
  process.exit(2);
}

const RELEASE = /^\d+(\.\d+)*(-\d+(\.\d+)*)?$/;
for (const [name, value] of Object.entries({ oldVersion, oldArtifact, newVersion, newArtifact })) {
  if (!RELEASE.test(value)) {
    console.error(`${name} is not a version string: ${value}`);
    process.exit(2);
  }
}

const FILES = ['src/Main.dc.html', 'public/index.html'];

const splitAll = (haystack, needle) => haystack.split(needle).length - 1;

let failed = false;
for (const file of FILES) {
  const committed = execFileSync('git', ['show', `HEAD:${file}`], { encoding: 'utf8', maxBuffer: 64 << 20 });
  const current = readFileSync(file, 'utf8');

  if (committed === current) {
    console.error(`${file}: unchanged, expected the bump to touch it`);
    failed = true;
    continue;
  }

  // Order matters: the artifact contains the version as a prefix, so it has to go first or
  // the version pass would corrupt it.
  const reverted = current.split(newArtifact).join(oldArtifact).split(newVersion).join(oldVersion);

  if (reverted !== committed) {
    console.error(`${file}: reverting the version does NOT reproduce the committed file`);
    console.error('  something other than the version changed; refusing to deploy');
    failed = true;
    continue;
  }

  const bumped = splitAll(current, newArtifact) + (splitAll(current, newVersion) - splitAll(current, newArtifact));
  console.log(`${file}: version-only change, ${bumped} occurrence(s) rewritten`);
}

if (failed) process.exit(1);
console.log(`\nverified: ${oldArtifact} -> ${newArtifact} and nothing else`);
