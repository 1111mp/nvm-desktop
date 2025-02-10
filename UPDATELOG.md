## v4.0.7

### Features

- replace some icons
- upgrade to tailwindcss v4

### Bug Fixes

- avoid repeated updates [#155](https://github.com/1111mp/nvm-desktop/issues/155)
- the tooltip text color setting is incorrect [#157](https://github.com/1111mp/nvm-desktop/issues/157)
- the multi-select component has no scrollbar [#160](https://github.com/1111mp/nvm-desktop/issues/160)

---

## v4.0.6

### Features

- upgrading to react 19

### Bug Fixes

- set the theme in advance at startup to prevent flickering
- correct usage of `tauri-plugin-window-state` [#147](https://github.com/1111mp/nvm-desktop/issues/147)
- delegate `Ctrl+C` handling for shims [#156](https://github.com/1111mp/nvm-desktop/issues/156)
- handle file read instead of silently exiting [#14](https://github.com/1111mp/nvmd-command/issues/14)

---

## v4.0.5

### Bug Fixes

- clicking on the version link will open two duplicate browser windows
- the application does not exit directly as expected
- table drag sorting fails

---

## v4.0.4

### Features

- enhance the `Open With VSCode` feature
- use `tauri-plugin-window-state`

### Bug Fixes

- the migrate script will block application startup
- filter the logs inside tauri to reduce the amount of logs

---

## v4.0.3

### Features

- versions released in the past three days are marked with dots
- open the project using vscode [#135](https://github.com/1111mp/nvm-desktop/issues/135)

### Bug Fixes

- the interface cannot be interacted with [#124](https://github.com/1111mp/nvm-desktop/issues/124)
- can't add shortcuts on linux [#137](https://github.com/1111mp/nvm-desktop/issues/137)
- chmod nvmd binary [#138](https://github.com/1111mp/nvm-desktop/issues/138)
- removing a project fails when the .nvmdrc file does not exist under the project [#136](https://github.com/1111mp/nvm-desktop/issues/136)

---

## v4.0.2

### Features

- add a checkbox in the download pop-up box to "set as the default version" [#128](https://github.com/1111mp/nvm-desktop/issues/128)
- redesign the error-boundary component to show more information

### Bug Fixes

- disable right-click context menu
- `font-family` adapted to different platforms
- `nvmd use {version} --project` throws an error when `".nvmd/projects.json"` does not exist [#130](https://github.com/1111mp/nvm-desktop/issues/130)
- give more friendly error messages [#128](https://github.com/1111mp/nvm-desktop/issues/128)

---

## v4.0.1

### Features

- added open developer tools menu item

### Bug Fixes

- the version status is incorrect [#121](https://github.com/1111mp/nvm-desktop/issues/121)
- the "check for updates" button is not aligned [#122](https://github.com/1111mp/nvm-desktop/issues/122)
- the arch option was not passed [#123](https://github.com/1111mp/nvm-desktop/pull/123)
- content security policy configuraion [#124](https://github.com/1111mp/nvm-desktop/issues/124)

---

## v4.0.0

### Features

- Refactoring with [Tauri](https://v2.tauri.app/)
