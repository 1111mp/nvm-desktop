import { assert, afterEach, beforeEach, test } from 'vitest';
import {
  markOnboardingSeen,
  resetOnboarding,
  shouldShowOnboarding,
} from './onboarding.ts';

const originalStorage = Object.getOwnPropertyDescriptor(
  globalThis,
  'localStorage',
);
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
let values: Map<string, string>;

beforeEach(() => {
  values = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: new EventTarget(),
  });
});

afterEach(() => {
  for (const [name, descriptor] of [
    ['localStorage', originalStorage],
    ['window', originalWindow],
  ] as const) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else Reflect.deleteProperty(globalThis, name);
  }
});

test('first launch shows the introduction; dismissal suppresses later launches', () => {
  assert.equal(shouldShowOnboarding(), true);
  markOnboardingSeen();
  assert.equal(shouldShowOnboarding(), false);
});

test('the previous tour completion record remains compatible', () => {
  values.set('nvmd-first', 'no');
  assert.equal(shouldShowOnboarding(), false);
});

test('reset schedules the tour for the next launch without opening it immediately', () => {
  markOnboardingSeen();
  let requests = 0;
  window.addEventListener('nvmd:show-onboarding', () => requests++);
  assert.equal(resetOnboarding(), true);
  assert.equal(requests, 0);
  assert.equal(shouldShowOnboarding(), true);
});

test('storage failures do not block dismissal and report a failed reset', () => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('Storage unavailable');
    },
  });
  let requests = 0;
  window.addEventListener('nvmd:show-onboarding', () => requests++);
  assert.equal(shouldShowOnboarding(), false);
  assert.doesNotThrow(markOnboardingSeen);
  assert.equal(resetOnboarding(), false);
  assert.equal(requests, 0);
});
