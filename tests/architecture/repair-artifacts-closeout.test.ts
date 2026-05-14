import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("repair artifact closeout", () => {
  it("keeps backlog and next-wave artifacts aligned with completed repair status", () => {
    const backlog = readFileSync("REPAIR-BACKLOG.md", "utf8");
    const nextWave = readFileSync("NEXT-WAVE.md", "utf8");
    const dryRun = readFileSync(
      "docs/website/derived-project-dry-run.md",
      "utf8",
    );

    expect(backlog).toContain("## Execution status - 2026-05-13");
    expect(backlog).toContain("Wave 1: completed");
    expect(backlog).toContain("Wave 2: completed");
    expect(backlog).toContain("Derived-project dry-run follow-ups completed");
    expect(backlog).toContain("content-readiness --strict-client-launch");
    expect(backlog).toContain("Do not treat the original wave list as pending");

    expect(nextWave).toContain("## Current status - 2026-05-13");
    expect(nextWave).toContain("Wave 1 and Wave 2 are already completed");
    expect(nextWave).toContain("Do not restart the first-wave checklist");
    expect(nextWave).toContain("Dedicated lanes only");
    expect(nextWave).toContain(
      "Derived-project dry-run follow-ups are also completed",
    );

    expect(dryRun).toContain("Status: completed in the follow-up repair pass");
    expect(dryRun).toContain("content-readiness --strict-client-launch");
  });
});
