# 发布 NVM Desktop

发布流程沿用 workrun：推送版本 tag，校验 main 归属及版本号，创建草稿，并行构建全部平台，构建成功后公开 Release，最后更新客户端更新清单。

| 类型   | Tag 示例      | GitHub Release | 客户端更新通道  |
| ------ | ------------- | -------------- | --------------- |
| 正式版 | `v4.5.0`      | 正式发布       | `updater`       |
| RC     | `v4.5.0-rc.1` | Pre-release    | `updater-alpha` |

`updater-alpha` 沿用 workrun 的通道名称，用于版本化 RC。两个通道均包含普通版 `update.json` 和内置 WebView2 版 `update-fixed-webview2.json`；正式版客户端不会接收 RC 更新。

## 发布步骤

1. 同步修改 `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml` 和 `src-tauri/Cargo.lock` 中应用自身的版本。RC 使用完整版本号，例如 `4.5.0-rc.1`。
2. 在根目录 `UPDATELOG.md` 添加对应条目，例如 `## v4.5.0-rc.1`，内容以 `---` 结束。
3. 将变更合入 main，等待项目检查通过，在要发布的 main 提交上打 tag 并推送：

   ```sh
   git switch main
   git pull --ff-only origin main
   git tag v4.5.0-rc.1
   git push origin v4.5.0-rc.1
   ```

4. 检查 `Release Build` 的构建、发布及 updater 任务均成功。

main 的普通 push 不触发发布；tag 指向的提交必须属于远端 main 历史，tag 版本必须与 `package.json` 一致；应用在 Tauri 配置、Cargo.toml 和 Cargo.lock 中的版本也必须一致。固定的 `alpha` tag 和旧的手动 Alpha Build 已由版本化 RC 替代。

构建矩阵保留 Windows x64/ARM64、macOS Intel/Apple Silicon、Linux x64/ARM64/ARMv7，以及 Windows x64/ARM64 内置 WebView2 版本。RC 与正式版使用相同的 nvmd sidecar 来源；RC 的区别是应用版本、预发布标记和 updater 通道。

仓库需配置 `TAURI_SIGNING_PRIVATE_KEY` 和 `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`，并允许 workflow 使用 `GITHUB_TOKEN` 写入 Release 和构建证明。首次发布 RC 时会自动创建 `updater-alpha` Release。

## 失败重试

公开发布前会验证 9 个构建对应的 26 个安装包、更新包及签名资产全部上传完成。任一构建失败时 Release 保持草稿。修复后使用 Actions 的失败任务重试功能。若 Release 已公开、仅 updater 失败，可重试失败任务，或运行 `Updater CI` 并填写准确的版本 tag；它只更新该版本所属通道的清单。

已公开的版本禁止通过重新运行整个 workflow 覆盖安装包。正式发布和手动 updater 修复共用并发锁；旧版本重试不会把更新通道回退到更早的版本。

updater 在 Release 公开后执行，客户端更新入口与 Release 的公开操作不是原子事务。完整成功以整个 workflow 成功为准。

本地验证发布脚本：

```sh
node --test scripts/*.test.mjs
```
