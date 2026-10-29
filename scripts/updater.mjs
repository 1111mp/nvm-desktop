import { context, getOctokit } from '@actions/github';
import { resolveUpdateLog } from './updatelog.mjs';

import { publishUpdate, validateRelease } from './publish-update.mjs';

const RELEASE_TAG = process.env.RELEASE_TAG || process.env.GITHUB_REF_NAME;
const UPDATE_JSON_FILE = 'update.json';

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
      // platform format:
      //    standard: "{os}-{arch}-{installer}",
      //    fallback: "{os}-{arch}"
      'darwin-x86_64': { signature: '', url: '' },
      'darwin-x86_64-app': { signature: '', url: '' },
      'darwin-aarch64': { signature: '', url: '' },
      'darwin-aarch64-app': { signature: '', url: '' },

      'linux-x86_64': { signature: '', url: '' },
      'linux-x86_64-deb': { signature: '', url: '' },
      'linux-x86_64-rpm': { signature: '', url: '' },
      'linux-aarch64': { signature: '', url: '' },
      'linux-aarch64-deb': { signature: '', url: '' },
      'linux-aarch64-rpm': { signature: '', url: '' },
      'linux-armv7': { signature: '', url: '' },
      'linux-armv7-deb': { signature: '', url: '' },
      'linux-armv7-rpm': { signature: '', url: '' },

      'windows-x86_64': { signature: '', url: '' },
      'windows-x86_64-nsis': { signature: '', url: '' },
      'windows-aarch64': { signature: '', url: '' },
      'windows-aarch64-nsis': { signature: '', url: '' },
    },
  };

  const promises = latestRelease.assets.map(async (asset) => {
    const { name, browser_download_url } = asset;

    // Process all the platform URL and signature data
    // win64 url
    if (name.endsWith('x64-setup.exe')) {
      updateData.platforms['windows-x86_64'].url = browser_download_url;
      updateData.platforms['windows-x86_64-nsis'].url = browser_download_url;
    }
    // win64 signature
    if (name.endsWith('x64-setup.exe.sig')) {
      const sig = await getSignature(browser_download_url);
      updateData.platforms['windows-x86_64'].signature = sig;
      updateData.platforms['windows-x86_64-nsis'].signature = sig;
    }
    // win arm url
    if (name.endsWith('arm64-setup.exe')) {
      updateData.platforms['windows-aarch64'].url = browser_download_url;
      updateData.platforms['windows-aarch64-nsis'].url = browser_download_url;
    }
    // win arm signature
    if (name.endsWith('arm64-setup.exe.sig')) {
      const sig = await getSignature(browser_download_url);
      updateData.platforms['windows-aarch64'].signature = sig;
      updateData.platforms['windows-aarch64-nsis'].signature = sig;
    }

    // darwin url (intel)
    if (name.endsWith('.app.tar.gz') && !name.includes('aarch')) {
      updateData.platforms['darwin-x86_64'].url = browser_download_url;
      updateData.platforms['darwin-x86_64-app'].url = browser_download_url;
    }
    // darwin signature (intel)
    if (name.endsWith('.app.tar.gz.sig') && !name.includes('aarch')) {
      const sig = await getSignature(browser_download_url);
      updateData.platforms['darwin-x86_64'].signature = sig;
      updateData.platforms['darwin-x86_64-app'].signature = sig;
    }
    // darwin url (aarch)
    if (name.endsWith('aarch64.app.tar.gz')) {
      updateData.platforms['darwin-aarch64'].url = browser_download_url;
      updateData.platforms['darwin-aarch64-app'].url = browser_download_url;
    }
    // darwin signature (aarch)
    if (name.endsWith('aarch64.app.tar.gz.sig')) {
      const sig = await getSignature(browser_download_url);
      updateData.platforms['darwin-aarch64'].signature = sig;
      updateData.platforms['darwin-aarch64-app'].signature = sig;
    }

    // Linux x86_64
    if (name.endsWith('amd64.deb')) {
      updateData.platforms['linux-x86_64'].url = browser_download_url;
      updateData.platforms['linux-x86_64-deb'].url = browser_download_url;
    }
    if (name.endsWith('amd64.deb.sig')) {
      const sig = await getSignature(browser_download_url);
      updateData.platforms['linux-x86_64'].signature = sig;
      updateData.platforms['linux-x86_64-deb'].signature = sig;
    }
    if (name.endsWith('x86_64.rpm')) {
      updateData.platforms['linux-x86_64-rpm'].url = browser_download_url;
    }
    if (name.endsWith('x86_64.rpm.sig')) {
      const sig = await getSignature(browser_download_url);
      updateData.platforms['linux-x86_64-rpm'].signature = sig;
    }

    // Linux aarch64
    if (name.endsWith('arm64.deb')) {
      updateData.platforms['linux-aarch64'].url = browser_download_url;
      updateData.platforms['linux-aarch64-deb'].url = browser_download_url;
    }
    if (name.endsWith('arm64.deb.sig')) {
      const sig = await getSignature(browser_download_url);
      updateData.platforms['linux-aarch64'].signature = sig;
      updateData.platforms['linux-aarch64-deb'].signature = sig;
    }
    if (name.endsWith('aarch64.rpm')) {
      updateData.platforms['linux-aarch64-rpm'].url = browser_download_url;
    }
    if (name.endsWith('aarch64.rpm.sig')) {
      const sig = await getSignature(browser_download_url);
      updateData.platforms['linux-aarch64-rpm'].signature = sig;
    }

    // Linux armv7
    if (name.endsWith('armhf.deb')) {
      updateData.platforms['linux-armv7'].url = browser_download_url;
      updateData.platforms['linux-armv7-deb'].url = browser_download_url;
    }
    if (name.endsWith('armhf.deb.sig')) {
      const sig = await getSignature(browser_download_url);
      updateData.platforms['linux-armv7'].signature = sig;
      updateData.platforms['linux-armv7-deb'].signature = sig;
    }
    if (name.endsWith('armhfp.rpm')) {
      updateData.platforms['linux-armv7-rpm'].url = browser_download_url;
    }
    if (name.endsWith('armhfp.rpm.sig')) {
      const sig = await getSignature(browser_download_url);
      updateData.platforms['linux-armv7-rpm'].signature = sig;
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
