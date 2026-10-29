import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { writeRuntimeManifest } from './runtime-manifest.mjs';

test('runtime identity follows resource contents and target, not timestamps', async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nvmd-manifest-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(path.join(dir, 'nvmd'), 'first binary');
  const initial = await writeRuntimeManifest(dir, 'darwin', 'arm64');
  assert.deepEqual(await writeRuntimeManifest(dir, 'darwin', 'arm64'), initial);
  const otherTarget = await writeRuntimeManifest(dir, 'darwin', 'x64');
  assert.notEqual(otherTarget.bundle_id, initial.bundle_id);
  await writeFile(path.join(dir, 'nvmd'), 'second binary');
  const updated = await writeRuntimeManifest(dir, 'darwin', 'arm64');
  assert.notEqual(updated.bundle_id, initial.bundle_id);
  assert.deepEqual(
    JSON.parse(await readFile(path.join(dir, 'runtime-manifest.json'))),
    updated,
  );
});

test('Windows wrapper changes trigger an update even with the same executable', async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nvmd-manifest-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(path.join(dir, 'nvmd.exe'), 'binary');
  await writeFile(path.join(dir, 'temp.cmd'), 'first wrapper');
  const initial = await writeRuntimeManifest(dir, 'win32', 'x64');
  await writeFile(path.join(dir, 'temp.cmd'), 'second wrapper');
  const updated = await writeRuntimeManifest(dir, 'win32', 'x64');
  assert.notEqual(updated.bundle_id, initial.bundle_id);
  await writeFile(path.join(dir, 'nvmd.exe'), '');
  await assert.rejects(
    writeRuntimeManifest(dir, 'win32', 'x64'),
    /Empty runtime resource/,
  );
});
