<div align="center">
  <img src="https://github.com/1111mp/nvm-desktop/assets/31227919/67132758-8aa9-4b05-b987-18fdd5980936" alt="nvm-desktop" />
</div>

# nvm-desktop

A cross-platform Node.js version manager with both:

- **GUI app** (`nvm-desktop`) for visual management
- **CLI tool** (`nvmd`) for terminal workflows

Supports `macOS`, `Windows`, and `Linux`.

English | [简体中文](./README-zh_CN.md)

## Why use it

- Install and uninstall Node.js versions quickly
- Switch global Node.js version with one command/click
- Pin Node.js versions per project
- Keep environments isolated across Node.js versions
- Use GUI or CLI based on your workflow

## Install

Download from releases:

- [GitHub Releases](https://github.com/1111mp/nvm-desktop/releases)

After installation, ensure these are available in terminal:

```shell
nvmd -V
node -v
npm -v
```

## Core usage (CLI-first)

### 1) Install a Node.js version

```shell
nvmd install 20.18.0
```

### 2) List installed versions

```shell
nvmd ls
```

### 3) Switch global version

```shell
nvmd use 20.18.0
node -v
```

### 4) Set version for current project

```shell
nvmd use 18.20.4 --project
node -v
```

### 5) Check current version

```shell
nvmd current
```

### 6) Uninstall a version

```shell
nvmd uninstall 16.20.2
```

### 7) Find executable path

```shell
nvmd which node
nvmd which npm
```

## Recommended project workflow

For each project:

1. Open project root
2. Choose Node.js version with `nvmd use <version> --project`
3. Run `node -v` to confirm
4. Install dependencies and develop as usual

This helps keep dependency/toolchain behavior consistent per repo.

## GUI usage

In `nvm-desktop`, you can:

- browse available Node.js versions
- install/uninstall versions
- switch global default version
- bind Node.js versions to projects
- manage settings such as mirror and language

If you prefer clicking over commands, most common operations are available in GUI.

## Data location

`nvm-desktop` stores data in:

- macOS / Linux: `~/.nvmd`
- Windows: `%HOMEPATH%\.nvmd`

Typical contents:

- `bin/` shims (`node`, `npm`, `npx`, `nvmd`, `corepack`)
- `versions/` installed Node.js runtimes
- `default` global default version
- `projects.json` per-project version bindings
- `setting.json` app settings

## FAQ

### Are global npm packages shared between Node.js versions?

By default, **no** (environments are isolated).

To share global packages, set a common prefix:

```shell
npm config set prefix "/path/to/shared-global"
```

### GUI or CLI: which one should I use?

- Use **GUI** for discovery and visual management
- Use **CLI (`nvmd`)** for automation, scripts, and terminal-first work

## Develop locally

Prerequisites:

- Rust
- Node.js
- pnpm

Run:

```shell
pnpm check
pnpm install
pnpm dev
```

Build package:

```shell
pnpm build
```

Artifacts:

- `./src-tauri/target/release/bundle`

## License

[MIT](./LICENSE)
