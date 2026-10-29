import { getOctokit, context } from '@actions/github';
import { resolveUpdateLog } from './updatelog.mjs';

import { publishUpdate, validateRelease } from './publish-update.mjs';

const RELEASE_TAG = process.env.RELEASE_TAG || process.env.GITHUB_REF_NAME;
const UPDATE_JSON_FILE = 'update-fixed-webview2.json';

/// generate update.json
/// upload to update tag's release asset
async function resolveUpdater() {
  if (process.env.GITHUB_TOKEN === undefined) {
    throw new Error('GITHUB_TOKEN is required');
  }

  const options = { owner: context.repo.owner, repo: context.repo.repo };
  const github = getOctokit(process.env.GITHUB_TOKEN);

  const tag = { name: RELEASE_TAG };

  const { data: latestRelease } = await github.rest.repos.getReleaseByTag({
    ...options,
    tag: tag.name,
  });
  validateRelease(tag.name, latestRelease);

  let notes = '';
  try {
    // use updatelog.md
    notes = await resolveUpdateLog(tag.name);
  } catch (err) {
    console.error(`Resolve update log [ERROR]: `, err.message);
  }

  const updateData = {
    name: tag.name,
    version: tag.name.slice(1),
    notes,
    pub_date: new Date().toISOString(),
    platforms: {
      'windows-x86_64': { signature: '', url: '' },
      'windows-aarch64': { signature: '', url: '' },
    },
  };

  const promises = latestRelease.assets.map(async (asset) => {
    const { name, browser_download_url } = asset;

    // win64 url
    if (name.endsWith('x64_fixed_webview2-setup.exe')) {
      updateData.platforms['windows-x86_64'].url = browser_download_url;
    }
    // win64 signature
    if (name.endsWith('x64_fixed_webview2-setup.exe.sig')) {
      const sig = await getSignature(browser_download_url);
      updateData.platforms['windows-x86_64'].signature = sig;
    }

    // win arm url
    if (name.endsWith('arm64_fixed_webview2-setup.exe')) {
      updateData.platforms['windows-aarch64'].url = browser_download_url;
    }
    // win arm signature
    if (name.endsWith('arm64_fixed_webview2-setup.exe.sig')) {
      const sig = await getSignature(browser_download_url);
      updateData.platforms['windows-aarch64'].signature = sig;
    }
  });

  await Promise.all(promises);
  console.log('updateData', updateData);

  for (const [platform, entry] of Object.entries(updateData.platforms)) {
    if (!entry.url || !entry.signature) {
      throw new Error(`Missing update artifact or signature for ${platform}`);
    }
  }

  await publishUpdate(github, options, tag.name, UPDATE_JSON_FILE, updateData);
}

// get the signature file content
async function getSignature(url) {
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/octet-stream' },
  });

  if (!response.ok)
    throw new Error(`Signature request failed: ${response.status} ${url}`);
  const signature = (await response.text()).trim();
  if (!signature) throw new Error(`Empty signature: ${url}`);
  return signature;
}

resolveUpdater().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
