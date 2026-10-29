import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const script = fileURLToPath(new URL('./check.mjs', import.meta.url));
const stable =
  'https://github.com/1111mp/nvmd-command/releases/latest/download';
const alpha = 'https://github.com/1111mp/nvmd-command/releases/download/alpha';
const envpath = 'https://github.com/1111mp/envpath/releases/latest/download';

async function fixture(t) {
  const dir = await mkdtemp(path.join(tmpdir(), 'nvmd-check-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const resourceDir = path.join(dir, 'src-tauri/resources');
  const plan = path.join(dir, 'responses.json');
  const requests = path.join(dir, 'requests.txt');
  const preload = path.join(dir, 'fetch.mjs');
  await mkdir(resourceDir, { recursive: true });
  // Exercise the real downloader and cache code without network access.
  await writeFile(
    preload,
    `
    import { appendFileSync, readFileSync } from 'node:fs';
    globalThis.fetch = async (url) => {
      appendFileSync(process.env.TEST_REQUESTS, url + '\\n');
      const response = JSON.parse(readFileSync(process.env.TEST_PLAN))[url];
      if (!response) throw new Error('Unexpected download: ' + url);
      if (response.delay) await new Promise(resolve => setTimeout(resolve, response.delay));
      return new Response(response.body, { status: response.status || 200 });
    };
  `,
  );
  return {
    dir,
    resourceDir,
    async run(target, responses, source = stable, force = false) {
      await writeFile(plan, JSON.stringify(responses));
      await writeFile(requests, '');
      execFileSync(
        process.execPath,
        [
          '--import',
          pathToFileURL(preload).href,
          script,
          target,
          ...(force ? ['--force'] : []),
        ],
        {
          cwd: dir,
          env: {
            ...process.env,
            HTTP_PROXY: '',
            http_proxy: '',
            HTTPS_PROXY: '',
            https_proxy: '',
            NVMD_RELEASE_URL: source,
            TEST_PLAN: plan,
            TEST_REQUESTS: requests,
          },
          stdio: 'pipe',
          timeout: 15000,
        },
      );
      return JSON.parse(
        await readFile(path.join(resourceDir, 'runtime-manifest.json')),
      );
    },
    async requests() {
      return (await readFile(requests, 'utf8'))
        .trim()
        .split('\n')
        .filter(Boolean);
    },
  };
}

function windowsResponses(source, arch, binary, wrapper = 'wrapper') {
  return {
    [`${source}/nvmd_windows-${arch}.exe`]: { body: binary },
    [`${source}/temp.cmd`]: { body: wrapper },
    [`${envpath}/envpath_${arch}.exe`]: { body: 'envpath fixture' },
  };
}

test('release preparation refreshes channel/architecture changes and reuses matching cache', async (t) => {
  const f = await fixture(t);
  const initial = await f.run(
    'x86_64-pc-windows-msvc',
    windowsResponses(stable, 'x64', 'stable x64'),
  );
  assert.equal(initial.target, 'win32-x64');
  assert.equal(initial.source, stable);
  assert.equal((await f.requests()).length, 3);
  assert.deepEqual(await f.run('x86_64-pc-windows-msvc', {}), initial);
  assert.deepEqual(await f.requests(), []);

  const preview = await f.run(
    'x86_64-pc-windows-msvc',
    windowsResponses(alpha, 'x64', 'alpha x64'),
    alpha,
  );
  assert.notEqual(preview.bundle_id, initial.bundle_id);
  assert.equal(
    await readFile(path.join(f.resourceDir, 'nvmd.exe'), 'utf8'),
    'alpha x64',
  );
  const arm = await f.run(
    'aarch64-pc-windows-msvc',
    windowsResponses(alpha, 'arm64', 'alpha arm64'),
    alpha,
  );
  assert.equal(arm.target, 'win32-arm64');
  assert.notEqual(arm.bundle_id, preview.bundle_id);

  const tempDir = path.join(f.dir, 'node_modules/.nvmd');
  await mkdir(tempDir, { recursive: true });
  await writeFile(
    path.join(tempDir, 'nvmd_windows-arm64.exe'),
    'stale interrupted download',
  );
  const refreshed = await f.run(
    'aarch64-pc-windows-msvc',
    windowsResponses(alpha, 'arm64', 'new alpha'),
    alpha,
    true,
  );
  assert.notEqual(refreshed.bundle_id, arm.bundle_id);
  assert.equal(
    await readFile(path.join(f.resourceDir, 'nvmd.exe'), 'utf8'),
    'new alpha',
  );
});

test('failed Windows downloads leave no valid manifest and can be retried', async (t) => {
  const f = await fixture(t);
  await f.run(
    'x86_64-pc-windows-msvc',
    windowsResponses(stable, 'x64', 'old binary'),
  );
  const responses = windowsResponses(stable, 'x64', 'new binary');
  responses[`${stable}/temp.cmd`] = { body: 'unavailable', status: 500 };
  responses[`${envpath}/envpath_x64.exe`].delay = 50;
  await assert.rejects(
    f.run('x86_64-pc-windows-msvc', responses, stable, true),
  );
  await assert.rejects(
    readFile(path.join(f.resourceDir, 'runtime-manifest.json')),
    { code: 'ENOENT' },
  );
  await f.run(
    'x86_64-pc-windows-msvc',
    windowsResponses(stable, 'x64', 'new binary'),
  );
  assert.equal(
    await readFile(path.join(f.resourceDir, 'nvmd.exe'), 'utf8'),
    'new binary',
  );
  await rm(path.join(f.resourceDir, 'temp.cmd'));
  await f.run(
    'x86_64-pc-windows-msvc',
    windowsResponses(stable, 'x64', 'new binary', 'repaired wrapper'),
  );
  assert.equal(
    await readFile(path.join(f.resourceDir, 'temp.cmd'), 'utf8'),
    'repaired wrapper',
  );
});

test('cross-compilation cannot reuse an unidentified binary from another architecture', async (t) => {
  const f = await fixture(t);
  await writeFile(path.join(f.resourceDir, 'nvmd'), 'unknown cached binary');
  const responses = { [`${stable}/nvmd_linux-arm64`]: { body: 'linux arm64' } };
  const manifest = await f.run('aarch64-unknown-linux-gnu', responses);
  assert.equal(manifest.target, 'linux-arm64');
  assert.equal(
    await readFile(path.join(f.resourceDir, 'nvmd'), 'utf8'),
    'linux arm64',
  );
});
