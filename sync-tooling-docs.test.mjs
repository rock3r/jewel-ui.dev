import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

test('synced plugin build instructions name the plugin checkout', () => {
  const root = mkdtempSync(join(tmpdir(), 'jewel-tooling-sync-'));
  try {
    const site = join(root, 'site');
    const plugin = join(root, 'jewel-tooling');
    mkdirSync(site);
    mkdirSync(join(plugin, 'user-guide'), { recursive: true });
    cpSync(new URL('./sync-tooling-docs.mjs', import.meta.url), join(site, 'sync-tooling-docs.mjs'));
    writeFileSync(join(plugin, 'user-guide', 'README.md'), 'Install the ZIP built\nin this repository.\n');
    writeFileSync(join(plugin, 'user-guide', 'install.md'),
      '```sh\n./gradlew :buildPlugin\n```\n\n' +
      'The Gradle wrapper in this repository builds the IDE plugin. It does not impose a build\n' +
      'system on the project being analysed.\n');
    execFileSync('git', ['init', plugin]);
    execFileSync('git', ['-C', plugin, '-c', 'user.name=Test', '-c', 'user.email=test@example.com',
      '-c', 'commit.gpgsign=false', 'commit', '--allow-empty', '-m', 'Create fixture']);
    execFileSync(process.execPath, [join(site, 'sync-tooling-docs.mjs')]);
    const install = readFileSync(join(site, 'docs/tooling/install.md'), 'utf8');
    assert.match(install, /Run this command in that checkout:/);
    assert.match(install, /wrapper in `rock3r\/jewel-tooling`/);
    assert.match(readFileSync(join(site, 'docs/tooling/index.md'), 'utf8'), /checkout of \[rock3r\/jewel-tooling\]/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
