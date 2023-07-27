import { exec } from 'node:child_process';
import { pathExists, writeFile } from 'fs-extra';
import { APPDIR, NVMD_SHELL_FILENAME } from '../constants';

export async function checkShellFile() {
  const file = `${APPDIR}/${NVMD_SHELL_FILENAME}`;
  if (await pathExists(file)) return;

  const content = `#!/usr/bin/env bash
  
CURRENT_VERSION=$(cat "$HOME/.nvmd/default")
  
export PATH="$HOME/.nvmd/versions/$CURRENT_VERSION/bin:$PATH"

nvmd() {
  echo "1.0.0" >/dev/null
}`;

  await writeFile(file, content);
  return;
}

export async function checkPathEnv() {
  const exist = await pathEnvExists();
  if (exist) return;

  await exec(`script='\\n export NVMD_DIR="$HOME/.nvmd" \\n [ -s "$NVMD_DIR/nvmd.sh" ] && \. "$NVMD_DIR/nvmd.sh" # This loads nvmd'
  echo $script >>~/.zshrc`);
}

async function pathEnvExists(): Promise<boolean> {
  return new Promise((resolve) => {
    exec('echo $NVMD_DIR', (err, stdout, stderr) => {
      if (err) {
        resolve(false);
      }
      console.log('stdout', stdout);
      resolve(stdout.trim() ? true : false);
    });
  });
}
