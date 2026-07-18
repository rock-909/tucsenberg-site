import { afterEach, describe, expect, it, vi } from "vitest";
import { SINGLE_SITE_FACTS } from "@/config/single-site";
import { generateMetadataForPath } from "@/lib/seo-metadata";

const PREVIEW_BASE_URL =
  "https://tucsenberg-site-preview.faints-pudgier-9r.workers.dev";
const TUCSENBERG_OG_IMAGE = "/images/tucsenberg-og.png";

describe("single-site", () => {
  afterEach(() => {
    vi.doUnmock("@/lib/env");
    vi.resetModules();
  });

  it("uses the Cloudflare preview fallback when no public site URL is explicitly configured", async () => {
    vi.resetModules();
    vi.doMock("@/lib/env", () => ({
      env: {
        NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
        NEXT_PUBLIC_SITE_URL: undefined,
      },
      runtimeEnv: {
        NEXT_PUBLIC_BASE_URL: undefined,
        NEXT_PUBLIC_SITE_URL: undefined,
      },
      getRuntimeEnvString: () => undefined,
      isRuntimeProduction: () => true,
    }));

    const { SINGLE_SITE_CONFIG } = await import("@/config/single-site");

    expect(SINGLE_SITE_CONFIG.baseUrl).toBe(PREVIEW_BASE_URL);
  });

  it("keeps the approved Tucsenberg OG image as the live default", () => {
    expect(SINGLE_SITE_FACTS.brandAssets.ogImage).toBe(TUCSENBERG_OG_IMAGE);

    const metadata = generateMetadataForPath({
      locale: "en",
      pageType: "home",
      path: "/",
    });

    expect(metadata.openGraph?.images).toEqual([{ url: TUCSENBERG_OG_IMAGE }]);
    expect(metadata.twitter?.images).toEqual([TUCSENBERG_OG_IMAGE]);
  });
});
