<div align="center">
  <img src="https://github.com/1111mp/nvm-desktop/assets/31227919/67132758-8aa9-4b05-b987-18fdd5980936"/>
</div>

# Node Version Manager Desktop

`nvm-desktop` is a desktop application to manage multiple active node.js versions. With this applications, you can quickly install and use different versions of node.

Now you can individually select the version of Node you want for your project.

The ability to intelligently identify the correct Node engine is powered by [nvmd-command](https://github.com/1111mp/nvmd-command). It’s a single, fast native executable, with no external dependencies, build with Rust.

English | [简体中文](https://github.com/1111mp/nvm-desktop/blob/main/README-zh_CN.md)

## Table of Contents

- [Screenshot](#screenshot)
- [Command toos intro](#command-toos-intro)
- [Install](#install)
  - [Download](#download)
- [Develop and Build](#develop-and-build)
  - [Development](#development)
  - [Build and Package](#build-and-package)
  - [Automated Test](#automated-test)
- [Managing your project](#managing-your-project)
- [Features](#features)
- [MacOS issues: "File/App is damaged and cannot be opened. You should move it to Trash."](#macos-issues)

## Screenshot

<img width="1060" alt="image" src="https://github.com/1111mp/nvm-desktop/assets/31227919/45f4c613-2d17-4804-bc83-ac07260bc6c0">
<img width="1048" alt="image" src="https://github.com/1111mp/nvm-desktop/assets/31227919/757525bc-489d-4611-b957-c780fa9bfab5">

## Command toos intro

You can also manage all versions of node directly from the command line. The `nvmd` does not provide the node download and installation functions. If you need to download and install a new version of node, you should open the `nvm-desktop` application.

`nvmd` allows you to quickly manage different versions of node via the command line.

```shell
$ nvmd use 18.17.1
Now using node v18.17.1
$ node -v
v18.17.1
$ nvmd use v20.5.1 --project
Now using node v20.5.1
$ node -v
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
The1111mp@outlook.com
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

The automatic update function of the application is currently only supported on the Windows platform. If you are a macOS user please always check the [latest version](https://github.com/1111mp/nvm-desktop/releases) for the best experience.

## Develop and Build

`nvm-desktop` relies on `nvmd-command` to provide intelligent identification of the correct Node engine service, so you need to build an executable file locally. How to build the executable for `nvm-desktop` please check this document: [build-nvmd-command](https://github.com/1111mp/nvmd-command#build-nvmd-command).

- First, Build an executable for `nvm-desktop`.
- Copy the executable to this directory of nvm-desktop: `./assets/sources/nvmd` (`./assets/sources/nvmd.exe` on Windows).
- On Windows platform, you also need to add an additional script file named `temp.cmd` in the `./assets/sources/temp.cmd` directory. The content of the `temp.cmd` file is:

```shell
@echo off
"%~dpn0.exe" %*
```

Then you can start running and building `nvm-desktop` locally.

### Development

- Make sure your computer has [Node.js](https://nodejs.org/) installed
- Change to the folder ./, run `npm install` or `yarn install` to install dependented libraries

There are two ways to start the development server:

- run `npm run start` or `yarn start`
- `F5` one-button start (debug mode)

### Build and Package

- It is recommended to use [electron-builder](https://www.electron.build/index.html) for packaging
- Go to the ./ folder
- Run `npm run package` or `yarn run package`, if everything goes well, the packaged files will be in the ./release/build folder.

> Please check `.yarnrc` file for the correct mirror address of the installation dependencies

### Automated Test

1. First you should build the binary startup files for testing via `npm run package:test` or `yarn package:test`
2. Then run `npm run test` or `yarn test` to start automated testing

Automated testing framework: [WebdriverIO](https://webdriver.io/)

About the Electron Testing can view documents: [wdio-electron-service](https://webdriver.io/docs/desktop-testing/electron)

## Managing your project

Now you can choose different Node versions individually for your projects and no need for any other dependencies and extra work.

This feature is enabled by `nvmd-command` support.

For more details, please check the [nvmd-command](https://github.com/1111mp/nvmd-command) project.

<img width="1660" alt="image" src="https://github.com/1111mp/nvm-desktop/assets/31227919/ac8653c4-5b40-447f-b10c-557907d101df">

A file will be added to the root of the project: `.nvmdrc`, the content is the version number of Node you choose. `nvm-desktop` detects this file to identify the Node version for your project.

If you are using `VS Code` and launch your project with `Debug`, then you should set `outputCapture` to `std` to see more log information in the `launch.json` file:

```json
{
  // ...

  "outputCapture": "std"
},
```

## Features

- [x] Supports setting the Node engine version separately for the project.
- [x] Command tools for manage the version of Node.
- [x] Support English & Simplified Chinese
- [x] Support for custom download mirrors (default is https://nodejs.org/dist)
- [x] Support automatic update on Windows.
- [x] Complete automated testing.

### MacOS issues

Because there is no Apple developer account, automatic updates cannot be used on the macOS platform. Please always check the [latest version](https://github.com/1111mp/nvm-desktop/releases) for the best experience.

> "File/App is damaged and cannot be opened. You should move it to Trash."

[Fix 'File/App is damaged and cannot be opened' on Mac](https://iboysoft.com/news/app-is-damaged-and-cannot-be-opened.html#:~:text=If%20you%27re%20certain%20the%20file%20or%20app%20is,and%20selecting%20Open%20twice.%204%20Restart%20your%20Mac.)

It is a Mac error that can occur to various macOS versions, such as macOS Ventura/Monterey/Big Sur/Catalina, especially on M1 Macs. It usually happens on apps or files downloaded from the web, but it can also arise when opening apps downloaded from App Store.

To fix "File/App is damaged and can't be opened" on Ventura or other macOS versions, you need to decide whether you want to keep the offending file or app.

If you are experiencing "App is damaged and cannot be opened" on macOS Ventura, do the following steps to fix it:

1. Open the Apple menu > System Settings.
2. Select Privacy & Security > Developer Tools.
3. Click the ( + ) button and navigate to the folder where the damaged app resides.
   ![WeChat68ceaf51af50a705d1cf9536d07cd2d3](https://github.com/1111mp/nvm-desktop/assets/31227919/612caeda-0ef8-4454-a742-4bb37220b975)
4. Select the app and click Open.

If you are encountering "Application is damaged and cannot be opened" on Big Sur/Monterey/Catalina when opening an app, try these steps:

1. Open the Apple menu > System Preferences.
2. Select Security & Privacy.
3. Tap the yellow lock and enter your password to unlock the preference pane.
4. Click "Open Anyway."
   ![image](https://github.com/1111mp/nvm-desktop/assets/31227919/41ee3a65-bf34-437d-beea-03900704147b)

#### Temporarily disable Gatekeeper

Since the "App/File is damaged and cannot be opened" error is sent by Mac's security measures, you can temporarily turn off Gatekeeper to fix it. But it's recommended to re-enable it after using the software to protect your Mac.

Here's how to open damaged apps on Mac:

1. Launch Terminal from the Applications folder.
2. Copy and paste the following command into Terminal and hit Enter.
   ```
   sudo spctl –master-disable
   ```
3. Enter your admin password and hit Enter. (The password won't appear on the screen.)
4. Check the status of Gatekeeper by typing in the following command and pressing Enter.

```
spctl --status
```

5. Open the damaged app.

If you want to enable Gatekeeper again, you can repeat the above process but replace the command in step 2 with `sudo spctl –master-enable`.

#### Remove the extended attributes of the damaged file or app

Another way to fix "App/File is damaged and cannot be opened" on M1 or Intel Mac is to remove the quarantine attributes signed to the file or app you are having issue opening.

1. Open Terminal from the Applications folder.
2. Type in the following command and hit Enter.

```
xattr -d com.apple.quarantine file_path
```

To execute this command, first copy and paste `xattr -d com.apple.quarantine ` to Terminal, then drag and drop the file or app to Terminal and hit Enter.
![WeChatae77aab16d6d535b0b106128de0736f3](https://github.com/1111mp/nvm-desktop/assets/31227919/b9f804ca-1c8e-4bb2-9f6f-f43810c9ab70)
