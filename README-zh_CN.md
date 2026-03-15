<div align="center">
  <img src="https://github.com/1111mp/nvm-desktop/assets/31227919/67132758-8aa9-4b05-b987-18fdd5980936" alt="nvm-desktop" />
</div>

# nvm-desktop

一个跨平台的 Node.js 版本管理工具，包含：

- **图形界面**（`nvm-desktop`）
- **命令行工具**（`nvmd`）

支持 `macOS`、`Windows`、`Linux`。

[English](./README.md) | 简体中文

## 截图

<img width="1029" alt="nvm-desktop 主界面截图" src="https://github.com/user-attachments/assets/1103871f-5e47-4f96-b71c-3805fdfd694f">

<img width="1030" alt="nvm-desktop 项目管理截图" src="https://github.com/user-attachments/assets/d8005347-a671-4c25-a776-658b258fe06e">

## 适合谁用

- 需要快速安装/卸载多个 Node.js 版本
- 需要在不同项目之间切换 Node.js 版本
- 希望同时拥有 GUI 和 CLI 两种工作方式
- 需要把每个版本环境隔离，降低全局依赖冲突

## 安装

从发布页下载：

- [GitHub Releases](https://github.com/1111mp/nvm-desktop/releases)

安装后，先在终端确认命令可用：

```shell
nvmd -V
node -v
npm -v
```

## 核心用法（先看这个）

### 1）安装 Node.js

```shell
nvmd install 20.18.0
```

### 2）查看已安装版本

```shell
nvmd ls
```

### 3）切换全局版本

```shell
nvmd use 20.18.0
node -v
```

### 4）为当前项目指定版本

```shell
nvmd use 18.20.4 --project
node -v
```

### 5）查看当前使用版本

```shell
nvmd current
```

### 6）卸载版本

```shell
nvmd uninstall 16.20.2
```

### 7）查看可执行文件路径

```shell
nvmd which node
nvmd which npm
```

## 推荐项目工作流

每个项目建议这样用：

1. 进入项目根目录
2. 执行 `nvmd use <version> --project`
3. 用 `node -v` 确认版本
4. 再执行安装依赖、启动开发等操作

这样可以保证每个仓库的 Node.js 环境更稳定一致。

## GUI 怎么用

在 `nvm-desktop` 中，你可以：

- 浏览可安装的 Node.js 版本
- 安装/卸载指定版本
- 切换全局默认版本
- 给项目绑定独立 Node.js 版本
- 配置镜像源、语言等设置

如果你更偏好点选操作，大部分常见需求都可以在 GUI 完成。

## 数据存储位置

`nvm-desktop` 默认数据目录：

- macOS / Linux：`~/.nvmd`
- Windows：`%HOMEPATH%\.nvmd`

常见内容：

- `bin/`：`node`、`npm`、`npx`、`nvmd`、`corepack` 等 shim
- `versions/`：已安装 Node.js 运行时
- `default`：全局默认版本
- `projects.json`：项目与版本绑定信息
- `setting.json`：应用设置

## 常见问题

### 不同 Node.js 版本会共享全局 npm 包吗？

默认**不会共享**（版本环境隔离）。

如果你希望共享全局包，可设置统一前缀目录：

```shell
npm config set prefix "/path/to/shared-global"
```

### 我该用 GUI 还是 CLI？

- 想可视化管理，用 **GUI**
- 想脚本化、自动化、终端优先，用 **CLI（`nvmd`）**

## 本地开发

前置依赖：

- Rust
- Node.js
- pnpm

运行：

```shell
pnpm check
pnpm install
pnpm dev
```

构建：

```shell
pnpm build
```

产物目录：

- `./src-tauri/target/release/bundle`

## 许可证

[MIT](./LICENSE)
