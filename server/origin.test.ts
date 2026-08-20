import { describe, expect, it } from "vitest";
import {
  getConfiguredOrigins,
  isTrustedOrigin,
  isTrustedRequest,
} from "./origin";

describe("origin trust", () => {
  it("accepts a request coming from the same host", () => {
    expect(
      isTrustedOrigin(
        "https://cybercall.onrender.com",
        "cybercall.onrender.com",
        []
      )
    ).toBe(true);
    expect(isTrustedOrigin("http://localhost:3000", "localhost:3000", [])).toBe(
      true
    );
  });

  it("rejects a cross-site origin that is not allowlisted", () => {
    expect(
      isTrustedOrigin("https://evil.example", "cybercall.onrender.com", [])
    ).toBe(false);
    expect(
      isTrustedOrigin(
        "https://cybercall.onrender.com.evil.example",
        "cybercall.onrender.com",
        []
      )
    ).toBe(false);
  });

  it("accepts explicitly configured origins", () => {
    const allowed = getConfiguredOrigins(
      "https://preview.manus.computer, https://studio.example"
    );
    expect(allowed).toEqual(["preview.manus.computer", "studio.example"]);
    expect(
      isTrustedOrigin(
        "https://preview.manus.computer",
        "cybercall.onrender.com",
        allowed
      )
    ).toBe(true);
  });

  it("rejects a malformed origin header", () => {
    expect(isTrustedOrigin("not-a-url", "cybercall.onrender.com", [])).toBe(
      false
    );
  });

  it("allows clients that send no origin at all", () => {
    // Browsers always send Origin on cross-site requests; server-side clients do not.
    expect(isTrustedOrigin(undefined, "cybercall.onrender.com", [])).toBe(true);
    expect(isTrustedRequest({ headers: {} }, [])).toBe(true);
  });

  it("falls back to the referer when origin is absent", () => {
    expect(
      isTrustedRequest(
        {
          headers: {
            host: "cybercall.onrender.com",
            referer: "https://evil.example/page",
          },
        },
        []
      )
    ).toBe(false);
    expect(
      isTrustedRequest(
        {
          headers: {
            host: "cybercall.onrender.com",
            referer: "https://cybercall.onrender.com/",
          },
        },
        []
      )
    ).toBe(true);
  });

  it("prefers origin over referer when both are present", () => {
    expect(
      isTrustedRequest(
        {
          headers: {
            host: "app.example",
            origin: "https://app.example",
            referer: "https://evil.example/",
          },
        },
        []
      )
    ).toBe(true);
    expect(
      isTrustedRequest(
        {
          headers: {
            host: "app.example",
            origin: "https://evil.example",
            referer: "https://app.example/",
          },
        },
        []
      )
    ).toBe(false);
  });
});
