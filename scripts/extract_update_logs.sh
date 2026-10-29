#!/usr/bin/env bash
#
# extract_update_logs.sh
# 从 UPDATELOG.md 提取最新版本 (## v...) 的更新内容
# 并输出到屏幕或写入环境变量文件（如 GitHub Actions）

set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd -- "$SCRIPT_DIR/.." && pwd)
UPDATE_LOG="$REPO_ROOT/UPDATELOG.md"
TAG_NAME="${GITHUB_REF_NAME:-}"

if [[ ! -f "$UPDATE_LOG" ]]; then
  echo "❌ 文件不存在: $UPDATE_LOG" >&2
  exit 1
fi

# A release must describe its own tag. Without a tag (for local use), return
# the first entry, matching the fallback behaviour in updatelog.mjs.
if [[ -n "$TAG_NAME" ]]; then
  UPDATE_LOGS=$(awk -v tag="$TAG_NAME" '
    $0 == "## " tag { found=1; next }
    found && /^---[[:space:]]*$/ { exit }
    found { print }
  ' "$UPDATE_LOG")
else
  UPDATE_LOGS=$(awk '
    /^## v[0-9]+\.[0-9]+\.[0-9]+/ { found=1; next }
    found && /^---[[:space:]]*$/ { exit }
    found { print }
  ' "$UPDATE_LOG")
fi

if [[ -z "$UPDATE_LOGS" ]]; then
  echo "⚠️ 未找到更新日志内容"
  exit 0
fi

echo "✅ 提取到的最新版本日志内容如下："
echo "----------------------------------------"
echo "$UPDATE_LOGS"
echo "----------------------------------------"

# 如果在 GitHub Actions 环境中（GITHUB_ENV 已定义）
if [[ -n "${GITHUB_ENV:-}" ]]; then
  {
    echo "UPDATE_LOGS<<EOF"
    echo "$UPDATE_LOGS"
    echo "EOF"
  } >> "$GITHUB_ENV"
  echo "✅ 已写入 GitHub 环境变量 UPDATE_LOGS"
fi
