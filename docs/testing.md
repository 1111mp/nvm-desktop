# Automated tests

Run `pnpm install --frozen-lockfile` with the Node and pnpm versions used by CI.

## Vitest

The projects follow Workrun's test separation:

| Project   | Files                            | Environment             | Command               |
| --------- | -------------------------------- | ----------------------- | --------------------- |
| unit      | `src/**/*.test.ts`               | Node                    | `pnpm test:unit`      |
| component | `src/**/*.test.tsx`              | jsdom + Testing Library | `pnpm test:component` |
| tauri     | `src/**/*.tauri.test.ts`         | jsdom + Tauri IPC mocks | `pnpm test:tauri`     |
| browser   | `src/**/*.browser.test.{ts,tsx}` | Playwright              | `pnpm test:browser`   |

`pnpm test` runs unit, component, and tauri projects, as does the pull request
frontend workflow. `pnpm test:watch` watches the same projects. Specialized files
are excluded from the generic projects so each test runs once.

Tauri mocks test frontend IPC behavior, not Rust handlers. Each test starts with
empty storage and a mock that rejects unhandled commands. Register the commands
needed by the test using `mockIPC`; cleanup clears mocks and injected startup data.
Testing Library cleanup is registered explicitly because Vitest globals are off.

Before browser tests, run `pnpm exec playwright install webkit` on macOS/Linux or
`pnpm exec playwright install chromium` on Windows. Linux may also need
`pnpm exec playwright install-deps webkit`. These engines approximate Tauri's engine
family; desktop E2E uses the actual native WebView.

## Desktop E2E

```sh
pnpm check
pnpm test:e2e:build
pnpm test:e2e
# Run a selected spec:
pnpm test:e2e --spec test/e2e/smoke.spec.ts
```

The WebdriverIO runner uses the embedded Tauri driver, matching Workrun.
WebdriverIO 10 is used without dependency patches, matching Workrun.
With `@wdio/tauri-service@1.5.1`, smoke tests can pass while the service logs
an initialization error when binding the removed `executeAsync` method. Check
service logs as well as test results when assessing compatibility. The `e2e`
Cargo feature adds the test bridge only to the explicitly built test app. Normal
builds do not include it. The runner launches a copied test executable under
`src-tauri/target/e2e`; macOS uses the complete app bundle for resource lookup.

Each spec gets a fresh temporary NVMD directory printed by the runner. The test
build requires `NVMD_E2E_DATA_DIR` and uses it instead of the user's NVMD directory.
It also uses a separate bundle identifier and Linux single-instance ID. Fixtures
select an ephemeral embedded-server port and skip CLI migration. Smoke tests cover
real Rust settings/project IPC, onboarding dismissal across reload, and screenshots.
The installation-queue spec uses a loopback-only mirror to test concurrent
admission, duplicate rejection, settings protection, cancellation, failure
isolation, retry, and saved-directory checks through real Rust commands. It does
not install a real runtime. Tests do not download Node or change the user's shell
configuration. The smoke spec
clears WebView storage before running so repeated runs start with onboarding.

Failed tests collect screenshots, page source, workspace metadata, and backend /
frontend logs under `test-results/desktop` (retained with `KEEP_TEST_ARTIFACTS=1`).
Temporary workspaces remain available
for inspection. `pnpm type-check:e2e` checks the runner and specs.

The manually triggered **Desktop E2E** GitHub workflow runs browser and native
smoke tests on macOS. Windows and Linux configurations are provided, but should be
validated on those platforms before adding them as required CI jobs. Linux needs
a graphical session (for example, Xvfb) and Tauri's system dependencies.

## Batch Node installation

`pnpm test` covers task event/snapshot ordering, independent task updates, task
visibility after hiding the dialog, and targeted cancellation IPC.
`pnpm test:browser` covers filtered selection, architecture confirmation, task
progress, and light/dark/small-window dialog screenshots.

Run the download pipeline tests with:

```sh
cargo test --manifest-path src-tauri/crates/get-node/Cargo.toml archive::
```

The HTTP integration test starts a loopback-only server and installs two tiny
fixture archives into a temporary directory. It verifies overlapping downloads,
SHA-256 validation, extraction, and final files without downloading Node or
changing the user's runtime installation. Stage tests check the two-download,
one-extraction limits and independent cancellation of waiting tasks.

## Test artifacts

Vitest screenshots and attachments are written only under
`test-results/vitest/<run-id>/`. Each run gets its own directory so concurrent
commands cannot delete each other's diagnostics. Desktop E2E diagnostics use
`test-results/desktop/`.

Test artifacts are automatically removed when the test run finishes, including
failed runs. To retain screenshots and logs for debugging, run:

```sh
KEEP_TEST_ARTIFACTS=1 pnpm test:browser
KEEP_TEST_ARTIFACTS=1 pnpm test:e2e
```

The same option applies when invoking Vitest directly. Source directories do not
receive screenshot output. Reference snapshots, if added later, are separate
from these disposable diagnostics and must not be automatically deleted.
