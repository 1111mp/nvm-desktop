<div align="center">
  <img src="https://github.com/1111mp/nvm-desktop/assets/31227919/67132758-8aa9-4b05-b987-18fdd5980936"/>
</div>

# Node Version Manager Desktop

`nvm-desktop` 是一个桌面应用程序，通过可视化界面帮助你管理多个 Node.js 版本。应用程序使用 [Tauri](https://v2.tauri.app/) 构建，支持 `macOS`、`Windows` 以及 `Linux` 系统。可以轻松快速地安装、管理并切换不同的 Node.js 版本，而无需依赖操作系统的任何特定功能和 shell。

程序还支持在不同项目间独立设置和切换 Node.js 版本。每个版本间的环境是相互隔离的，这意味着在一个版本下通过 npm 安装的全局依赖，在切换到另一个版本后将不可用。如需共享这些全局依赖，可以使用 `npm config set prefix "/path/to/folder"` 命令，将全局包安装到指定目录。在切换 Node.js 版本时，所有版本都可以使用该路径下的包。

智能识别合适的 Node 引擎版本的功能由 [nvmd-command](https://github.com/1111mp/nvmd-command) 提供支持，这是一个用 Rust 编写的、无外部依赖的本机可执行文件。

[English](https://github.com/1111mp/nvm-desktop/blob/tauri/README.md) | 简体中文

## 目录

- [截图](#截图)
- [命令行工具](#命令行工具)
- [安装](#安装)
  - [下载](#下载)
- [卸载](#卸载)
  - [macOS 卸载](#macOS-卸载)
  - [Windows 卸载](#Windows-卸载)
- [开发和构建](#开发和构建)
  - [开发](#开发)
  - [构建生产包](#构建生产包)
- [管理您的项目](#管理您的项目)
- [功能](#功能)

## 截图

<img width="1029" alt="Screenshot 2024-10-05 at 10 09 27" src="https://github.com/user-attachments/assets/1103871f-5e47-4f96-b71c-3805fdfd694f">

<img width="1030" alt="Screenshot 2024-10-05 at 10 08 31" src="https://github.com/user-attachments/assets/d8005347-a671-4c25-a776-658b258fe06e">

<details>
	<summary><h2 style="display:inline-block;">一些或许你需要知道的事情</h2></summary>

所有与`nvm-desktop`相关的文件都保存在`"$HOME/.nvmd/"`目录下：

- `"bin/"`(目录) **保存着所有 Node.js 可执行文件的垫片**。 目录 `"$HOME/.nvmd/bin` 需要添加到系统的环境变量里面。

  |   macOS    |           Windows           |
  | :--------: | :-------------------------: |
  |   `nvmd`   |         `nvmd.exe`          |
  |   `node`   |         `node.exe`          |
  |   `npm`    |      `npm.exe npm.cmd`      |
  |   `npx`    |      `npx.exe npx.cmd`      |
  | `corepack` | `corepack.exe corepack.cmd` |

- `"versions/"`(目录) **保存着所有下载的 Node.js 版本的文件，文件名一般以 Node.js 的版本号为**。 例如： `"$HOME/.nvmd/versions/21.2.0"`.
- `"default"`(文件) **文件内容为全局设置 Node.js 版本的版本号**， 例如： `21.2.0`.
- `"migration"`(文件) `nvm-desktop` 每次升级时都会根据这个文件来控制脚本代码的执行。
- `"setting.json"`(文件) **保存着 `nvm-desktop` 设置中心的设置信息**， 比如 `Theme, Language, Mirror Url` 等。
  ```json
  {
    "locale": "en",
    "theme": "system",
    "closer": "minimize",
    "directory": "/Users/********/.nvmd/versions",
    "mirror": "https://nodejs.org/dist"
  }
  ```
- `"projects.json"`(文件) **保存着所有添加过的项目的信息**。
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
- `"packages.json"`(文件) **保存着 npm 全局安装的包的相关的信息**。 更多信息请查看 [how-does-it-work](https://github.com/1111mp/nvmd-command#how-does-it-work).
- `"versions.json"`(文件) 保存着从 `"https://nodejs.org/dist"`（默认） 请求过来的所有的 Node.js 的版本的信息。
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

## 命令行工具

`nvmd` 让你通过命令行管理 Node.js 版本。注意：`nvmd` 不提供下载安装功能，如需下载安装请使用 `nvm-desktop` 客户端。

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

`nvmd --help`：

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

更多详情请查看此文档: [command-tools-intro](https://github.com/1111mp/nvmd-command#command-tools-intro) .

## 安装

### 下载

您可以下载源代码并自行构建，或者从以下链接下载最新构建的版本：

- [nvmd-desktop 下载页面 (GitHub release)](https://github.com/1111mp/nvm-desktop/releases)

## 卸载

### macOS 卸载

- 卸载 `nvm-desktop` 应用程序
- `rm -rf ~/.nvmd`
- 从 `shell` 的配置文件中删除关于 `nvmd` 的两行：

  ```shell
  export NVMD_DIR="$HOME/.nvmd"
  export PATH="$NVMD_DIR/bin:$PATH"
  ```

  默认的文件可能是：
  - .zshrc
  - .bashrc
  - .bash_profile
  - .profile

### Windows 卸载

- 卸载 `nvm-desktop` 应用程序
- 删除 `%HOMEPATH%\.nvmd` 文件
- 移除系统环境变量：`%HOMEPATH%\.nvmd\bin`（从 `v4.0.0` 开始卸载时会自动移除）

## 开发和构建

- 首先，你应该在本地安装 `Rust` 运行环境。请阅读官方指南：[Rust Get Started](https://www.rust-lang.org/learn/get-started)
- 其次，确保你本地已经安装过 [Node.js](https://nodejs.org/) 了

### 开发

将项目代码克隆到本地，去到项目的根目录，然后在终端运行：

- `pnpm check`：下载 `nvmd` 文件到 `./src-tauri/resources/` 目录下
- `pnpm install`：安装项目依赖

有两种方式启动开发服务器：

- 使用 `pnpm dev` 命令
- `F5` 按键一键启动（VSCode Debug 模式）

### 构建生产包

- 去到项目根目录
- 执行 `pnpm build` 命令

如果一切工作都正常运行的话，你可以在 `./src-tauri/target/release/bundle` 目录下找到构建好的包文件

## 管理您的项目

现在，您可以为每个项目单独选择不同的 Node.js 版本，无需任何额外依赖或复杂配置。此功能由 `nvmd-command` 提供底层支持，帮助您在多项目开发中保持 Node.js 环境的一致性和简便性。

通过该功能，您可以：

- 为每个项目选择独立的 Node.js 版本。
- 自动检测项目根目录下的 `.nvmdrc` 文件，以确定适用的 Node 版本。
- 无需手动配置或安装其他工具，`nvmd` 将自动识别并切换到所需版本。

<img width="1636" alt="Screenshot 2025-01-01 at 10 25 22" src="https://github.com/user-attachments/assets/0638279b-86d2-4498-a299-c670fc4e963a" />

更多详情，请查看：[nvmd-command](https://github.com/1111mp/nvmd-command) 项目代码。

## 功能

- [x] 支持为系统全局和项目单独设置 Node 引擎版本
- [x] 管理 Node 的命令行工具
- [x] 支持英文和简体中文
- [x] 支持自定义下载镜像地址 (默认是 https://nodejs.org/dist)
- [x] 自动检查更新
