import { describe, expect, it } from "vitest";
import { getPresenceLabel, presenceOptions, validateProfileAvatarFile } from "../client/src/pages/Home";

describe("CyberCall profile settings", () => {
  it("exposes the four presence states", () => {
    expect(presenceOptions.map((option) => option.value)).toEqual(["online", "away", "busy", "invisible"]);
    expect(presenceOptions.every((option) => option.label && option.detail)).toBe(true);
  });

  it("keeps the profile summary label aligned with the selected presence", () => {
    expect(getPresenceLabel("online")).toBe("Online");
    expect(getPresenceLabel("away")).toBe("Ausente");
    expect(getPresenceLabel("busy")).toBe("Ocupado");
    expect(getPresenceLabel("invisible")).toBe("Invisível");
  });

  it("rejects non-images and avatars larger than 5 MB", () => {
    expect(validateProfileAvatarFile({ type: "application/pdf", size: 1024 })).toContain("imagem");
    expect(validateProfileAvatarFile({ type: "image/png", size: 5 * 1024 * 1024 + 1 })).toContain("5 MB");
    expect(validateProfileAvatarFile({ type: "image/webp", size: 1024 })).toBeNull();
  });
});
