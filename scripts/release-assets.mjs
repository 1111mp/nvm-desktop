import { releaseChannel } from './release-channel.mjs';

export function requiredReleaseAssets(tag) {
  releaseChannel(tag);
  const version = tag.slice(1);
  const installers = [];
  const updaterArtifacts = [];
  for (const arch of ['x64', 'aarch64']) {
    installers.push(`NVM.Desktop_${version}_${arch}.dmg`);
    updaterArtifacts.push(`NVM.Desktop_${version}_${arch}.app.tar.gz`);
  }
  for (const arch of ['x64', 'arm64']) {
    updaterArtifacts.push(`NVM.Desktop_${version}_${arch}-setup.exe`);
    updaterArtifacts.push(
      `NVM.Desktop_${version}_${arch}_fixed_webview2-setup.exe`,
    );
  }
  for (const arch of ['amd64', 'arm64', 'armhf']) {
    updaterArtifacts.push(`NVM.Desktop_${version}_${arch}.deb`);
  }
  for (const arch of ['x86_64', 'aarch64', 'armhfp']) {
    updaterArtifacts.push(`NVM.Desktop-${version}-1.${arch}.rpm`);
  }
  return [
    ...installers,
    ...updaterArtifacts.flatMap((name) => [name, `${name}.sig`]),
  ];
}

export function validateReleaseAssets(release, tag) {
  if (release.tag_name !== tag)
    throw new Error(`Release tag mismatch: ${release.tag_name}`);
  for (const name of requiredReleaseAssets(tag)) {
    const asset = release.assets.find((entry) => entry.name === name);
    if (!asset || asset.state !== 'uploaded' || asset.size <= 0) {
      throw new Error(`Missing or incomplete release asset: ${name}`);
    }
  }
}
