<div align="center">
  <img src="https://github.com/1111mp/nvm-desktop/assets/31227919/67132758-8aa9-4b05-b987-18fdd5980936"/>
</div>

# Node Version Manager Desktop

`nvm-desktop` is a desktop application that helps you manage multiple Node.js versions through a visual interface. The application is built using [Tauri](https://v2.tauri.app/) and supports `macOS`, `Windows`, and `Linux` systems. It allows you to easily and quickly install, manage, and switch between different Node.js versions without relying on any OS-specific features or shells.

The program also supports independently setting and switching Node.js versions between different projects. Each version's environment is isolated, meaning global dependencies installed via npm under one version will not be available when switched to another version. To share these global dependencies, you can use the `npm config set prefix "/path/to/folder"` command to install global packages in a specified directory. When switching Node.js versions, all versions will have access to the packages in that path.

The smart detection of the appropriate Node engine version is powered by [nvmd-command](https://github.com/1111mp/nvmd-command), which is a native executable written in Rust with no external dependencies.

English | [简体中文](https://github.com/1111mp/nvm-desktop/blob/tauri/README-zh_CN.md)

## Table of Contents

- [Screenshot](#screenshot)
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

## Screenshot

<img width="1029" alt="Screenshot 2024-10-05 at 10 09 27" src="https://github.com/user-attachments/assets/1103871f-5e47-4f96-b71c-3805fdfd694f">

<img width="1030" alt="Screenshot 2024-10-05 at 10 08 31" src="https://github.com/user-attachments/assets/d8005347-a671-4c25-a776-658b258fe06e">

<details>
	<summary><h2 style="display:inline-block;">Maybe somethings you need to know</h2></summary>

All the files related to `nvm-desktop` are located in the `"$HOME/.nvmd/"` directory:

- `"bin/"`(floder) **All the shims of the Node.js are stored**. The path `"$HOME/.nvmd/bin` needs to be added to the environment variable of the system.

|   macOS    |           Windows           |
| :--------: | :-------------------------: |
|   `nvmd`   |         `nvmd.exe`          |
|   `node`   |         `node.exe`          |
|   `npm`    |      `npm.exe npm.cmd`      |
|   `npx`    |      `npx.exe npx.cmd`      |
| `corepack` | `corepack.exe corepack.cmd` |

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
    }
  ]
  ```
  </details>

## Command tools intro

`nvmd` allows you to manage Node.js versions via the command line. Note: `nvmd` does not provide download and installation features. To download and install, please use the `nvm-desktop` client.

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
nvmd (4.1.0)
command tools for nvm-desktop

Usage: nvmd [COMMAND]

Commands:
  current    Get the currently used version
  install    Install the specified version of Node.js
  list       List the all installed versions of Node.js
  ls         List the all installed versions of Node.js
  uninstall  Uninstall the specified version of Node.js
  use        Use the installed version of Node.js (default is global)
  which      Get the path to the executable to where Node.js was installed
  help       Print this message or the help of the given subcommand(s)

Options:
  -h, --help     Print help
  -V, --version  Print version
```

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

- First, you should have a Rust runtime installed locally. Please read the official guide: [Rust Get Started](https://www.rust-lang.org/learn/get-started)
- Then, make sure your computer has [Node.js](https://nodejs.org/) installed

### Development

Clone the project code to your local machine, navigate to the project’s root directory, and then run the following commands in the terminal:

- `pnpm check`: Download the `nvmd` file to the `./src-tauri/resources/` directory.
- `pnpm install`: Install the project dependencies.

There are two ways to start the development server:

- run `pnpm dev`
- `F5` one-button start (VSCode Debug Mode)

### Build and Package

- Go to the `./` folder
- Run `pnpm build`

If everything goes well, the packaged files will be in the `./src-tauri/target/release/bundle` folder.

## Managing your project

Now, you can select a different Node.js version for each project individually, without any additional dependencies or complex configurations. This feature is powered by nvmd-command, helping you maintain consistency and simplicity in your Node.js environment across multiple projects.

With this feature, you can:

- Choose a separate Node.js version for each project.
- Automatically detect the `.nvmdrc` file in the project’s root directory to determine the appropriate Node version.
- No need for manual configuration or additional tools, as `nvmd` will automatically recognize and switch to the required version.

<img width="1636" alt="Screenshot 2025-01-01 at 10 25 22" src="https://github.com/user-attachments/assets/0638279b-86d2-4498-a299-c670fc4e963a" />

For more details, please check the [nvmd-command](https://github.com/1111mp/nvmd-command) project.

## Features

- [x] Supports setting the Node engine version separately for the project.
- [x] Command tools for manage the version of Node.
- [x] Support English & Simplified Chinese
- [x] Support for custom download mirrors (default is https://nodejs.org/dist)
- [x] Support automatic update.
