export type InstallRequest = {
  version: string;
  arch: string;
  directory?: string;
};
export type InstallTask = InstallRequest & {
  id: number;
  directory: string;
  phase:
    | 'queued'
    | 'download'
    | 'verify'
    | 'waiting-extract'
    | 'unzip'
    | 'cancelling'
    | 'complete'
    | 'failed'
    | 'cancelled';
  transferred: number;
  total: number;
  error?: string;
  path?: string;
  revision: number;
};
export const isInstallActive = (task: InstallTask) =>
  !['complete', 'failed', 'cancelled'].includes(task.phase);

export function mergeInstallTasks(
  current: InstallTask[],
  incoming: InstallTask[],
) {
  const tasks = new Map(current.map((task) => [task.id, task]));
  for (const task of incoming) {
    // A snapshot may resolve after a newer progress event was already received.
    if ((tasks.get(task.id)?.revision ?? -1) <= task.revision)
      tasks.set(task.id, task);
  }
  return [...tasks.values()].sort((a, b) => a.id - b.id);
}

export function latestInstallTasks(tasks: InstallTask[]) {
  const latest = new Map<string, InstallTask>();
  for (const task of tasks)
    latest.set(`${task.directory}\0${task.version}`, task);
  return [...latest.values()];
}

export function availableArchitectures(version: Nvmd.Version) {
  const platform =
    OS_PLATFORM === 'darwin'
      ? 'osx'
      : OS_PLATFORM === 'win32'
        ? 'win'
        : OS_PLATFORM;
  return ['arm64', 'x64', 'x86'].filter((arch) =>
    version.files.some((file) => file.includes(`${platform}-${arch}`)),
  );
}
export const preferredArchitecture = ['x86', 'x32', 'ia32'].includes(OS_ARCH)
  ? 'x86'
  : OS_ARCH;
