import { readFile, writeFile } from 'node:fs/promises';
import { releaseChannel } from './release-channel.mjs';

const channel = releaseChannel(process.env.GITHUB_REF_NAME);
// Fixed WebView2 replaces the Windows config during CI, so update its sources too.
for (const name of [
  'tauri.conf.json',
  'webview2.x64.json',
  'webview2.arm64.json',
]) {
  const path = `src-tauri/${name}`;
  const config = JSON.parse(await readFile(path, 'utf8'));
  const filename = name.startsWith('webview2.')
    ? 'update-fixed-webview2.json'
    : 'update.json';
  config.plugins.updater.endpoints = [
    `https://github.com/1111mp/nvm-desktop/releases/download/${channel}/${filename}`,
  ];
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`);
}
console.log(`Configured updater channel: ${channel}`);
