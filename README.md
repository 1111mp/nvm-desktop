<div align="center">
  <img src="https://github.com/1111mp/nvm-desktop/assets/31227919/67132758-8aa9-4b05-b987-18fdd5980936"/>
</div>

# Node Version Manager Desktop

`nvm-desktop` is a desktop application to manage multiple active node.js versions. With this applications, you can quickly install and use different versions of node.

Now you can individually select the version of Node you want for your project (macOS only).

This project was inspired by [nvm](https://github.com/nvm-sh/nvm)

## Table of Contents
- [Screenshot](#screenshot)
- [Install](#install)
  - [Download](#download)
- [Develop and Build](#develop-and-build)
  - [Development](#development)
  - [Build and Package](#build-and-package)
  - [Automated Test](#automated-test)
- [Managing your project (macOS only)](#managing-your-project-macos-only)
- [Todo](#todo)
- [On Windows](#on-windows)
- [MacOS issues: "File/App is damaged and cannot be opened. You should move it to Trash."](#macos-issues)


## Screenshot

<img width="1060" alt="image" src="https://github.com/1111mp/nvm-desktop/assets/31227919/45f4c613-2d17-4804-bc83-ac07260bc6c0">
<img width="1048" alt="image" src="https://github.com/1111mp/nvm-desktop/assets/31227919/757525bc-489d-4611-b957-c780fa9bfab5">

## Install

### Download

You can download the source code and build it yourself, or download the built version from following links:

- [nvmd-desktop Download Page (GitHub release)](https://github.com/1111mp/nvm-desktop/releases)

The automatic update function of the application is currently only supported on the Windows platform. If you are a macOS user please always check the [latest version](https://github.com/1111mp/nvm-desktop/releases) for the best experience.

## Develop and Build

### Development
- Make sure your computer has [Node.js](https://nodejs.org/) installed
- Change to the folder ./, run `npm install` or `yarn install` to install dependented libraries

There are two ways to start the development server:

- run `npm run start` or `yarn start`
- `F5` one-button start (debug mode)

### Build and Package
- It is recommended to use [electron-builder](https://www.electron.build/index.html) for packaging
- Go to the ./ folder
- Run `npm run package` or `yarn run package`,  if everything goes well, the packaged files will be in the ./release/build folder.

> Please check `.yarnrc` file for the correct mirror address of the installation dependencies

### Automated Test

1. First you should build the binary startup files for testing via `npm run package:test` or `yarn package:test`
2. Then run `npm run test` or `yarn test` to start automated testing

Automated testing framework: [WebdriverIO](https://webdriver.io/)

About the Electron Testing can view documents: [wdio-electron-service](https://webdriver.io/docs/desktop-testing/electron)

## Managing your project (macOS only)
You can choose different Node versions individually for your projects.

Reference from [avn](https://github.com/wbyoung/avn).

For more details, please check the [nvmd.sh](https://github.com/1111mp/nvm-desktop/tree/main/assets/nvmd.sh) file.

<img width="1049" alt="image" src="https://github.com/1111mp/nvm-desktop/assets/31227919/fac4946b-2e1d-45e9-a8ee-1d46a02fb51a">

A file will be added to the root of the project: `.nvmdrc`, the content is the version number of Node you choose. `nvm-desktop` detects this file to set the Node version for your project.

If you are using `VS Code` and launch your project with `Debug`, then you should change the `runtimeExecutable` configuration in the `launch.json` file. Like this:
```json
{
  "name": "Electron: Main",
  "type": "node",
  "request": "launch",
  "protocol": "inspector",
  // "runtimeExecutable": "npm",
  "runtimeExecutable": "${env:NVMD_DIR}/versions/18.17.0/bin/npm",
  "runtimeArgs": ["run", "start"],
  "env": {
    "MAIN_ARGS": "--inspect=5858 --remote-debugging-port=9223"
  }
},
```
Directly specify the installation path of Node or NPM.

Because this function is implemented based on `shell` commands, it does not currently support the Windows platform. If you have some good ideas, you are very welcome to leave a message to communicate.

For Windows platform, if you have installed `zsh` or `bash` on your system. Perhaps you can add the following command to your `.zshrc` or `.bashrc` file like macOS platform:
```shell
export NVMD_DIR="$HOME/.nvmd" 
[ -s "$NVMD_DIR/nvmd.sh" ] && . "$NVMD_DIR/nvmd.sh" # This loads nvmd
```
On the Windows platform, the `nvmd.sh` file is also added to this directory `$HOME/.nvmd`. Then open the Projects function of the client: [src/renderer/pages/home/index.tsx](https://github.com/1111mp/nvm-desktop/blob/main/src/renderer/pages/home/index.tsx#L190). Recompile and install.

## Todo
- [x] Support English & Simplified Chinese
- [x] Support for custom download mirrors (default is https://nodejs.org/dist)
- [x] Support automatic update on Windows.
- [ ] Complete automated testing.

### On Windows
After installing and starting the application, an environment variable named `NVMD` will be added to your computer system, default value is `empty`. And it has been added to the environment variable `PATH`.

Set by: `setx -m NVMD empty`.

After you install and apply the specified version of node, the value of the environment variable `NVMD` is set to the installation path of the node version.

Set by: `setx -m NVMD nodePath`.

Don't forget to restart your terminal.

If you encounter problems during use, please check whether the environment variables in the operating system are valid. Of course, your issue is also very welcome.

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



