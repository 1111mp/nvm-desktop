/**
 * https://github.com/1111mp/nvmd-command/releases/latest
 * Get the latest nvmd executable file from the remote repository nvmd-command according to different platforms and architectures.
 * Download it to the tauri resource directory ("src-tauri/resources")
 */

import fs from 'fs-extra';
import path from 'node:path';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

const cwd = process.cwd();
const TEMP_DIR = path.join(cwd, 'node_modules/.nvmd');
const FORCE = process.argv.includes('--force');

const PLATFORM_MAP = {
  'x86_64-pc-windows-msvc': 'win32',
  'aarch64-pc-windows-msvc': 'win32',
  'x86_64-apple-darwin': 'darwin',
  'aarch64-apple-darwin': 'darwin',
  'x86_64-unknown-linux-gnu': 'linux',
  'aarch64-unknown-linux-gnu': 'linux',
};

const ARCH_MAP = {
  'x86_64-pc-windows-msvc': 'x64',
  'aarch64-pc-windows-msvc': 'arm64',
  'x86_64-apple-darwin': 'x64',
  'aarch64-apple-darwin': 'arm64',
  'x86_64-unknown-linux-gnu': 'x64',
  'aarch64-unknown-linux-gnu': 'arm64',
};

const arg1 = process.argv.slice(2)[0];
const arg2 = process.argv.slice(2)[1];
const target = arg1 === '--force' ? arg2 : arg1;
const { platform, arch } = target
  ? { platform: PLATFORM_MAP[target], arch: ARCH_MAP[target] }
  : process;

const NVMD_RELEASE_URL =
  process.env.NVMD_RELEASE_URL ||
  'https://github.com/1111mp/nvmd-command/releases/latest/download';

const NVMD_LATEST_MAP = {
  'win32-x64': 'nvmd_windows-x64.exe',
  'win32-arm64': 'nvmd_windows-arm64.exe',
  'darwin-x64': 'nvmd_macos-x64',
  'darwin-arm64': 'nvmd_macos-arm64',
  'linux-x64': 'nvmd_linux-x64',
  'linux-arm64': 'nvmd_linux-arm64',
};

/*
 * check available
 */
if (!NVMD_LATEST_MAP[`${platform}-${arch}`]) {
  throw new Error(`nvmd unsupported platform "${platform}-${arch}"`);
}

/**
 * download file and save to `path`
 */
async function downloadFile(url, path) {
  console.log(`[INFO]: start to download "${url}"`);

  const options = {};

  const httpProxy =
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    process.env.HTTPS_PROXY ||
    process.env.https_proxy;

  if (httpProxy) {
    options.agent = new HttpsProxyAgent(httpProxy);
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/octet-stream' },
  });

  const buffer = await response.arrayBuffer();
  await fs.writeFile(path, new Uint8Array(buffer));

  console.log(`[INFO]: download finished "${url}"`);
}

/// download `temp.cmd` on windows platform
async function downlloadCmd(targetPath) {
  const tempDir = TEMP_DIR;
  const downloadURL = `${NVMD_RELEASE_URL}/temp.cmd`;
  const tempfile = path.join(tempDir, 'temp.cmd');

  if (!(await fs.pathExists(tempfile))) {
    await downloadFile(downloadURL, tempfile);
  }

  await fs.move(tempfile, targetPath);

  console.log(`[INFO]: "temp.cmd" move finished`);
}

async function run() {
  const ext = platform === 'win32' ? '.exe' : '';
  const file = `nvmd${ext}`;

  const resDir = path.join(cwd, 'src-tauri', 'resources');
  const targetPath = path.join(resDir, file);
  /// make sure the 'src-tauri/resources` directory exists
  await fs.mkdirp(resDir);
  if (!FORCE && (await fs.pathExists(targetPath))) return;

  const tempDir = TEMP_DIR;
  const name = NVMD_LATEST_MAP[`${platform}-${arch}`];
  const downloadURL = `${NVMD_RELEASE_URL}/${name}`;
  const tempfile = path.join(tempDir, `${name}`);

  await fs.mkdirp(tempDir);

  try {
    if (!(await fs.pathExists(tempfile))) {
      await downloadFile(downloadURL, tempfile);
    }

    await fs.rename(tempfile, targetPath);
    console.log(`[INFO]: "${name}" rename finished`);

    // download `temp.cmd` file
    platform === 'win32' && (await downlloadCmd(path.join(resDir, 'temp.cmd')));
  } catch (err) {
    // need delete file
    await fs.remove(targetPath);
    console.error(`[ERROR]: `, err.message);
    throw err;
  } finally {
    // delete temp dir
    await fs.remove(tempDir);
  }
}

run();
