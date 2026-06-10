# 唯一上游同步流程

唯一保留自己的名称、界面外壳、安装包、更新源和使用说明链接；功能代码定期从 `Mochocyang/QMAI` 同步。

自动检查：

- GitHub Actions 每天 09:00 检查上游最新 Release。
- 上游版本高于当前 `package.json` 版本时，会在 `zaz52/wei-yi` 创建同步 Issue。
- Issue 负责提醒和列出清单；合并、构建、发布由本地执行，便于处理冲突和确认品牌。

同步清单：

1. 拉取上游 tag 并合并功能代码。
2. 保留 `唯一`、`wei-yi`、`com.zaz52.weiyi`、`zaz52/wei-yi` 更新源。
3. 保留工作台布局、安装器素材、飞书使用说明链接。
4. 保持“联系与支持”入口移除状态。
5. 运行 `npm run build` 和 `npm run test:mocks`。
6. 运行 `npm run build:github-release` 生成安装包、签名和 `latest.json`。
7. 推送到 `zaz52/wei-yi`，更新 `vX.Y.Z` Release。
8. 卸载旧版并安装新版到 `E:\WeiYi`。

发布要求：

- Release 只保留 `WeiYi_*_windows_X64.exe`、签名文件、`latest.json`、`release-notes.txt`。
- `latest.json` 的下载地址必须指向 `https://github.com/zaz52/wei-yi/releases/latest/download/...`。
- 仓库 `release/WeiYi_2.2.11_windows_x64_setup.exe` 保留当前 Windows 安装包副本。
