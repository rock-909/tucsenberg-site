import { expect, test } from "@playwright/test";

/**
 * Post-Deploy Contact Chain Verification
 * Proof lane: real-service-canary
 *
 * This is the production-like proof for the contact flow.
 * It must hit a deployed URL and verify the real submission chain instead of
 * relying on the local Playwright test-mode path.
 *
 * Environment variables required:
 * - STAGING_URL or PLAYWRIGHT_BASE_URL: deployed site URL
 * - AIRTABLE_API_KEY: PAT with read/write access
 * - AIRTABLE_BASE_ID: target base
 * - AIRTABLE_TABLE_NAME: target table (default: "Contacts")
 */

// Skip this test if not in post-deploy mode
const isPostDeploy = Boolean(
  process.env.POST_DEPLOY_TEST ||
  process.env.STAGING_URL ||
  process.env.PLAYWRIGHT_BASE_URL,
);

interface AirtableContactRecordFields {
  "First Name"?: unknown;
  "Last Name"?: unknown;
  Email?: unknown;
  Company?: unknown;
}

interface AirtableContactRecord {
  id?: string;
  fields?: AirtableContactRecordFields;
}

interface AirtableContactListResponse {
  records?: AirtableContactRecord[];
}

test.describe("Post-Deploy: Production-Like Contact Form Chain", () => {
  test.skip(
    !isPostDeploy,
    "Only runs in post-deploy mode (set POST_DEPLOY_TEST=1)",
  );

  const CANARY_EMAIL = `smoke-test+${Date.now()}@example.com`;
  const AIRTABLE_BASE_URL = "https://api.airtable.com/v0";

  test("form submission creates Airtable record with split name fields", async ({
    page,
    request,
  }) => {
    const baseId = process.env.AIRTABLE_BASE_ID;
    const apiKey = process.env.AIRTABLE_API_KEY;
    const tableName = process.env.AIRTABLE_TABLE_NAME || "Contacts";

    test.skip(
      !baseId || !apiKey,
      "Missing AIRTABLE_BASE_ID or AIRTABLE_API_KEY",
    );

    // 1. Navigate to contact page
    await page.goto("/en/contact");
    await page.waitForLoadState("load");

    // 2. Fill form
    await page.fill('input[name="fullName"]', "Smoke Test");
    await page.fill('input[name="email"]', CANARY_EMAIL);
    await page.fill('input[name="company"]', "Automated Test");
    await page.fill(
      'textarea[name="message"]',
      "Automated post-deploy verification — please ignore",
    );

    // Check privacy checkbox
    const privacyCheckbox = page.locator('input[name="acceptPrivacy"]');
    if (await privacyCheckbox.isVisible()) {
      await privacyCheckbox.check();
    }

    // 3. Wait for Turnstile to initialize on the deployed page
    await page.waitForTimeout(3000);

    // 4. Submit form
    const submitButton = page.getByRole("button", {
      name: /send message|submit/i,
    });

    await expect(
      submitButton,
      "Submit button stayed disabled on the deployed contact flow",
    ).toBeEnabled();

    await submitButton.click();

    // 5. Wait for success or error feedback
    const successIndicator = page
      .getByText(/success|thank you|sent/i)
      .or(page.getByText(/成功|感谢|已发送/i));
    const errorIndicator = page
      .getByText(/error|failed|try again/i)
      .or(page.getByText(/错误|失败|重试/i));

    const result = await Promise.race([
      successIndicator
        .first()
        .waitFor({ timeout: 15000 })
        .then(() => "success"),
      errorIndicator
        .first()
        .waitFor({ timeout: 15000 })
        .then(() => "error"),
    ]).catch(() => "timeout");

    expect(result, "Deployed contact flow did not reach a success state").toBe(
      "success",
    );

    // 6. Verify Airtable record exists
    await page.waitForTimeout(5000); // Wait for async write

    const airtableResponse = await request.get(
      `${AIRTABLE_BASE_URL}/${baseId}/${encodeURIComponent(tableName)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        params: {
          filterByFormula: `{Email}="${CANARY_EMAIL}"`,
          maxRecords: "1",
        },
      },
    );

    expect(airtableResponse.ok()).toBe(true);
    const body = (await airtableResponse.json()) as AirtableContactListResponse;
    expect(body.records?.length ?? 0).toBeGreaterThanOrEqual(1);

    const record = body.records?.[0];
    expect(record?.fields?.["First Name"]).toBe("Smoke");
    expect(record?.fields?.["Last Name"]).toBe("Test");
    expect(record?.fields?.Company).toBe("Automated Test");

    // 7. Clean up: delete test record
    const recordId = record?.id;
    if (recordId) {
      await request.delete(
        `${AIRTABLE_BASE_URL}/${baseId}/${encodeURIComponent(tableName)}/${recordId}`,
        { headers: { Authorization: `Bearer ${apiKey}` } },
      );
    }
  });
});
