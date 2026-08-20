import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { closeMobileNavState, handleMobileNavEscape, openMobileNavState } from "../client/src/pages/Home";

const source = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");

describe("CyberCall community navigation", () => {
  it("includes the reference-inspired community controls", () => {
    expect(source).toContain("Buscar comunidade");
    expect(source).toContain("Convidar pilotos");
    expect(source).toContain("Abrir eventos");
    expect(source).toContain("Informações");
    expect(source).toContain("Canais de texto");
    expect(source).toContain("Canais de voz");
    expect(source).toContain("LIVE");
  });

  it("provides mobile drawer state and accessible toggle", () => {
    expect(source).toContain("mobileNavOpen");
    expect(source).toContain("Abrir navegação de comunidades");
    expect(source).toContain("aria-expanded={mobileNavOpen}");
    expect(source).toContain("mobileNavRef.current?.focus()");
    expect(source).toContain("closeMobileNavState(setMobileNavOpen, mobileNavTriggerRef)");
  });

  it("closes the mobile drawer on Escape", () => {
    const close = vi.fn();
    expect(handleMobileNavEscape("Enter", close)).toBe(false);
    expect(close).not.toHaveBeenCalled();
    expect(handleMobileNavEscape("Escape", close)).toBe(true);
    expect(close).toHaveBeenCalledOnce();
  });

  it("opens, focuses and closes through the integrated state helpers", () => {
    const setOpen = vi.fn();
    const focus = vi.fn();
    const triggerRef = { current: null as { focus: () => void } | null };
    const trigger = { focus };
    const drawerFocus = vi.fn();
    const drawerRef = { current: { focus: drawerFocus } };
    openMobileNavState(setOpen, triggerRef, trigger, drawerRef);
    expect(triggerRef.current).toBe(trigger);
    expect(setOpen).toHaveBeenCalledWith(true);
    expect(drawerFocus).toHaveBeenCalledOnce();
    expect(handleMobileNavEscape("Escape", () => closeMobileNavState(setOpen, triggerRef))).toBe(true);
    expect(setOpen).toHaveBeenLastCalledWith(false);
    expect(focus).toHaveBeenCalledOnce();
  });
});
