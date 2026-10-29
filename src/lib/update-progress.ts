import type { DownloadEvent } from '@tauri-apps/plugin-updater';

export type UpdateProgress = {
  transferred: number;
  total?: number;
  finished: boolean;
};
export const emptyUpdateProgress: UpdateProgress = {
  transferred: 0,
  finished: false,
};

export function reduceUpdateProgress(
  previous: UpdateProgress,
  event: DownloadEvent,
): UpdateProgress {
  switch (event.event) {
    case 'Started':
      return {
        transferred: 0,
        total:
          event.data.contentLength && event.data.contentLength > 0
            ? event.data.contentLength
            : undefined,
        finished: false,
      };
    case 'Progress':
      return {
        ...previous,
        transferred: previous.transferred + Math.max(0, event.data.chunkLength),
      };
    case 'Finished':
      return { ...previous, finished: true };
  }
}

export function updatePercentage(progress: UpdateProgress) {
  if (progress.finished) return 100;
  // Start empty while waiting for metadata; only use indeterminate progress once bytes arrive.
  if (progress.transferred === 0) return 0;
  // Content-Length is optional; an unknown-size download must stay indeterminate.
  if (!progress.total) return undefined;
  return Math.min(
    100,
    Math.max(0, (progress.transferred / progress.total) * 100),
  );
}

export function formatDownloadSize(bytes: number, locale: string) {
  const safe = Math.max(0, Number.isFinite(bytes) ? bytes : 0);
  const unit =
    safe >= 1024 ** 3 ? 3 : safe >= 1024 ** 2 ? 2 : safe >= 1024 ? 1 : 0;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(safe / 1024 ** unit)} ${['B', 'KiB', 'MiB', 'GiB'][unit]}`;
}
