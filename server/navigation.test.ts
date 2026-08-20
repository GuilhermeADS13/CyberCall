import { readNormalizedSource, snippet } from "./testSupport/source";
import { describe, expect, it, vi } from "vitest";
import {
  closeMobileNavState,
  handleMobileNavEscape,
  openMobileNavState,
} from "../client/src/pages/Home";

const source = readNormalizedSource(
  "../client/src/pages/Home.tsx",
  import.meta.url
);

describe("CyberCall community navigation", () => {
  it("includes the reference-inspired community controls", () => {
    expect(source).toContain(snippet("Buscar comunidade"));
    expect(source).toContain(snippet("Convidar pilotos"));
    expect(source).toContain(snippet("Abrir eventos"));
    expect(source).toContain(snippet("Informações"));
    expect(source).toContain(snippet("Canais de texto"));
    expect(source).toContain(snippet("Canais de voz"));
    expect(source).toContain(snippet("LIVE"));
  });

  it("provides mobile drawer state and accessible toggle", () => {
    expect(source).toContain(snippet("mobileNavOpen"));
    expect(source).toContain(snippet("Abrir navegação de comunidades"));
    expect(source).toContain(snippet("aria-expanded={mobileNavOpen}"));
    expect(source).toContain(snippet("mobileNavRef.current?.focus()"));
    expect(source).toContain(
      snippet("closeMobileNavState(setMobileNavOpen, mobileNavTriggerRef)")
    );
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
    expect(
      handleMobileNavEscape("Escape", () =>
        closeMobileNavState(setOpen, triggerRef)
      )
    ).toBe(true);
    expect(setOpen).toHaveBeenLastCalledWith(false);
    expect(focus).toHaveBeenCalledOnce();
  });
});
