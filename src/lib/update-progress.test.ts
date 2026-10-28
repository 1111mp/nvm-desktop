import { assert, test } from 'vitest';
import {
  emptyUpdateProgress,
  formatDownloadSize,
  reduceUpdateProgress,
  updatePercentage,
} from './update-progress.ts';

test('known-size downloads accumulate chunks and clamp progress to 100 percent', () => {
  let state = reduceUpdateProgress(emptyUpdateProgress, {
    event: 'Started',
    data: { contentLength: 100 },
  });
  state = reduceUpdateProgress(state, {
    event: 'Progress',
    data: { chunkLength: 25 },
  });
  assert.equal(updatePercentage(state), 25);
  state = reduceUpdateProgress(state, {
    event: 'Progress',
    data: { chunkLength: 100 },
  });
  assert.equal(updatePercentage(state), 100);
});

test('unknown and zero content lengths stay indeterminate until completion', () => {
  for (const contentLength of [undefined, 0]) {
    let state = reduceUpdateProgress(emptyUpdateProgress, {
      event: 'Started',
      data: { contentLength },
    });
    state = reduceUpdateProgress(state, {
      event: 'Progress',
      data: { chunkLength: 4096 },
    });
    assert.equal(updatePercentage(state), undefined);
    assert.equal(state.transferred, 4096);
    state = reduceUpdateProgress(state, { event: 'Finished' });
    assert.equal(updatePercentage(state), 100);
  }
});

test('a new download resets old completion and byte counts', () => {
  const old = { transferred: 4096, total: 4096, finished: true };
  const state = reduceUpdateProgress(old, {
    event: 'Started',
    data: { contentLength: 8192 },
  });
  assert.equal(state.finished, false);
  assert.equal(state.transferred, 0);
  assert.equal(updatePercentage(state), 0);
});

test('download sizes are human-readable and tolerate invalid values', () => {
  assert.equal(formatDownloadSize(1.5 * 1024 ** 2, 'en'), '1.5 MiB');
  assert.equal(formatDownloadSize(1024 ** 3, 'en'), '1 GiB');
  assert.equal(formatDownloadSize(Number.NaN, 'en'), '0 B');
});
