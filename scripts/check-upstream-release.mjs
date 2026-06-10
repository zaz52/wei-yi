import { readFileSync, appendFileSync } from "node:fs"

const UPSTREAM_LATEST_RELEASE_API = "https://api.github.com/repos/Mochocyang/QMAI/releases/latest"

function normalizeVersion(value) {
  return String(value ?? "").trim().replace(/^v/i, "")
}

function compareSemver(left, right) {
  const a = normalizeVersion(left).split(".").map((part) => Number.parseInt(part, 10) || 0)
  const b = normalizeVersion(right).split(".").map((part) => Number.parseInt(part, 10) || 0)
  const length = Math.max(a.length, b.length)
  for (let i = 0; i < length; i += 1) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0)
    if (diff !== 0) return diff > 0 ? 1 : -1
  }
  return 0
}

function writeGitHubOutput(outputs) {
  const outputPath = process.env.GITHUB_OUTPUT
  if (!outputPath) return
  const lines = Object.entries(outputs).map(([key, value]) => `${key}=${String(value).replace(/\r?\n/g, " ")}`)
  appendFileSync(outputPath, `${lines.join("\n")}\n`, "utf8")
}

async function main() {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"))
  const currentVersion = normalizeVersion(pkg.version)
  const response = await fetch(UPSTREAM_LATEST_RELEASE_API, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "wei-yi-upstream-release-check",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch upstream release: HTTP ${response.status}`)
  }

  const latest = await response.json()
  const latestTag = latest.tag_name
  const latestVersion = normalizeVersion(latestTag)
  const updateAvailable = compareSemver(latestVersion, currentVersion) > 0
  const outputs = {
    current_version: currentVersion,
    latest_version: latestVersion,
    latest_tag: latestTag,
    latest_url: latest.html_url,
    update_available: updateAvailable ? "true" : "false",
  }

  writeGitHubOutput(outputs)
  console.log(JSON.stringify(outputs, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
