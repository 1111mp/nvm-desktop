## v4.2.1

### Bug Fixes

- Resource temporarily unavailable (os error 35) [#213](https://github.com/1111mp/nvm-desktop/issues/213)

---

## v4.2.0

### Features

- Allow users to specify custom filename for Node version config (default: .nvmdrc) [#206](https://github.com/1111mp/nvm-desktop/issues/206)
- Allow overriding Node version using `NVMD_NODE_VERSION` environment variable [#11](https://github.com/1111mp/nvmd-command/issues/11)
- Preserve macOS scrollbar behavior and allow window resizing [#199](https://github.com/1111mp/nvm-desktop/issues/199)

### Bug Fixes

- Handle node.js download timeout for slow networks [#165](https://github.com/1111mp/nvm-desktop/issues/165)
- File exists (os error 17) [#200](https://github.com/1111mp/nvm-desktop/issues/200)

---

## v4.1.2

### Bug Fixes

- Avoid app crash by disabling async_zip full feature [#198](https://github.com/1111mp/nvm-desktop/issues/198)

---

## v4.1.1

### Bug Fixes

- Unable to update settings data [#196](https://github.com/1111mp/nvm-desktop/issues/196)

---

## v4.1.0

### Features

- Support Node download and uninstall commands [#184](https://github.com/1111mp/nvm-desktop/issues/184)
- Runs an embedded server to support real-time refresh of data from command line tools to clients

### Bug Fixes

- Refine text [#189](https://github.com/1111mp/nvm-desktop/pull/189)

### Others

- `nvm-desktop`: some performance optimizations
- `nvmd` command line tool: a complete refactoring makes the code cleaner and faster

---

## v4.0.9

### Features

- Enhance the function of `reset-window-state` [#180](https://github.com/1111mp/nvm-desktop/issues/180)

### Bug Fixes

- The loading icon disappears when updating [#177](https://github.com/1111mp/nvm-desktop/issues/177)
- Show and focus the window of the currently running instance when the user attempts to open a new instance [#182](https://github.com/1111mp/nvm-desktop/issues/182)

---

## v4.0.8

### Features

- changing the icon of the MacOS platform application
- hide dock icon when closing window [#132](https://github.com/1111mp/nvm-desktop/issues/132)

### Bug Fixes

- prevent terminal window from popping up on windows platform [#163](https://github.com/1111mp/nvm-desktop/issues/163)
- abnormal position and size when window state is restored [#175](https://github.com/1111mp/nvm-desktop/issues/172)
- add processing for npm's `--workspace` parameter & optimize the performance of `npm link` command
- handling errors in the canonicalize method

---

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
