<div align="center">
  <img src="https://github.com/1111mp/nvm-desktop/assets/31227919/67132758-8aa9-4b05-b987-18fdd5980936"/>
</div>

# Node Version Manager Desktop

`nvm-desktop` 是一个以可视化界面操作方式管理多个 Node 版本的桌面应用，使用 Electron 构建（支持 Macos 和 Windows 系统）。通过该应用，您可以快速安装和使用不同版本的 Node。

完美支持为不同的项目单独设置和切换 Node 版本，不依赖操作系统的任何特定功能和 shell。

智能（快速）识别正确 Node 引擎版本的功能由另一个项目：[nvmd-command](https://github.com/1111mp/nvmd-command) 提供支持，它是一个单一、快速的本机可执行文件，没有外部依赖项，使用 Rust 构建。

[English](https://github.com/1111mp/nvm-desktop/blob/main/README.md) | 简体中文

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
  - [自动化测试](#自动化测试)
- [管理您的项目](#管理您的项目)
- [功能](#功能)
- [MacOS 启动应用的问题: "File/App is damaged and cannot be opened. You should move it to Trash."](#MacOS启动应用的问题)

## 截图

<img width="1060" alt="image" src="https://github.com/1111mp/nvm-desktop/assets/31227919/45f4c613-2d17-4804-bc83-ac07260bc6c0">
<img width="1048" alt="image" src="https://github.com/1111mp/nvm-desktop/assets/31227919/757525bc-489d-4611-b957-c780fa9bfab5">

## 命令行工具

您可以直接在终端中输入命令行管理所有 Node 版本。 `nvmd` 不提供 Node 的下载安装功能，如果您需要下载安装新版本的 Node，请打开 `nvm-desktop` 客户端。

`nvmd` 允许您通过命令行快速管理不同版本的 Node：

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

在你通过`nvmd use` 命令行切换Node版本之后，请点击刷新按钮让`nvm-desktop`同步最新的数据。

更多详情请查看此文档: [command-tools-intro](https://github.com/1111mp/nvmd-command#command-tools-intro) .

## 安装

### 下载

您可以下载源代码并自行构建，或者从以下链接下载最新构建的版本：

- [nvmd-desktop 下载页面 (GitHub release)](https://github.com/1111mp/nvm-desktop/releases)

应用程序的自动检查更新功能目前仅支持 Windows 平台。如果您是 Macos 用户，请务必检查[最新版本](https://github.com/1111mp/nvm-desktop/releases)以获得最佳体验。

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
- 移除系统环境变量：`%HOMEPATH%\.nvmd\bin`

## 开发和构建

`nvm-desktop` 依赖 `nvmd-command` 提供智能识别正确 Node 引擎版本的功能，所以你需要在本地提前为 `nvm-desktop` 构建一个可执行文件。关于如何构建 `nvmd-command` 的可执行文件，请查看此文档： [build-nvmd-command](https://github.com/1111mp/nvmd-command#build-nvmd-command).

- 首先提前为 `nvm-desktop` 构建一个可执行文件
- 将这个可执行文件复制到 `nvm-desktop` 的指定目录下：`./assets/sources/nvmd` (`./assets/sources/nvmd.exe` 在 Windows 上).
- 在 Windows 平台，你还需要添加一个名为 `temp.cmd` 的文件到指定目录： `./assets/sources/temp.cmd`， `temp.cmd` 文件的内容为:

```shell
@echo off
"%~dpn0.exe" %*
```

然后你就可以开始在本地运行和构建 `nvm-desktop` 了。

### 开发

- 确保你本地已经安装过 [Node.js](https://nodejs.org/) 了
- 去到项目的根目录，然后在终端运行：`npm install` 或者 `yarn install` 命令为项目安装依赖

有两种方式启动开发服务器：

- 使用 `npm run start` 或者 `yarn start` 命令
- `F5` 按键一键启动（Debug 模式）

### 构建生产包

- 项目使用的是 [electron-builder](https://www.electron.build/index.html) 构建生产包
- 去到项目根目录
- 执行 `npm run package` 或者 `yarn run package` 命令， 如果一切工作都正常运行的话，你可以在 `./release/build` 目录下找到构建好的包文件

> 请检查 `.yarnrc` 文件， 将其更改为适合你所在区域的镜像地址

### 自动化测试

1. 首先，您应该通过 `npm run package:test` 或 `yarn package:test` 命令构建二进制启动文件以进行测试
2. 然后执行 `npm run test` 或者 `yarn test` 命令开始自动化测试

项目使用的自动化测试的库： [WebdriverIO](https://webdriver.io/)

关于 Electron 中的自动化测试文档请查看：[wdio-electron-service](https://webdriver.io/docs/desktop-testing/electron)

## 管理您的项目

现在，您可以为您的项目单独选择不同的 Node 版本，无需任何其他依赖项和额外工作。

此功能依赖 `nvmd-command` 的底层支持。

更多详情，请查看：[nvmd-command](https://github.com/1111mp/nvmd-command) 项目代码。

<img width="1660" alt="image" src="https://github.com/1111mp/nvm-desktop/assets/31227919/ac8653c4-5b40-447f-b10c-557907d101df">

在你项目的根目录下会添加一个文件：`.nvmdrc`，文件的内容为你在 `nvm-desktop` 界面中为该项目选择的 Node 引擎的版本号。`nvm-desktop` 检测此文件以识别你项目的 Node 版本。

## 功能

- [x] 支持为系统全局和项目单独设置Node引擎版本
- [x] 管理Node的命令行工具
- [x] 支持英文和简体中文
- [x] 支持自定义下载镜像地址 (默认是 https://nodejs.org/dist)
- [x] Windows 平台支持自动检查更新
- [x] 完整的自动化测试

### MacOS启动应用的问题

由于没有Apple开发者帐户，因此无法在macOS平台上使用自动更新。 请始终检查[最新版本](https://github.com/1111mp/nvm-desktop/releases)以获得最佳体验。

> "File/App is damaged and cannot be opened. You should move it to Trash."

> “文件/应用程序已损坏，无法打开。您应该将其移至废纸篓。”

可查看这篇文章解决：[Fix 'File/App is damaged and cannot be opened' on Mac](https://iboysoft.com/news/app-is-damaged-and-cannot-be-opened.html#:~:text=If%20you%27re%20certain%20the%20file%20or%20app%20is,and%20selecting%20Open%20twice.%204%20Restart%20your%20Mac.)

这是一个 Mac 错误，可能会发生在各种 Macos 版本上，例如 Macos Ventura/Monterey/Big Sur/Catalina，尤其是在 M1 Mac 上。 它通常发生在从网络下载的应用程序或文件上，但在打开从 App Store 下载的应用程序时也可能发生。

要修复 Ventura 或其他 macOS 版本上的“文件/应用程序已损坏且无法打开”，您需要决定是否要保留有问题的文件或应用程序。

如果您在 macOS Ventura 上遇到“应用程序已损坏且无法打开”的情况，请执行以下步骤来修复它：

1. 打开苹果菜单 > 系统设置
2. 选择隐私和安全 > 开发者工具
3. 单击 (+) 按钮并导航到损坏的应用程序所在的文件夹
   ![WeChat68ceaf51af50a705d1cf9536d07cd2d3](https://github.com/1111mp/nvm-desktop/assets/31227919/612caeda-0ef8-4454-a742-4bb37220b975)
4. 选择该应用程序并单击“打开”。

如果您在 Big Sur/Monterey/Catalina 上打开应用程序时遇到“应用程序已损坏且无法打开”的情况，请尝试以下步骤：

1. 打开苹果菜单 > 系统偏好设置
2. 选择安全和隐私
3. 点击黄色锁并输入密码以解锁首选项窗格
4. 单击“仍然打开”
   ![image](https://github.com/1111mp/nvm-desktop/assets/31227919/41ee3a65-bf34-437d-beea-03900704147b)

#### 暂时禁用防火墙

由于“应用程序/文件已损坏且无法打开”错误是由Mac的安全措施发送的，您可以暂时关闭Gatekeeper来修复它。 但建议在使用该软件后重新启用它来保护您的 Mac。

以下是在 Mac 上打开损坏的应用程序的方法：

1. 从应用程序文件夹启动终端
2. 将以下命令复制并粘贴到终端中，然后按 Enter 键
   ```
   sudo spctl –master-disable
   ```
3. 输入您的管理员密码并按 Enter 键（密码不会出现在屏幕上）
4. 输入以下命令并按 Enter 键，检查 Gatekeeper 的状态

```
spctl --status
```

5. 打开损坏的应用程序

如果您想再次启用 Gatekeeper，可以重复上述过程，但将步骤 2 中的命令替换为 `sudo spctl –master-enable`。

#### 删除损坏的文件或应用程序的扩展属性

在 M1 或 Intel Mac 上修复“应用程序/文件已损坏且无法打开”的另一种方法是删除签署到您打开问题的文件或应用程序的隔离属性。

1. 从应用程序文件夹中打开终端
2. 输入以下命令并按 Enter 键

```
xattr -d com.apple.quarantine file_path
```

要执行此命令，请首先将 `xattr -d com.apple.quarantine` 复制并粘贴到终端，然后将文件或应用程序拖放到终端并按 Enter 键。
![WeChatae77aab16d6d535b0b106128de0736f3](https://github.com/1111mp/nvm-desktop/assets/31227919/b9f804ca-1c8e-4bb2-9f6f-f43810c9ab70)
