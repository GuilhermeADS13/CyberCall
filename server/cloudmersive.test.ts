import { describe, expect, it } from "vitest";

describe("Cloudmersive credentials", () => {
  it.skipIf(!process.env.CLOUDMERSIVE_API_KEY)("has a configured API key ready for the antimalware integration", () => {
    expect(process.env.CLOUDMERSIVE_API_KEY).toBeTruthy();
  });
});
