// The published Jewel version, read from Maven Central. Shared by update-version.mjs (the
// landing page chip) and sync-api-docs.mjs (the API reference), so both agree on what
// "latest" means.
//
// The search.maven.org solr API returns an empty response for these artifacts, so the
// repository metadata is the source. Ordering matters: the file lists versions in publish
// order, and a fix cherry-picked onto a release branch publishes an older Jewel version
// after a newer one, which would walk the version backwards. Sort instead of taking the
// last entry, <latest> or <release>, which all have the same problem.

export const MAVEN = 'https://repo1.maven.org/maven2/org/jetbrains/jewel';

// [jewel-version]-[ijp-build], both dotted numbers. Anything else is a snapshot or a
// qualifier, and not something to publish.
export const RELEASE = /^(\d+(?:\.\d+)*)-(\d+(?:\.\d+)*)$/;

export const compareDotted = (a, b) => {
  const x = a.split('.').map(Number);
  const y = b.split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i += 1) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
};

// Highest Jewel version wins; among artifacts sharing it, the highest platform build.
export function latestRelease(xml, label = 'maven-metadata.xml') {
  const listed = [...xml.matchAll(/<version>([^<]+)<\/version>/g)].map((m) => m[1].trim());
  if (listed.length === 0) throw new Error(`no <version> entries in ${label}`);
  const releases = listed.filter((v) => RELEASE.test(v));
  if (releases.length === 0) throw new Error(`none of the ${listed.length} entries is a release`);
  const artifact = releases.reduce((best, candidate) => {
    const [, jewel, build] = RELEASE.exec(candidate);
    const [, bestJewel, bestBuild] = RELEASE.exec(best);
    const byJewel = compareDotted(jewel, bestJewel);
    if (byJewel !== 0) return byJewel > 0 ? candidate : best;
    return compareDotted(build, bestBuild) > 0 ? candidate : best;
  });
  const [, version] = RELEASE.exec(artifact);
  return { artifact, version, listed, releases };
}

export async function fetchLatestRelease(artifactId) {
  const url = `${MAVEN}/${artifactId}/maven-metadata.xml`;
  const response = await fetch(url, { headers: { accept: 'application/xml' } });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return latestRelease(await response.text(), url);
}
