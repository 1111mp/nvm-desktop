import { compareReleaseTags, releaseChannel } from './release-channel.mjs';

export function validateRelease(tag, release) {
  if (
    release.draft ||
    release.prerelease !== (releaseChannel(tag) === 'updater-alpha')
  ) {
    throw new Error(
      `Release ${tag} must be published with the matching stable/RC classification`,
    );
  }
}

export async function publishUpdate(github, options, tag, filename, data) {
  const channel = releaseChannel(tag);
  let release;
  try {
    ({ data: release } = await github.rest.repos.getReleaseByTag({
      ...options,
      tag: channel,
    }));
  } catch (error) {
    if (error.status !== 404) throw error;
    ({ data: release } = await github.rest.repos.createRelease({
      ...options,
      tag_name: channel,
      name: `Auto-update ${channel === 'updater' ? 'Stable' : 'RC'} Channel`,
      prerelease: channel !== 'updater',
      make_latest: 'false',
    }));
  }

  const previous = release.assets.find((asset) => asset.name === filename);
  if (previous) {
    const response = await fetch(previous.browser_download_url);
    if (!response.ok)
      throw new Error(
        `Cannot read existing ${channel}/${filename}: ${response.status}`,
      );
    const current = await response.json();
    // Releases can finish out of order; retries must never move a channel backwards.
    if (compareReleaseTags(current.version || current.name, tag) > 0) {
      console.log(
        `Keeping newer ${filename}: ${current.version || current.name}`,
      );
      return;
    }
    await github.rest.repos.deleteReleaseAsset({
      ...options,
      asset_id: previous.id,
    });
  }

  await github.rest.repos.uploadReleaseAsset({
    ...options,
    release_id: release.id,
    name: filename,
    data: JSON.stringify(data, null, 2),
  });
}
