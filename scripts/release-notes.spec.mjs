import { describe, expect, it } from "vitest"
import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { buildCurrentReleaseNotes } from "./release-notes.mjs"

describe("release notes for updater manifest", () => {
  it("uses the full Chinese changelog for the current package version", async () => {
    const notes = await buildCurrentReleaseNotes()

    expect(notes).not.toBe("唯一 2.2.1 发布版本")
    expect(notes).toContain("1. ")
    expect(notes).toContain("自动读取本地环境中的模型配置")
    expect(notes).toContain("避免旧 frontmatter 章节号")
    expect(notes).toContain("降低界面频繁更新带来的卡顿")
    expect(notes).toContain("不同项目即使 dataVersion 相同")
    expect(notes).toContain("正文草稿最多 3500 字")
    expect(notes).toContain("上限调整为 6000 字")
    expect(notes).toContain("避免流程反复中断")
    expect(notes).not.toContain("同步已确认可以接受的 PR 修复")
    expect(notes).not.toContain(".codex-temp")
    expect(notes).not.toContain("联系方式")
  })

  it("can write release notes directly to a UTF-8 file for CI scripts", () => {
    const outDir = mkdtempSync(join(tmpdir(), "qmai-release-notes-"))
    const outPath = join(outDir, "release-notes.txt")

    execFileSync(process.execPath, ["scripts/release-notes.mjs", "2.1.0", "--out", outPath], {
      cwd: process.cwd(),
      stdio: "pipe",
    })

    const notes = readFileSync(outPath, "utf8")
    expect(notes).toContain("黄金三章")
    expect(notes).toContain("AI 审查")
    expect(notes.split("\n")).toHaveLength(18)
  })
})
