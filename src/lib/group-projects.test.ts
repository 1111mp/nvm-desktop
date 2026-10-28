import { assert, expect, test } from 'vitest';
import { saveGroupProjects } from './group-projects.ts';

function fixture() {
  return {
    name: 'target',
    version: '22.0.0',
    selected: ['/deleted'],
    projects: [
      {
        name: 'deleted',
        path: '/deleted',
        version: 'old',
        active: false,
        createAt: '2026-01-01',
        updateAt: '2026-01-01',
      },
    ],
    groups: [
      { name: 'target', version: '22.0.0', projects: [] },
      { name: 'old', version: '20.0.0', projects: ['/deleted'] },
    ],
  };
}

test('missing project write rejects before persisting or mutating membership', async () => {
  const input = fixture();
  const snapshot = structuredClone(input);
  const error = new Error('failed to write /deleted/.node-version');
  let saves = 0;
  await expect(
    saveGroupProjects(input, {
      clearVersions: async () => {},
      writeVersions: async () => {
        throw error;
      },
      saveProjects: async () => {
        saves++;
      },
      saveGroups: async () => {
        saves++;
      },
    }),
  ).rejects.toThrow(error);
  assert.equal(saves, 0);
  assert.deepEqual(input, snapshot);
});

test('successful move writes the file before saving project and group membership', async () => {
  const input = fixture();
  const snapshot = structuredClone(input);
  const calls: unknown[][] = [];
  const result = await saveGroupProjects(input, {
    clearVersions: async () => {},
    writeVersions: async (paths, version) => {
      calls.push(['write', paths, version]);
    },
    saveProjects: async () => {
      calls.push(['projects']);
    },
    saveGroups: async () => {
      calls.push(['groups']);
    },
  });
  assert.deepEqual(calls, [
    ['write', ['/deleted'], '22.0.0'],
    ['projects'],
    ['groups'],
  ]);
  assert.equal(result.projects[0].version, 'target');
  assert.deepEqual(
    result.groups.map((group) => group.projects),
    [['/deleted'], []],
  );
  assert.deepEqual(input, snapshot);
});

test('membership save failure attempts to restore both config snapshots', async () => {
  const input = fixture();
  const projectSaves: Nvmd.Project[][] = [];
  const groupSaves: Nvmd.Group[][] = [];
  await expect(
    saveGroupProjects(input, {
      clearVersions: async () => {},
      writeVersions: async () => {},
      saveProjects: async (projects) => {
        projectSaves.push(projects);
      },
      saveGroups: async (groups) => {
        groupSaves.push(groups);
        if (groupSaves.length === 1) throw new Error('save failed');
      },
    }),
  ).rejects.toThrow(/save failed/);
  assert.deepEqual(projectSaves.at(-1), input.projects);
  assert.deepEqual(groupSaves.at(-1), input.groups);
});

test('a stale membership can be removed when clearing its missing file returns 404', async () => {
  const input = fixture();
  input.groups[0].projects = ['/deleted'];
  input.groups[1].projects = [];
  input.projects[0].version = 'target';
  input.selected = [];
  const result = await saveGroupProjects(input, {
    writeVersions: async () => {
      assert.fail('removal must not use batch writes');
    },
    clearVersions: async (paths) => {
      assert.deepEqual(paths, ['/deleted']);
      return [404];
    },
    saveProjects: async () => {},
    saveGroups: async () => {},
  });
  assert.equal(result.projects[0].version, '');
  assert.deepEqual(result.groups[0].projects, []);
});
