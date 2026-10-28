import { spawn } from 'node:child_process';
import { globSync } from 'node:fs';
import { access, cp, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const target = join(root, 'src-tauri/target');
const name = process.platform === 'win32' ? 'nvm-desktop.exe' : 'nvm-desktop';
const bundle = 'NVM Desktop E2E.app';
const binary =
  process.platform === 'darwin'
    ? join(target, 'e2e', bundle, 'Contents/MacOS', name)
    : join(target, 'e2e', name);

async function run(args, env = {}) {
  const child = spawn('pnpm', args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  const code = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (code) => resolve(code ?? 1));
  });
  if (code !== 0) process.exit(code);
}

if (process.argv[2] === 'build') {
  await run(
    [
      'exec',
      'tauri',
      'build',
      '--debug',
      ...(process.platform === 'darwin'
        ? ['--bundles', 'app']
        : ['--no-bundle']),
      '--features',
      'e2e',
      '--config',
      'src-tauri/tauri.e2e.conf.json',
    ],
    { CARGO_TARGET_DIR: target },
  );
  await mkdir(join(target, 'e2e'), { recursive: true });
  if (process.platform === 'darwin') {
    // Native resource lookup requires the full .app layout on macOS.
    await cp(
      join(target, 'debug/bundle/macos', bundle),
      join(target, 'e2e', bundle),
      { recursive: true },
    );
  } else {
    await cp(join(target, 'debug', name), binary);
    await cp(join(root, 'src-tauri/resources'), join(target, 'e2e/resources'), {
      recursive: true,
    });
    await mkdir(join(target, 'e2e/icons'), { recursive: true });
    await cp(
      join(root, 'src-tauri/icons/icon.png'),
      join(target, 'e2e/icons/icon.png'),
    );
  }
} else {
  await access(binary).catch(() => {
    throw new Error('Build the E2E app first: pnpm test:e2e:build');
  });
  const args = process.argv.slice(2);
  const patterns = [];
  const forwarded = [];
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--spec') {
      if (!args[index + 1]) throw new Error('--spec requires a file or glob');
      patterns.push(args[++index]);
    } else if (args[index].startsWith('--spec=')) {
      patterns.push(args[index].slice('--spec='.length));
    } else forwarded.push(args[index]);
  }
  const specs = [
    ...new Set(
      globSync(patterns.length ? patterns : ['test/e2e/**/*.spec.ts'], {
        cwd: root,
      }),
    ),
  ].sort();
  if (!specs.length) throw new Error('No E2E specs matched');
  for (const spec of specs) {
    // Fresh data and native process per spec; leave failed workspaces inspectable.
    const dataDir = await mkdtemp(join(tmpdir(), 'nvmd-e2e-'));
    await mkdir(join(dataDir, 'versions'), { recursive: true });
    await writeFile(
      join(dataDir, 'setting.json'),
      JSON.stringify({
        closer: 'close',
        locale: 'en',
        theme: 'light',
        directory: join(dataDir, 'versions'),
        mirror: 'https://nodejs.org/dist',
        node_version_file: '.nvmdrc',
        embed_server_port: 0,
      }),
    );
    for (const file of ['projects.json', 'groups.json', 'versions.json']) {
      await writeFile(join(dataDir, file), '[]');
    }
    // Skip migration's executable setup; smoke tests do not install a CLI or edit PATH.
    await writeFile(join(dataDir, 'migration'), '33');
    await writeFile(join(dataDir, 'default'), '');
    console.log(`E2E workspace (${spec}): ${dataDir}`);
    await run(
      ['exec', 'wdio', 'run', 'wdio.conf.ts', ...forwarded, '--spec', spec],
      {
        NVMD_E2E_DATA_DIR: dataDir,
        NVMD_HOME: dataDir,
        NVMD_E2E_BINARY: binary,
      },
    );
  }
}
