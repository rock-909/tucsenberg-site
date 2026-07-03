import type { Page } from "@playwright/test";
import { describe, expect, it, vi } from "vitest";
import { installInterferenceGuard } from "../../e2e/test-environment-setup";

function createPage() {
  return {
    addInitScript: vi.fn(async () => undefined),
  } as unknown as Page;
}

describe("test environment setup", () => {
  it("does not install an interference observer when no selectors are configured", async () => {
    const page = createPage();

    await installInterferenceGuard(page);

    expect(page.addInitScript).not.toHaveBeenCalled();
  });
});
