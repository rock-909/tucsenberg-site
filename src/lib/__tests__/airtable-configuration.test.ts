import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  envValues: {
    AIRTABLE_API_KEY: "test-api-key",
    AIRTABLE_BASE_ID: "test-base-id",
    AIRTABLE_TABLE_NAME: "test-table",
  } as Record<string, string | undefined>,
  runtimeValues: {} as Record<string, string | undefined>,
  fetch: vi.fn(),
  warn: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  env: mocks.envValues,
  getRuntimeEnvString: (key: string) =>
    mocks.runtimeValues[key] ?? mocks.envValues[key],
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: mocks.warn,
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  sanitizeEmail: () => "[REDACTED_EMAIL]",
}));

const validLeadData = {
  firstName: "Config",
  lastName: "Tester",
  email: "config@example.com",
  message: "Configuration test inquiry",
  productName: "General RFQ",
};

async function createService() {
  const { AirtableService } = await import("../airtable/service");
  return new AirtableService();
}

describe("Airtable Service configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.envValues.AIRTABLE_API_KEY = "test-api-key";
    mocks.envValues.AIRTABLE_BASE_ID = "test-base-id";
    mocks.envValues.AIRTABLE_TABLE_NAME = "test-table";
    for (const key of Object.keys(mocks.runtimeValues)) {
      delete mocks.runtimeValues[key];
    }
    mocks.warn.mockReset();
    mocks.fetch.mockReset().mockResolvedValue(
      new Response(JSON.stringify({ records: [{ id: "rec-config" }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", mocks.fetch);
  });

  it("uses one native fetch with a cancellable request signal", async () => {
    const timeoutSignal = new AbortController().signal;
    const timeoutSpy = vi
      .spyOn(AbortSignal, "timeout")
      .mockReturnValue(timeoutSignal);
    const service = await createService();
    const { AIRTABLE_REQUEST_TIMEOUT_MS } = await import("../airtable/service");

    expect(service.isReady()).toBe(true);
    await expect(service.createLead(validLeadData)).resolves.toEqual({
      id: "rec-config",
    });

    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = mocks.fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.airtable.com/v0/test-base-id/test-table");
    expect(init.method).toBe("POST");
    expect(timeoutSpy).toHaveBeenCalledOnce();
    expect(timeoutSpy).toHaveBeenCalledWith(AIRTABLE_REQUEST_TIMEOUT_MS);
    expect(init.signal).toBe(timeoutSignal);
    expect(init.headers).toEqual({
      authorization: "Bearer test-api-key",
      "content-type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toMatchObject({
      records: [{ fields: { Email: "config@example.com" } }],
    });
  });

  it("uses Contacts when the table name is missing", async () => {
    mocks.envValues.AIRTABLE_TABLE_NAME = undefined;
    const service = await createService();

    await service.createLead(validLeadData);

    expect(mocks.fetch.mock.calls[0]?.[0]).toBe(
      "https://api.airtable.com/v0/test-base-id/Contacts",
    );
  });

  it.each([
    ["API key", "AIRTABLE_API_KEY"],
    ["base ID", "AIRTABLE_BASE_ID"],
  ] as const)("stays disabled when the %s is missing", async (_label, key) => {
    mocks.envValues[key] = undefined;
    const service = await createService();

    expect(service.isReady()).toBe(false);
    await expect(service.createLead(validLeadData)).rejects.toThrow(
      "Airtable service is not configured",
    );
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("reads Cloudflare runtime env populated after construction", async () => {
    mocks.envValues.AIRTABLE_API_KEY = undefined;
    mocks.envValues.AIRTABLE_BASE_ID = undefined;
    mocks.envValues.AIRTABLE_TABLE_NAME = undefined;
    const service = await createService();

    mocks.runtimeValues.AIRTABLE_API_KEY = "runtime-airtable-key";
    mocks.runtimeValues.AIRTABLE_BASE_ID = "runtime-base-id";
    mocks.runtimeValues.AIRTABLE_TABLE_NAME = "Runtime Contacts";

    expect(service.isReady()).toBe(true);
    await service.createLead(validLeadData);

    expect(mocks.fetch.mock.calls[0]?.[0]).toBe(
      "https://api.airtable.com/v0/runtime-base-id/Runtime%20Contacts",
    );
  });
});
