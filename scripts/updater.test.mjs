import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

async function runUpdater(tag, fixed, failSignature = false) {
  const cwd = await mkdtemp(join(tmpdir(), 'nvm-updater-'));
  try {
    for (const file of [
      'updater.mjs',
      'updater-fixed-webview2.mjs',
      'release-channel.mjs',
      'publish-update.mjs',
    ]) {
      await copyFile(new URL(file, import.meta.url), join(cwd, file));
    }
    await writeFile(
      join(cwd, 'updatelog.mjs'),
      'export async function resolveUpdateLog() { return "Release notes"; }',
    );
    const moduleDir = join(cwd, 'node_modules/@actions/github');
    await mkdir(moduleDir, { recursive: true });
    await writeFile(
      join(moduleDir, 'package.json'),
      JSON.stringify({ type: 'module', exports: './index.mjs' }),
    );
    // Run the real entry point with a local GitHub adapter; no network writes occur.
    await writeFile(
      join(moduleDir, 'index.mjs'),
      `
      import { writeFileSync } from 'node:fs';
      export const context = { repo: { owner: 'owner', repo: 'repo' } };
      const suffixes = [
        'x64-setup.exe', 'arm64-setup.exe',
        'x64_fixed_webview2-setup.exe', 'arm64_fixed_webview2-setup.exe',
        'x64.app.tar.gz', 'aarch64.app.tar.gz',
        'amd64.deb', 'x86_64.rpm', 'arm64.deb', 'aarch64.rpm', 'armhf.deb', 'armhfp.rpm',
      ];
      const assets = suffixes.flatMap(suffix => [suffix, suffix + '.sig']).map(name => ({
        name: 'NVM.Desktop_4.5.0_' + name,
        browser_download_url: 'https://example.test/' + name,
      }));
      globalThis.fetch = async () => ({
        ok: !process.env.FAIL_SIGNATURE, status: 503, text: async () => 'valid-signature',
      });
      let channel;
      export function getOctokit() {
        return { rest: { repos: {
          getReleaseByTag: async ({ tag }) => {
            if (tag.startsWith('v')) return { data: { assets, draft: false, prerelease: tag.includes('-rc.') } };
            channel = tag;
            throw Object.assign(new Error('Not found'), { status: 404 });
          },
          createRelease: async ({ tag_name, prerelease, make_latest }) => {
            if (tag_name !== channel || prerelease !== channel.includes('alpha') || make_latest !== 'false') {
              throw new Error('Wrong channel creation');
            }
            return { data: { id: 123, assets: [] } };
          },
          uploadReleaseAsset: async ({ name, data }) => {
            writeFileSync('result.json', JSON.stringify({ channel, name, data: JSON.parse(data) }));
          },
        } } };
      }
    `,
    );
    const result = spawnSync(
      process.execPath,
      [fixed ? 'updater-fixed-webview2.mjs' : 'updater.mjs'],
      {
        cwd,
        encoding: 'utf8',
        env: {
          ...process.env,
          GITHUB_TOKEN: 'test',
          GITHUB_REF_NAME: tag,
          RELEASE_TAG: '',
          FAIL_SIGNATURE: failSignature ? '1' : '',
        },
      },
    );
    if (failSignature) {
      assert.equal(result.status, 1, result.stderr);
      await assert.rejects(readFile(join(cwd, 'result.json')), {
        code: 'ENOENT',
      });
      return;
    }
    assert.equal(result.status, 0, result.stderr);
    const uploaded = JSON.parse(
      await readFile(join(cwd, 'result.json'), 'utf8'),
    );
    assert.equal(
      uploaded.channel,
      tag.includes('-rc.') ? 'updater-alpha' : 'updater',
    );
    assert.equal(
      uploaded.name,
      fixed ? 'update-fixed-webview2.json' : 'update.json',
    );
    assert.equal(uploaded.data.name, tag);
    // Serde rejects the alias even when its value matches the version.
    assert.equal(Object.hasOwn(uploaded.data, 'version'), false);
    assert.ok(Object.keys(uploaded.data.platforms).length >= 2);
    for (const entry of Object.values(uploaded.data.platforms))
      assert.equal(entry.signature, 'valid-signature');
    if (!fixed) {
      assert.equal(
        uploaded.data.platforms['linux-aarch64'].url,
        'https://example.test/arm64.deb',
      );
      assert.equal(
        uploaded.data.platforms['linux-armv7-rpm'].url,
        'https://example.test/armhfp.rpm',
      );
    }
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
}

for (const tag of ['v4.5.0', 'v4.5.0-rc.1']) {
  for (const fixed of [false, true]) {
    test(`${tag}: ${fixed ? 'fixed WebView2' : 'standard'} metadata stays in its channel`, () =>
      runUpdater(tag, fixed));
  }
}
test('signature download failures fail CI without publishing metadata', () =>
  runUpdater('v4.5.0-rc.1', false, true));
