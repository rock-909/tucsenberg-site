import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLeadRecord } from "@/lib/airtable/service-internal/lead-records";
import type { ProductLeadData } from "@/lib/airtable/types";
import { logger } from "@/lib/logger";

vi.mock("@/lib/logger", async () => {
  const mockLogger = await import("@/lib/__tests__/mocks/logger");
  return mockLogger;
});

const validProductLeadData: ProductLeadData = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  message: "Test message",
  productName: "ABS Flood Barriers",
  catalogProductId: "abs-flood-barriers",
};

function params(data: ProductLeadData = validProductLeadData) {
  return {
    apiKey: "key-secret",
    baseId: "app/base",
    tableName: "Sales Leads",
    data,
    signal: new AbortController().signal,
  };
}

describe("createLeadRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps the lead into one Airtable REST request", async () => {
    const request = params({
      ...validProductLeadData,
      firstName: "Jane",
      lastName: "García-López",
      email: "Buyer+RFQ@Example.com",
      message: "Need details",
      requirements: "Custom packaging",
      referenceId: "PRO-test-123",
      utmSource: "google",
      utmCampaign: '=IMPORTXML("https://example.test")',
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ records: [{ id: " rec-123 " }] }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(createLeadRecord(request)).resolves.toEqual({ id: "rec-123" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.airtable.com/v0/app%2Fbase/Sales%20Leads");
    expect(init.signal).toBe(request.signal);
    expect(init.headers).toEqual({
      authorization: "Bearer key-secret",
      "content-type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual({
      records: [
        {
          fields: expect.objectContaining({
            Email: "buyer+rfq@example.com",
            "Reference ID": "PRO-test-123",
            "First Name": "Jane",
            "Last Name": "García-López",
            Message: "Need details",
            Requirements: "Custom packaging",
            "UTM Source": "google",
            "UTM Campaign": `'${request.data.utmCampaign}`,
          }),
        },
      ],
    });
  });

  it.each([undefined, null, "", "   "])(
    "rejects a success response with invalid id %j",
    async (id) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ records: [{ id }] }), {
            status: 200,
          }),
        ),
      );

      await expect(createLeadRecord(params())).rejects.toThrow(
        "Failed to create lead record",
      );
    },
  );

  it("neutralizes formulas without changing ordinary Unicode", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ records: [{ id: "rec-formula" }] }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await createLeadRecord(
      params({
        ...validProductLeadData,
        firstName: "=Buyer",
        lastName: "García-López",
        message: "=message",
        productName: "+Product",
        catalogProductId: "-product-slug",
        requirements: "@requirements",
      }),
    );

    const body = JSON.parse(
      String((fetchMock.mock.calls[0]?.[1] as RequestInit).body),
    ) as { records: Array<{ fields: Record<string, unknown> }> };
    expect(body.records[0]?.fields).toMatchObject({
      "First Name": "'=Buyer",
      "Last Name": "García-López",
      Message: "'=message",
      "Product Name": "'+Product",
      "Product Slug": "'-product-slug",
      Requirements: "'@requirements",
    });
  });

  it("logs provider error type and status without response PII", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            type: "INVALID_VALUE_FOR_COLUMN",
            message: "john.doe@example.com should not reach logs",
          },
        }),
        { status: 422 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(createLeadRecord(params())).rejects.toThrow(
      "Failed to create lead record",
    );

    expect(logger.error).toHaveBeenCalledWith("Failed to create lead record", {
      errorType: "INVALID_VALUE_FOR_COLUMN",
      statusCode: 422,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(vi.mocked(logger.error).mock.calls)).not.toContain(
      "john.doe@example.com",
    );
  });

  it("logs fetch errors without secrets", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network timeout")),
    );

    await expect(createLeadRecord(params())).rejects.toThrow(
      "Failed to create lead record",
    );

    expect(logger.error).toHaveBeenCalledWith("Failed to create lead record", {
      error: "Network timeout",
    });
    expect(JSON.stringify(vi.mocked(logger.error).mock.calls)).not.toContain(
      "key-secret",
    );
  });
});
