import { env } from 'node:process';

const MIRRORS = [
  'NODE_MIRROR',
  'NVM_NODEJS_ORG_MIRROR',
  'N_NODE_MIRROR',
  'NODIST_NODE_MIRROR',
];

const getEnv = (name: string) => env[name];

const DEFAULT_MIRROR = 'https://nodejs.org/dist';

export const getDefaultMirror = () =>
  MIRRORS.map(getEnv).find(Boolean) ?? DEFAULT_MIRROR;
