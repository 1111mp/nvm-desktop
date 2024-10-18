## v4.0.2

### Features

- add a checkbox in the download pop-up box to "set as the default version" [#128](https://github.com/1111mp/nvm-desktop/issues/128)
- redesign the error-boundary component to show more information

### Bug Fixes

- disable right-click context menu
- `font-family` adapted to different platforms
- `nvmd use {version} --project` throws an error when `".nvmd/projects.json"` does not exist [#130](https://github.com/1111mp/nvm-desktop/issues/130)
- give more friendly error messages [#128](https://github.com/1111mp/nvm-desktop/issues/128)

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
