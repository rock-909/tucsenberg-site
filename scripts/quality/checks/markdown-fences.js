const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();

/**
 * Opening fences need a language so rendered docs highlight correctly.
 * Reviewers kept catching this by hand, one file at a time, and kept missing
 * some — it is decidable by machine, so it should not cost review attention.
 */
function collectFenceFindings(rootDir = ROOT, files) {
  const markdownFiles = files ?? collectTrackedMarkdownFiles(rootDir);
  const findings = [];

  for (const file of markdownFiles) {
    const absolutePath = path.join(rootDir, file);
    if (!fs.existsSync(absolutePath)) continue;

    let insideFence = false;
    const lines = fs.readFileSync(absolutePath, "utf8").split("\n");

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith("```")) return;

      if (insideFence) {
        insideFence = false;
        return;
      }

      insideFence = true;
      if (trimmed === "```") {
        findings.push({ file, line: index + 1 });
      }
    });
  }

  return { findings, scannedFileCount: markdownFiles.length };
}

function collectTrackedMarkdownFiles(rootDir) {
  const output = execFileSync(
    "git",
    ["-c", "core.quotepath=false", "ls-files", "-z", "--", "*.md"],
    { cwd: rootDir, encoding: "utf8" },
  );
  return output.split("\0").filter(Boolean);
}

function runMarkdownFenceCheck() {
  const { findings, scannedFileCount } = collectFenceFindings();

  // Scanning nothing is a broken scan, not a clean repo.
  if (scannedFileCount === 0) {
    console.error("markdown-fences failed: found no tracked markdown files");
    return false;
  }

  if (findings.length === 0) {
    console.log(
      `markdown-fences passed: ${scannedFileCount} file(s), every code fence declares a language`,
    );
    return true;
  }

  console.error(
    "markdown-fences failed: opening code fences without a language",
  );
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line}`);
  }
  console.error(
    "Add a language after the opening backticks, for example ```bash or ```text.",
  );
  return false;
}

module.exports = { collectFenceFindings, runMarkdownFenceCheck };
