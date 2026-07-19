import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { API_ERROR_CODES } from "@/constants/api-error-codes";
import { OPTIONS, POST } from "../route";

function createContactRequest(body: BodyInit | null = null): NextRequest {
  return new NextRequest("http://localhost:3000/api/contact", {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("/api/contact tombstone", () => {
  it("returns 410 with a stable machine error and performs no lead-writing work", async () => {
    const response = await POST(
      createContactRequest(
        JSON.stringify({
          fullName: "Bot Example",
          email: "bot@example.com",
          turnstileToken: "token",
        }),
      ),
    );
    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data).toEqual({
      success: false,
      errorCode: API_ERROR_CODES.CONTACT_ENDPOINT_RETIRED,
    });
  });

  it("answers CORS preflight without rate limiting", async () => {
    const response = OPTIONS(
      new NextRequest("http://localhost:3000/api/contact", {
        method: "OPTIONS",
        headers: {
          Origin: "https://example.com",
          "Access-Control-Request-Method": "POST",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain(
      "POST",
    );
  });
});
