import { describe, expect, it } from "vitest";
import { hasExpectedSignature, moderateAttachment } from "./attachmentModeration";

describe("attachment moderation", () => {
  it("accepts real PNG signatures and rejects spoofed PNG content", () => {
    expect(hasExpectedSignature(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png")).toBe(true);
    expect(hasExpectedSignature(Buffer.from("not an image"), "image/png")).toBe(false);
  });

  it("fails closed for a valid PDF until antimalware scanning is available", async () => {
    const result = await moderateAttachment(Buffer.from("%PDF-1.7\n"), "application/pdf");
    expect(result).toMatchObject({ allowed: false, category: "malware" });
  });

  it("blocks a MIME/type mismatch before storage", async () => {
    const result = await moderateAttachment(Buffer.from("MZ\x90\x00"), "image/jpeg");
    expect(result).toMatchObject({ allowed: false, category: "spoofed_type" });
  });
});
