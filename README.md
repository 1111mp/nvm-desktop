<div align="center">
  <img src="https://github.com/1111mp/nvm-desktop/assets/31227919/67132758-8aa9-4b05-b987-18fdd5980936"/>
</div>

# Node Version Manager Desktop

`nvm-desktop` is a desktop application that manages multiple Node versions in a visual interface. It is built with [Tauri](https://v2.tauri.app/) (supports `macOS`, `Windows` and `Linux` platform). With this application, you can quickly install, manage and use different versions of Node.

**Now you can set the Node.js version for your project individually**.

The ability to intelligently identify the correct Node.js version is powered by [nvmd-command](https://github.com/1111mp/nvmd-command). It’s a single, fast native executable, with no external dependencies, build with Rust.

English | [简体中文](https://github.com/1111mp/nvm-desktop/blob/main/README-zh_CN.md)

## Table of Contents

- [Screenshot](#screenshot)
- [Maybe somethings you need to know](#maybe-somethings-you-need-to-know)
- [Command tools intro](#command-tools-intro)
- [Install](#install)
  - [Download](#download)
- [Uninstall](#uninstall)
  - [macOS Uninstall](#macos-uninstall)
  - [Windows Uninstall](#windows-uninstall)
- [Develop and Build](#develop-and-build)
  - [Development](#development)
  - [Build and Package](#build-and-package)
- [Managing your project](#managing-your-project)
- [Features](#features)
- [MacOS issues](#macos-issues)

## Screenshot

<img width="1029" alt="Screenshot 2024-10-05 at 10 09 27" src="https://github.com/user-attachments/assets/1103871f-5e47-4f96-b71c-3805fdfd694f">

<img width="1030" alt="Screenshot 2024-10-05 at 10 08 31" src="https://github.com/user-attachments/assets/d8005347-a671-4c25-a776-658b258fe06e">

## Maybe somethings you need to know

All the files related to `nvm-desktop` are located in the `"$HOME/.nvmd/"` directory:

- `"bin/"`(floder) **All the shims of the Node.js are stored**. The path `"$HOME/.nvmd/bin` needs to be added to the environment variable of the system.

  | macOS        | Windows                      |
  | :---:        | :---:                        |
  | `nvmd`       | `nvmd.exe`                   |
  | `node`       | `node.exe`                   |
  | `npm`        | `npm.exe npm.cmd`            |
  | `npx`        | `npx.exe npx.cmd`            |
  | `corepack`   | `corepack.exe corepack.cmd`  |

- `"versions/"`(floder) **It stores all downloaded Node.js version files, and the floder is usually named with the Node.js version number**. For example: `"$HOME/.nvmd/versions/21.2.0/"`.
- `"default"`(file) **The file contains the version number of the node that is set globally**, for example: `21.2.0`.
- `"migration"`(file) Every time `nvm-desktop` is upgraded, it will control the execution of script code based on this file.
- `"setting.json"`(file) **It stores information about the nvm-desktop settings center**, such as `Theme, Language, Mirror Url`, etc.
  ```json
  {
    "locale": "en",
    "theme": "system",
    "closer": "minimize",
    "directory": "/Users/********/.nvmd/versions",
    "mirror": "https://nodejs.org/dist"
  }
  ```
- `"projects.json"`(file) **Saves all added projects**.
  ```json
  [
    {
      "name": "nvm-desktop",
      "path": "/Users/********/Documents/Electron/nvm-desktop",
      "version": "20.6.1",
      "active": true,
      "createAt": "2023-11-25T04:07:43.012Z",
      "updateAt": "2023-11-25T04:07:44.931Z"
    },
    {
      "name": "electron_client",
      "path": "/Users/********/Documents/projects/electron_client",
      "version": "20.6.1",
      "active": true,
      "createAt": "2023-11-25T04:07:35.172Z",
      "updateAt": "2023-11-25T04:07:37.234Z"
    }
  ]
  ```
- `"packages.json"`(file) **Information about the installation of the `npm` global package is saved**. For more information, please check [how-does-it-work](https://github.com/1111mp/nvmd-command#how-does-it-work).
- `"versions.json"`(file) Cache details of all Node.js versions requested from `"https://nodejs.org/dist"`(default).
  ```json
  [
    {
      "version": "v21.2.0",
      "date": "2023-11-14",
      "files": [
        "aix-ppc64",
        "headers",
        "linux-arm64",
        "linux-armv7l",
        "linux-ppc64le",
        "linux-s390x",
        "linux-x64",
        "osx-arm64-tar",
        "osx-x64-pkg",
        "osx-x64-tar",
        "src",
        "win-arm64-7z",
        "win-arm64-zip",
        "win-x64-7z",
        "win-x64-exe",
        "win-x64-msi",
        "win-x64-zip",
        "win-x86-7z",
        "win-x86-exe",
        "win-x86-msi",
        "win-x86-zip"
      ],
      "npm": "10.2.3",
      "v8": "11.8.172.17",
      "uv": "1.46.0",
      "zlib": "1.2.13.1-motley",
      "openssl": "3.0.12+quic",
      "modules": "120",
      "lts": false,
      "security": false
    },
  ]
  ```

## Command tools intro

You can also manage all versions of Node.js directly from the command line. The `nvmd` does not provide the Node.js download and installation functions. If you need to download and install a new version of Node.js, you should open the `nvm-desktop` application.

`nvmd` allows you to quickly manage different versions of Node.js via the command line.

```shell
$ nvmd use 18.17.1
Now using Node.js v18.17.1
$ Node.js -v
v18.17.1
$ nvmd use v20.5.1 --project
Now using Node.js v20.5.1
$ Node.js -v
v20.5.1
$ nvmd ls
v20.6.1
v20.5.1 (currently)
v18.17.1
$ nvmd current
v20.5.1
```

`nvmd --help`:

```shell
$ nvmd --help
nvmd (2.2.0)
command tools for nvm-desktop

Usage: nvmd [COMMAND]

Commands:
  current  Get the currently used version
  list     List the all installed versions of Node.js
  ls       List the all installed versions of Node.js
  use      Use the installed version of Node.js (default is global)
  which    Get the path to the executable to where Node.js was installed
  help     Print this message or the help of the given subcommand(s)

Options:
  -h, --help     Print help
  -V, --version  Print version

Please download new version of Node.js in nvm-desktop.
```

After you switch the Node version through the `nvmd use` command line, please click the refresh button to let `nvm-desktop` synchronize the latest data.

For more details, please check document: [command-tools-intro](https://github.com/1111mp/nvmd-command#command-tools-intro) .

## Install

### Download

You can download the source code and build it yourself, or download the built version from following links:

- [nvmd-desktop Download Page (GitHub release)](https://github.com/1111mp/nvm-desktop/releases)

The automatic check for updates feature of the application has supported all platforms since version `v4.0.0`.

## Uninstall

### macOS Uninstall

- Uninstall `nvm-desktop` application
- `rm -rf ~/.nvmd`
- Remove the two lines about `nvmd` from the `shell` configuration file:

  ```shell
  export NVMD_DIR="$HOME/.nvmd"
  export PATH="$NVMD_DIR/bin:$PATH"
  ```

  The default file might be:

  - .zshrc
  - .bashrc
  - .bash_profile
  - .profile

### Windows Uninstall

- Uninstall `nvm-desktop` application
- Remove `%HOMEPATH%\.nvmd` folder
- Remove environment variables from your system: `%HOMEPATH%\.nvmd\bin` (will be automatically removed when uninstalling from `v4.0.0`)

## Develop and Build

`nvm-desktop` relies on `nvmd-command` to provide intelligent identification of the correct Node engine service, so you need to build an executable file locally. How to build the executable for `nvm-desktop` please check this document: [build-nvmd-command](https://github.com/1111mp/nvmd-command#build-nvmd-command).

- First, Build an executable for `nvm-desktop`.
- Copy the executable to this directory of nvm-desktop:
  - macOS `"./assets/sources/nvmd"`
  - Windows `"./assets/sources/{arch}.exe"`, example: `"./assets/sources/x64.exe"` & `"./assets/sources/arm64.exe"`
- On Windows platform, you also need to add an additional script file named `temp.cmd` in the `./assets/sources/temp.cmd` directory. The content of the `temp.cmd` file is:

```shell
@echo off
"%~dpn0.exe" %*
```

Then you can start running and building `nvm-desktop` locally.

Since version `v4.0.0`, we have migrated to `tauri`, so the above operation is no longer necessary. You can directly run the `pnpm check` command.

### Development

- First, you should have a Rust runtime installed locally. Please read the official guide: [rust get started](https://www.rust-lang.org/learn/get-started)
- Then, make sure your computer has [Node.js](https://nodejs.org/) installed
- Change to the `"./"` folder, run `pnpm install` to install dependented libraries

There are two ways to start the development server:

- run `pnpm dev`
- `F5` one-button start (debug mode)

### Build and Package

- Go to the ./ folder
- Run `pnpm build`, if everything goes well, the packaged files will be in the `./src-tauri/target/release/bundle` folder.

## Managing your project

Now you can choose different Node versions individually for your projects and no need for any other dependencies and extra work.

This feature is enabled by `nvmd-command` support.

For more details, please check the [nvmd-command](https://github.com/1111mp/nvmd-command) project.

<img width="1660" alt="image" src="https://github.com/1111mp/nvm-desktop/assets/31227919/ac8653c4-5b40-447f-b10c-557907d101df">

A file will be added to the root of the project: `.nvmdrc`, the content is the version number of Node you choose. `nvm-desktop` detects this file to identify the Node version for your project.

## Features

- [x] Supports setting the Node engine version separately for the project.
- [x] Command tools for manage the version of Node.
- [x] Support English & Simplified Chinese
- [x] Support for custom download mirrors (default is https://nodejs.org/dist)
- [x] Support automatic update.

### MacOS issues

> "File/App is damaged and cannot be opened. You should move it to Trash."

- Cause of the problem: Since the app is not signed, it may show that the developer cannot be verified or the app is damaged, and the developer needs to be granted Apple Developer Program membership.
- Solution: Click the `Cancel` button, then go to the `System Preferences -> Security & Privacy` page, click the `Open Anyway` button, and then click the `Open` button in the pop-up window. If your system version is higher, you may not find the above options in the `Security & Privacy` page, or it may prompt that the file is damaged when you start it. Open the terminal and execute the following command to authorize.
	```shell
	sudo xattr -d com.apple.quarantine /Applications/NVM Desktop.app
	```

> Apple can’t check app for malicious software

- Solution: See the [macOS User Guide](https://support.apple.com/guide/mac-help/apple-cant-check-app-for-malicious-software-mchleab3a043/mac) for details and select the document corresponding to your Mac version.
