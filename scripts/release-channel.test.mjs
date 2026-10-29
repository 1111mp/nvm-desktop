import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { releaseChannel } from './release-channel.mjs';

test('stable and RC tags select separate updater releases', () => {
  assert.equal(releaseChannel('v4.4.0'), 'updater');
  assert.equal(releaseChannel('v4.5.0-rc.1'), 'updater-alpha');
  for (const tag of [
    undefined,
    'main',
    'alpha',
    'updater',
    'v4.5.0-beta.1',
    'v4.5.0-rc',
  ]) {
    assert.throws(() => releaseChannel(tag));
  }
});

test('all installer configs switch to RC and back without changing signing keys', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'nvm-release-'));
  try {
    await mkdir(join(cwd, 'src-tauri'));
    const files = [
      'tauri.conf.json',
      'webview2.x64.json',
      'webview2.arm64.json',
    ];
    for (const file of files) {
      await writeFile(
        join(cwd, 'src-tauri', file),
        JSON.stringify({
          plugins: { updater: { pubkey: 'existing-key', endpoints: ['old'] } },
        }),
      );
    }
    for (const tag of ['v4.5.0-rc.1', 'v4.5.0']) {
      execFileSync(
        process.execPath,
        [resolve('scripts/set-updater-channel.mjs')],
        {
          cwd,
          env: { ...process.env, GITHUB_REF_NAME: tag },
        },
      );
      for (const file of files) {
        const config = JSON.parse(
          await readFile(join(cwd, 'src-tauri', file), 'utf8'),
        );
        const name = file.startsWith('webview2.')
          ? 'update-fixed-webview2.json'
          : 'update.json';
        assert.deepEqual(config.plugins.updater, {
          pubkey: 'existing-key',
          endpoints: [
            `https://github.com/1111mp/nvm-desktop/releases/download/${releaseChannel(tag)}/${name}`,
          ],
        });
      }
    }
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
