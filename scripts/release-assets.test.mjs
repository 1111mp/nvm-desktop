import assert from 'node:assert/strict';
import test from 'node:test';
import {
  requiredReleaseAssets,
  validateReleaseAssets,
} from './release-assets.mjs';

for (const tag of ['v4.5.0', 'v4.5.0-rc.1']) {
  test(`${tag}: all nine builds and signatures must exist before publishing`, () => {
    const assets = requiredReleaseAssets(tag).map((name) => ({
      name,
      state: 'uploaded',
      size: 100,
    }));
    assert.equal(assets.length, 26);
    validateReleaseAssets({ tag_name: tag, assets }, tag);
    for (let index = 0; index < assets.length; index++) {
      assert.throws(() =>
        validateReleaseAssets(
          { tag_name: tag, assets: assets.filter((_, i) => index !== i) },
          tag,
        ),
      );
    }
    assert.throws(() =>
      validateReleaseAssets(
        {
          tag_name: tag,
          assets: assets.map((asset) => ({ ...asset, size: 0 })),
        },
        tag,
      ),
    );
    assert.throws(() =>
      validateReleaseAssets({ tag_name: 'wrong', assets }, tag),
    );
  });
}
