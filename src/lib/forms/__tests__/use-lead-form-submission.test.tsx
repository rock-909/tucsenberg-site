import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useLeadFormSubmission,
  type LeadSubmissionConfig,
} from "@/lib/forms/use-lead-form-submission";

const trackGenerateLead = vi.hoisted(() => vi.fn());
vi.mock("@/lib/marketing/lead-event", () => ({
  trackGenerateLead,
}));

const loggerWarn = vi.hoisted(() => vi.fn());
vi.mock("@/lib/logger", () => ({
  logger: {
    warn: loggerWarn,
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

interface TestResult {
  readonly ok: boolean;
  readonly network?: boolean;
}

function createConfig(
  overrides: Partial<LeadSubmissionConfig<TestResult>> = {},
): LeadSubmissionConfig<TestResult> {
  return {
    endpoint: "/api/test",
    leadEventTag: "contact",
    buildBody: (formData, turnstileToken) => ({
      turnstileToken,
      name: formData.get("name"),
    }),
    decode: async (response) => ({ ok: response.ok }),
    isSuccess: (result) => result.ok,
    toNetworkError: () => ({ ok: false, network: true }),
    ...overrides,
  };
}

function formDataWithName(name: string): FormData {
  const formData = new FormData();
  formData.set("name", name);
  return formData;
}

describe("useLeadFormSubmission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    global.fetch = vi.fn(async () => Response.json({}, { status: 200 }));
  });

  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("moves idle -> submitting -> success and fires the lead event", async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useLeadFormSubmission(createConfig({ onSuccess })),
    );

    expect(result.current.status).toBe("idle");

    act(() => {
      result.current.acquireTurnstileToken("token-123");
    });

    await act(async () => {
      await result.current.submit(formDataWithName("Alice"));
    });

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });
    expect(result.current.result).toEqual({ ok: true });
    expect(trackGenerateLead).toHaveBeenCalledWith("contact");
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("moves to error when the decoded result is not a success", async () => {
    global.fetch = vi.fn(async () => Response.json({}, { status: 400 }));
    const { result } = renderHook(() => useLeadFormSubmission(createConfig()));

    act(() => {
      result.current.acquireTurnstileToken("token-123");
    });

    await act(async () => {
      await result.current.submit(formDataWithName("Alice"));
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.result).toEqual({ ok: false });
    expect(trackGenerateLead).not.toHaveBeenCalled();
  });

  it("clears the Turnstile token and calls the registered widget reset after success", async () => {
    const widgetReset = vi.fn();
    const { result } = renderHook(() => useLeadFormSubmission(createConfig()));

    act(() => {
      result.current.registerTurnstileReset(widgetReset);
      result.current.acquireTurnstileToken("token-123");
    });

    await act(async () => {
      await result.current.submit(formDataWithName("Alice"));
    });

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });
    expect(result.current.turnstileToken).toBe("");
    expect(widgetReset).toHaveBeenCalledTimes(1);
  });

  it("clears the Turnstile token and calls the registered widget reset after failure", async () => {
    global.fetch = vi.fn(async () => Response.json({}, { status: 500 }));
    const widgetReset = vi.fn();
    const { result } = renderHook(() => useLeadFormSubmission(createConfig()));

    act(() => {
      result.current.registerTurnstileReset(widgetReset);
      result.current.acquireTurnstileToken("token-123");
    });

    await act(async () => {
      await result.current.submit(formDataWithName("Alice"));
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.turnstileToken).toBe("");
    expect(widgetReset).toHaveBeenCalledTimes(1);
  });

  it("unregistering the Turnstile reset binder drops the stale callback", async () => {
    const staleReset = vi.fn();
    const liveReset = vi.fn();
    const { result } = renderHook(() => useLeadFormSubmission(createConfig()));

    let unregister = () => undefined;
    act(() => {
      unregister = result.current.registerTurnstileReset(staleReset);
    });
    act(() => {
      unregister();
      result.current.registerTurnstileReset(liveReset);
      result.current.acquireTurnstileToken("token-123");
    });

    await act(async () => {
      await result.current.submit(formDataWithName("Alice"));
    });

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });
    expect(staleReset).not.toHaveBeenCalled();
    expect(liveReset).toHaveBeenCalledTimes(1);
  });

  it("stores the network-error result when the request throws before decoding", async () => {
    global.fetch = vi.fn(async () => {
      throw new Error("offline");
    });
    const { result } = renderHook(() => useLeadFormSubmission(createConfig()));

    act(() => {
      result.current.acquireTurnstileToken("token-123");
    });

    await act(async () => {
      await result.current.submit(formDataWithName("Alice"));
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.result).toEqual({ ok: false, network: true });
    expect(trackGenerateLead).not.toHaveBeenCalled();
  });

  it("ignores duplicate submissions while a request is in flight", async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    global.fetch = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    const { result } = renderHook(() => useLeadFormSubmission(createConfig()));

    act(() => {
      result.current.acquireTurnstileToken("token-123");
    });

    let firstSubmission: Promise<void> | undefined;
    act(() => {
      firstSubmission = result.current.submit(formDataWithName("Alice"));
      result.current.submit(formDataWithName("Alice")).catch(() => undefined);
    });

    resolveFetch?.(Response.json({}, { status: 200 }));

    await act(async () => {
      await firstSubmission;
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  it("never posts without a Turnstile token and logs the guard", async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;
    const { result } = renderHook(() => useLeadFormSubmission(createConfig()));

    await act(async () => {
      await result.current.submit(formDataWithName("Alice"));
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(loggerWarn).toHaveBeenCalled();
    expect(result.current.status).toBe("idle");
  });

  it("acquires and resets the Turnstile token", () => {
    const { result } = renderHook(() => useLeadFormSubmission(createConfig()));

    act(() => {
      result.current.acquireTurnstileToken("token-123");
    });
    expect(result.current.turnstileToken).toBe("token-123");

    act(() => {
      result.current.resetTurnstileToken();
    });
    expect(result.current.turnstileToken).toBe("");
  });

  it("fail() seeds an error result without submitting", async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;
    const { result } = renderHook(() => useLeadFormSubmission(createConfig()));

    act(() => {
      result.current.fail({ ok: false });
    });

    expect(result.current.status).toBe("error");
    expect(result.current.result).toEqual({ ok: false });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sends the built body with the verified token to the endpoint", async () => {
    const { result } = renderHook(() => useLeadFormSubmission(createConfig()));

    act(() => {
      result.current.acquireTurnstileToken("token-abc");
    });

    await act(async () => {
      await result.current.submit(formDataWithName("Alice"));
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/test",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    const requestInit = vi.mocked(fetch).mock.calls[0]?.[1];
    const body = JSON.parse(String(requestInit?.body)) as Record<
      string,
      unknown
    >;
    expect(body).toMatchObject({ turnstileToken: "token-abc", name: "Alice" });
  });
});
