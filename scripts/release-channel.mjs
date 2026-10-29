export function releaseChannel(tag) {
  if (
    !/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-rc\.(0|[1-9]\d*))?$/.test(
      tag ?? '',
    )
  ) {
    throw new Error(`Expected vX.Y.Z or vX.Y.Z-rc.N, received: ${tag}`);
  }
  return tag.includes('-rc.') ? 'updater-alpha' : 'updater';
}

export function compareReleaseTags(left, right) {
  // Existing updater manifests may carry a version without the tag's v prefix.
  left = left?.startsWith('v') ? left : `v${left}`;
  right = right?.startsWith('v') ? right : `v${right}`;
  releaseChannel(left);
  releaseChannel(right);
  const a = left
    .slice(1)
    .split(/\.|-rc\./)
    .map(BigInt);
  const b = right
    .slice(1)
    .split(/\.|-rc\./)
    .map(BigInt);
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
  }
  if (a.length !== b.length) return a.length < b.length ? 1 : -1;
  return a[3] === b[3] ? 0 : a[3] > b[3] ? 1 : -1;
}
