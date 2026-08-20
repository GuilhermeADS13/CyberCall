import { describe, expect, it } from "vitest";
import {
  canApplyAvatarCrop,
  getAvatarCropTransform,
  getAvatarEditorA11yContract,
  getPresenceLabel,
  isAvatarEditorEscapeKey,
  presenceOptions,
  validateProfileAvatarFile,
} from "../client/src/pages/Home";

describe("CyberCall profile settings", () => {
  it("exposes the four presence states", () => {
    expect(presenceOptions.map(option => option.value)).toEqual([
      "online",
      "away",
      "busy",
      "invisible",
    ]);
    expect(presenceOptions.every(option => option.label && option.detail)).toBe(
      true
    );
  });

  it("keeps the profile summary label aligned with the selected presence", () => {
    expect(getPresenceLabel("online")).toBe("Online");
    expect(getPresenceLabel("away")).toBe("Ausente");
    expect(getPresenceLabel("busy")).toBe("Ocupado");
    expect(getPresenceLabel("invisible")).toBe("Invisível");
  });

  it("covers the accessible editor contract and safe cancellation", () => {
    expect(getAvatarEditorA11yContract()).toEqual({
      role: "dialog",
      ariaModal: true,
      requiresInitialFocus: true,
    });
    expect(isAvatarEditorEscapeKey("Escape")).toBe(true);
    expect(isAvatarEditorEscapeKey("Enter")).toBe(false);
    expect(canApplyAvatarCrop(null)).toBe(false);
    expect(canApplyAvatarCrop("blob:avatar")).toBe(true);
  });

  it("calculates a square crop transform with zoom and offsets", () => {
    const base = getAvatarCropTransform(800, 400, 1, 0, 0);
    expect(base.scale).toBeCloseTo(0.64);
    expect(base.x).toBeCloseTo(-128);
    expect(base.y).toBeCloseTo(0);

    const adjusted = getAvatarCropTransform(800, 400, 1.5, 12, -8);
    expect(adjusted.scale).toBeCloseTo(0.96);
    expect(adjusted.x).toBeCloseTo(-244);
    expect(adjusted.y).toBeCloseTo(-72);
  });

  it("rejects non-images and avatars larger than 5 MB", () => {
    expect(
      validateProfileAvatarFile({ type: "application/pdf", size: 1024 })
    ).toContain("imagem");
    expect(
      validateProfileAvatarFile({
        type: "image/png",
        size: 5 * 1024 * 1024 + 1,
      })
    ).toContain("5 MB");
    expect(
      validateProfileAvatarFile({ type: "image/webp", size: 1024 })
    ).toBeNull();
  });
});
