/* eslint-disable security/detect-non-literal-fs-filename -- test creates isolated temp report fixtures and moves them to temp trash instead of deleting them */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  collectReportRetentionPlan,
  parseReportRetentionArgs,
  runReportRetention,
} from "../../../scripts/quality/retention-reports.mjs";

const TEMP_TRASH_ROOT = path.join(
  os.tmpdir(),
  "showcase-reports-retention-test-trash",
);

function createFixture(files: Record<string, string>): string {
  const rootDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "showcase-reports-retention-"),
  );

  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = path.join(rootDir, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, "utf8");
  }

  return rootDir;
}

function createSymlinkFixture(): { externalDir: string; rootDir: string } {
  const rootDir = createFixture({
    "reports/local-report-20260501.json": "old local",
    "reports/local-report-20260502.json": "new local",
  });
  const externalDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "showcase-reports-retention-external-"),
  );
  fs.writeFileSync(path.join(externalDir, "outside-20260501.json"), "outside");
  fs.writeFileSync(
    path.join(externalDir, "outside-20260502.json"),
    "outside newer",
  );
  fs.symlinkSync(externalDir, path.join(rootDir, "reports/external"));

  return { externalDir, rootDir };
}

function moveFixtureToTrash(rootDir: string): void {
  if (!fs.existsSync(rootDir)) return;

  fs.mkdirSync(TEMP_TRASH_ROOT, { recursive: true });
  fs.renameSync(
    rootDir,
    path.join(TEMP_TRASH_ROOT, `${path.basename(rootDir)}-${Date.now()}`),
  );
}

function exists(rootDir: string, relativePath: string): boolean {
  return fs.existsSync(path.join(rootDir, relativePath));
}

describe("reports retention", () => {
  const fixtureRoots: string[] = [];

  afterEach(() => {
    for (const rootDir of fixtureRoots.splice(0)) {
      moveFixtureToTrash(rootDir);
    }
  });

  it("keeps latest files and the newest N timestamped JSON reports per family", () => {
    const rootDir = createFixture({
      "reports/quality-gate-20260501.json": "oldest",
      "reports/quality-gate-20260502.json": "old",
      "reports/quality-gate-20260503.json": "new",
      "reports/quality-gate-20260504.json": "newest",
      "reports/quality-gate-latest.json": "latest",
      "reports/semgrep-error-20260501.json": "old semgrep",
      "reports/semgrep-error-20260502.json": "new semgrep",
    });
    fixtureRoots.push(rootDir);

    const plan = collectReportRetentionPlan({ rootDir, keep: 2 });

    expect(plan.moves.map((move) => move.from)).toEqual([
      "reports/quality-gate-20260502.json",
      "reports/quality-gate-20260501.json",
    ]);
    expect(plan.moves.map((move) => move.from)).not.toContain(
      "reports/quality-gate-latest.json",
    );
    expect(plan.groups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          groupKey: "reports/quality-gate.json",
          kept: [
            "reports/quality-gate-20260504.json",
            "reports/quality-gate-20260503.json",
          ],
          pruned: [
            "reports/quality-gate-20260502.json",
            "reports/quality-gate-20260501.json",
          ],
        }),
      ]),
    );
  });

  it("dry-run reports moves without changing the filesystem", () => {
    const rootDir = createFixture({
      "reports/guardrails/component-20260501.json": "old",
      "reports/guardrails/component-20260502.json": "new",
    });
    fixtureRoots.push(rootDir);

    const result = runReportRetention({
      rootDir,
      keep: 1,
      dryRun: true,
      trashBatchName: "retention-test",
    });

    expect(result.moved).toEqual([]);
    expect(result.plan.moves.map((move) => move.from)).toEqual([
      "reports/guardrails/component-20260501.json",
    ]);
    expect(exists(rootDir, "reports/guardrails/component-20260501.json")).toBe(
      true,
    );
    expect(exists(rootDir, "reports/.trash/retention-test")).toBe(false);
  });

  it("moves pruned reports into reports trash instead of deleting them", () => {
    const rootDir = createFixture({
      "reports/semgrep-warning-20260501.json": "old warning",
      "reports/semgrep-warning-20260502.json": "new warning",
    });
    fixtureRoots.push(rootDir);

    const result = runReportRetention({
      rootDir,
      keep: 1,
      dryRun: false,
      trashBatchName: "retention-test",
    });

    expect(result.moved).toEqual([
      {
        from: "reports/semgrep-warning-20260501.json",
        to: "reports/.trash/retention-test/reports/semgrep-warning-20260501.json",
      },
    ]);
    expect(exists(rootDir, "reports/semgrep-warning-20260501.json")).toBe(
      false,
    );
    expect(
      exists(
        rootDir,
        "reports/.trash/retention-test/reports/semgrep-warning-20260501.json",
      ),
    ).toBe(true);
    expect(exists(rootDir, "reports/semgrep-warning-20260502.json")).toBe(true);
  });

  it("does not scan report directory symlinks outside the reports tree", () => {
    const { externalDir, rootDir } = createSymlinkFixture();
    fixtureRoots.push(rootDir, externalDir);

    const result = runReportRetention({
      rootDir,
      keep: 1,
      dryRun: false,
      trashBatchName: "retention-test",
    });

    expect(result.plan.moves.map((move) => move.from)).toEqual([
      "reports/local-report-20260501.json",
    ]);
    expect(exists(rootDir, "reports/local-report-20260501.json")).toBe(false);
    expect(exists(rootDir, "reports/local-report-20260502.json")).toBe(true);
    expect(fs.existsSync(path.join(externalDir, "outside-20260501.json"))).toBe(
      true,
    );
  });

  it("ignores existing reports trash batches", () => {
    const rootDir = createFixture({
      "reports/.trash/retention-old/reports/quality-gate-20260501.json":
        "old trash",
      "reports/quality-gate-20260501.json": "old",
      "reports/quality-gate-20260502.json": "new",
    });
    fixtureRoots.push(rootDir);

    const plan = collectReportRetentionPlan({ rootDir, keep: 1 });

    expect(plan.moves.map((move) => move.from)).toEqual([
      "reports/quality-gate-20260501.json",
    ]);
    expect(plan.moves.map((move) => move.from)).not.toContain(
      "reports/.trash/retention-old/reports/quality-gate-20260501.json",
    );
  });

  it("does not touch owner-authored markdown but can prune known generated markdown families", () => {
    const rootDir = createFixture({
      "reports/owner-review-20260501.md": "human note",
      "reports/owner-review-20260502.md": "human note",
      "reports/architecture/legacy-marker-audit-20260501.md": "old generated",
      "reports/architecture/legacy-marker-audit-20260502.md": "new generated",
      "docs/audits/audit-report-20260501.md": "human audit",
      "docs/superpowers/plans/2026-05-13-sample.md": "human plan",
    });
    fixtureRoots.push(rootDir);

    const plan = collectReportRetentionPlan({ rootDir, keep: 1 });

    expect(plan.moves.map((move) => move.from)).toEqual([
      "reports/architecture/legacy-marker-audit-20260501.md",
    ]);
    expect(plan.moves.map((move) => move.from)).not.toContain(
      "reports/owner-review-20260501.md",
    );
    expect(plan.moves.map((move) => move.from)).not.toContain(
      "docs/audits/audit-report-20260501.md",
    );
    expect(plan.moves.map((move) => move.from)).not.toContain(
      "docs/superpowers/plans/2026-05-13-sample.md",
    );
  });

  it("parses CLI arguments and rejects invalid keep counts", () => {
    expect(parseReportRetentionArgs(["--dry-run", "--keep", "5"])).toEqual({
      dryRun: true,
      help: false,
      keep: 5,
    });
    expect(parseReportRetentionArgs(["--keep=3"])).toEqual({
      dryRun: false,
      help: false,
      keep: 3,
    });
    expect(() => parseReportRetentionArgs(["--keep", "0"])).toThrow(
      /--keep must be a positive integer/u,
    );
  });

  it("keeps the package retention command dry-run by default", () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
    ) as { scripts?: Record<string, string> };

    expect(packageJson.scripts?.["reports:retention"]).toBe(
      "node scripts/quality/retention-reports.mjs --dry-run --keep 5",
    );
  });
});
