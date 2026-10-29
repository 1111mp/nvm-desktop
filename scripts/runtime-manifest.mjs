import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function writeRuntimeManifest(
  resourceDir,
  platform,
  arch,
  source,
) {
  const files = platform === 'win32' ? ['nvmd.exe', 'temp.cmd'] : ['nvmd'];
  const resources = [];
  for (const file of files) {
    const content = await readFile(path.join(resourceDir, file));
    if (content.length === 0)
      throw new Error(`Empty runtime resource: ${file}`);
    resources.push({
      file,
      sha256: createHash('sha256').update(content).digest('hex'),
    });
  }

  // Include the layout version and target so changes to either trigger installation.
  const identity = {
    format_version: 1,
    target: `${platform}-${arch}`,
    resources,
  };
  const manifest = {
    format_version: identity.format_version,
    target: identity.target,
    ...(source ? { source } : {}),
    bundle_id: createHash('sha256')
      .update(JSON.stringify(identity))
      .digest('hex'),
  };
  await writeFile(
    path.join(resourceDir, 'runtime-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  return manifest;
}
