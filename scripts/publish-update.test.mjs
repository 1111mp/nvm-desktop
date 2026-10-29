import assert from 'node:assert/strict';
import test from 'node:test';
import { publishUpdate, validateRelease } from './publish-update.mjs';
import { compareReleaseTags } from './release-channel.mjs';

test('version comparison follows numeric SemVer ordering including RC and stable', () => {
  for (const [a, b] of [
    ['v4.5.0-rc.10', 'v4.5.0-rc.2'],
    ['v4.5.0', 'v4.5.0-rc.10'],
    ['v4.10.0', 'v4.9.99'],
  ]) {
    assert.equal(compareReleaseTags(a, b), 1);
    assert.equal(compareReleaseTags(b, a), -1);
  }
  assert.equal(compareReleaseTags('4.5.0', 'v4.5.0'), 0);
  assert.throws(() => compareReleaseTags('invalid', 'v4.5.0'));
});

test('drafts and mismatched release classifications cannot update channels', () => {
  validateRelease('v4.5.0', { draft: false, prerelease: false });
  validateRelease('v4.5.0-rc.1', { draft: false, prerelease: true });
  assert.throws(() =>
    validateRelease('v4.5.0', { draft: true, prerelease: false }),
  );
  assert.throws(() =>
    validateRelease('v4.5.0-rc.1', { draft: false, prerelease: false }),
  );
});

test('an older rerun leaves existing channel metadata untouched', async () => {
  const calls = [];
  const github = {
    rest: {
      repos: {
        getReleaseByTag: async () => ({
          data: {
            id: 1,
            assets: [
              {
                id: 2,
                name: 'update.json',
                browser_download_url: 'https://example.test/update.json',
              },
            ],
          },
        }),
        deleteReleaseAsset: async () => {
          calls.push('delete');
        },
        uploadReleaseAsset: async () => {
          calls.push('upload');
        },
      },
    },
  };
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ name: 'v4.5.0-rc.10' }),
    });
    await publishUpdate(github, {}, 'v4.5.0-rc.2', 'update.json', {});
    assert.deepEqual(calls, []);
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ name: 'v4.5.0-rc.1' }),
    });
    await publishUpdate(github, {}, 'v4.5.0-rc.2', 'update.json', {});
    assert.deepEqual(calls, ['delete', 'upload']);
    globalThis.fetch = async () => ({ ok: false, status: 503 });
    await assert.rejects(
      publishUpdate(github, {}, 'v4.5.0-rc.2', 'update.json', {}),
    );
    assert.deepEqual(calls, ['delete', 'upload']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
