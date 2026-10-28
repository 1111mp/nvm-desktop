import { getVersion } from '@tauri-apps/api/app';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  emptyUpdateProgress,
  reduceUpdateProgress,
} from '@/lib/update-progress';
import { relaunch } from '@/services/cmds';

export type UpdatePhase =
  | 'idle'
  | 'checking'
  | 'current'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'installing'
  | 'error';
type FailureStage = 'check' | 'download' | 'install' | 'restart';

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : '';
}

export function useAppUpdater({ enabled = true }: { enabled?: boolean } = {}) {
  const [phase, setPhase] = useState<UpdatePhase>('idle');
  const [updateInfo, setUpdateInfo] = useState<Update | null>(null);
  const [currentVersion, setCurrentVersion] = useState('');
  const [progress, setProgress] = useState(emptyUpdateProgress);
  const [error, setError] = useState('');
  const [failureStage, setFailureStage] = useState<FailureStage>('check');
  const mounted = useRef(false);
  const resource = useRef<Update | null>(null);
  const sequence = useRef(0);
  const checking = useRef<Promise<void> | null>(null);
  const busy = useRef(false);
  const installed = useRef(false);

  const checkUpdates = useCallback(() => {
    if (checking.current) return checking.current;
    if (busy.current) return Promise.resolve();
    const id = ++sequence.current;
    setPhase('checking');
    setError('');
    const request = (async () => {
      try {
        const update = await check();
        if (!mounted.current || id !== sequence.current) {
          await update?.close().catch(() => {});
          return;
        }
        await resource.current?.close().catch(() => {});
        if (!mounted.current || id !== sequence.current) {
          await update?.close().catch(() => {});
          return;
        }
        resource.current = update;
        installed.current = false;
        setUpdateInfo(update);
        if (update) setCurrentVersion(update.currentVersion);
        setPhase(update ? 'available' : 'current');
      } catch (error) {
        if (mounted.current && id === sequence.current) {
          setError(errorMessage(error));
          setFailureStage('check');
          setPhase('error');
        }
      } finally {
        if (id === sequence.current) checking.current = null;
      }
    })();
    checking.current = request;
    return request;
  }, []);

  const dispose = useCallback(() => {
    mounted.current = false;
    sequence.current++;
    checking.current = null;
    // Checks resolving after cleanup close their own resource instead of leaking it.
    const update = resource.current;
    resource.current = null;
    if (!installed.current) void update?.close().catch(() => {});
  }, []);

  useEffect(() => {
    if (!enabled) return;
    mounted.current = true;
    void getVersion()
      .then((version) => {
        if (mounted.current) setCurrentVersion(version);
      })
      .catch(() => {});
    void checkUpdates();
    return dispose;
  }, [checkUpdates, dispose, enabled]);

  const download = async () => {
    const update = resource.current;
    if (!update || busy.current) return false;
    busy.current = true;
    setError('');
    setProgress(emptyUpdateProgress);
    setPhase('downloading');
    try {
      await update.download((event) => {
        if (mounted.current)
          setProgress((previous) => reduceUpdateProgress(previous, event));
      });
      // Enable installation only after the download promise (including validation) succeeds.
      if (mounted.current) {
        setProgress((previous) => ({ ...previous, finished: true }));
        setPhase('ready');
      }
      return mounted.current;
    } catch (error) {
      if (mounted.current) {
        setError(errorMessage(error));
        setFailureStage('download');
        setPhase('error');
      }
      return false;
    } finally {
      busy.current = false;
    }
  };

  const install = async () => {
    const update = resource.current;
    if (!update || busy.current) return;
    busy.current = true;
    setError('');
    setPhase('installing');
    try {
      // A failed restart must not reinstall a package that already installed successfully.
      if (!installed.current) {
        await update.install();
        installed.current = true;
      }
      await relaunch();
    } catch (error) {
      if (mounted.current) {
        setError(errorMessage(error));
        setFailureStage(installed.current ? 'restart' : 'install');
        setPhase('error');
      }
    } finally {
      busy.current = false;
    }
  };

  return {
    phase,
    updateInfo,
    currentVersion,
    progress,
    error,
    failureStage,
    checkUpdates,
    download,
    install,
  };
}
