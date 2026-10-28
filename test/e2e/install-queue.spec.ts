import { createServer } from 'node:http';
import { browser, expect } from '@wdio/globals';

type Task = { id: number; version: string; phase: string };
const terminal = (task: Task) =>
  ['complete', 'failed', 'cancelled'].includes(task.phase);
const invoke = <T>(command: string, args: Record<string, unknown> = {}) =>
  browser.tauri.execute(
    ({ core }, name, payload) => core.invoke(name, payload),
    command,
    args,
  ) as Promise<T>;

// Keep real downloads pending so cancellation and queue admission can be
// exercised without external network access or installing a real runtime.
const mirror = createServer((request, response) => {
  if (request.url?.startsWith('/v22.0.6/')) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { 'Content-Length': 1024 * 1024 });
  response.write(Buffer.alloc(1024));
});

describe('Native installation queue', () => {
  before(async () => {
    await new Promise<void>((resolve) =>
      mirror.listen(0, '127.0.0.1', resolve),
    );
    await browser.waitUntil(async () => {
      try {
        return !!(await invoke('read_settings'));
      } catch {
        return false;
      }
    });
    const address = mirror.address();
    if (!address || typeof address === 'string')
      throw new Error('Missing test mirror address');
    await invoke('update_settings', {
      payload: { mirror: `http://127.0.0.1:${address.port}`, no_proxy: true },
    });
  });
  after(async () => {
    try {
      await invoke('cancel_install_task');
    } finally {
      mirror.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        mirror.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });

  it('rejects duplicate batches atomically, locks settings and cancels tasks independently', async () => {
    const requests = ['22.0.1', '22.0.2', '22.0.3', '22.0.4'].map(
      (version) => ({ version, arch: 'x64' }),
    );
    const tasks = await invoke<Task[]>('enqueue_installs', { requests });
    expect(tasks).toHaveLength(4);
    await browser.waitUntil(
      async () =>
        (await invoke<Task[]>('install_tasks')).filter(
          (task) => task.phase === 'download',
        ).length === 2,
    );
    let rejected = false;
    try {
      await invoke('enqueue_installs', {
        requests: [{ version: '22.0.5', arch: 'x64' }, requests[0]],
      });
    } catch {
      rejected = true;
    }
    expect(rejected).toBe(true);
    expect(await invoke<Task[]>('install_tasks')).toHaveLength(4);
    const settings = await invoke<{ directory: string }>('read_settings');
    for (const payload of [
      { mirror: 'http://127.0.0.1:1' },
      { directory: `${settings.directory}-changed` },
      { no_proxy: false },
      { proxy: { enabled: true, ip: '127.0.0.1', port: 9000 } },
    ]) {
      rejected = false;
      try {
        await invoke('update_settings', { payload });
      } catch {
        rejected = true;
      }
      expect(rejected).toBe(true);
    }
    // Appearance changes remain available while network/directory changes are locked.
    await invoke('update_settings', { payload: { theme: 'dark' } });
    expect((await invoke<{ theme: string }>('read_settings')).theme).toBe(
      'dark',
    );
    await invoke('update_settings', { payload: { theme: 'light' } });
    await invoke('cancel_install_task', { id: tasks[0].id });
    await browser.waitUntil(
      async () =>
        (await invoke<Task[]>('install_tasks')).find(
          (task) => task.id === tasks[0].id,
        )?.phase === 'cancelled',
    );
    expect(
      (await invoke<Task[]>('install_tasks')).some(
        (task) => task.id !== tasks[0].id && !terminal(task),
      ),
    ).toBe(true);
    await invoke('cancel_install_task');
    await browser.waitUntil(async () =>
      (await invoke<Task[]>('install_tasks')).every(
        (task) => task.phase === 'cancelled',
      ),
    );
    expect(await invoke('current', { fetch: true })).toBeFalsy();
    expect(await invoke('installed_list', { fetch: true })).toEqual([]);
  });

  it('rejects a retry whose saved installation directory no longer matches', async () => {
    let message = '';
    try {
      await invoke('enqueue_installs', {
        requests: [
          {
            version: '22.0.5',
            arch: 'x64',
            directory: '/not-the-current-install-directory',
          },
        ],
      });
    } catch (error) {
      message = String(error);
    }
    expect(message).toContain('installation directory has changed');
    expect(await invoke<Task[]>('install_tasks')).toHaveLength(4);
  });

  it('a failed download does not stop other tasks and can be retried independently', async () => {
    const requests = ['22.0.6', '22.0.7'].map((version) => ({
      version,
      arch: 'x64',
    }));
    const added = await invoke<Task[]>('enqueue_installs', { requests });
    await browser.waitUntil(
      async () =>
        (await invoke<Task[]>('install_tasks')).find(
          (task) => task.id === added[0].id,
        )?.phase === 'failed',
    );
    expect(
      (await invoke<Task[]>('install_tasks')).find(
        (task) => task.id === added[1].id,
      )?.phase,
    ).toBe('download');
    const retry = await invoke<Task[]>('enqueue_installs', {
      requests: [requests[0]],
    });
    expect(retry[0].id).not.toBe(added[0].id);
    await browser.waitUntil(
      async () =>
        (await invoke<Task[]>('install_tasks')).find(
          (task) => task.id === retry[0].id,
        )?.phase === 'download',
    );
    await invoke('cancel_install_task');
    await browser.waitUntil(async () =>
      (await invoke<Task[]>('install_tasks')).every(terminal),
    );
    expect(
      (await invoke<Task[]>('install_tasks')).find(
        (task) => task.id === added[0].id,
      )?.phase,
    ).toBe('failed');
  });
});
