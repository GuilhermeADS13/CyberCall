import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { focusAuthSubmitButton, getAuthSubmitA11yState } from "../client/src/pages/Auth";

const authSource = readFileSync(new URL("../client/src/pages/Auth.tsx", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../client/src/index.css", import.meta.url), "utf8");

describe("CyberCall auth motion accessibility contract", () => {
  it("keeps loading and motion-reduction affordances present", () => {
    expect(authSource).toContain('aria-busy={getAuthSubmitA11yState(isSubmitting).ariaBusy}');
    expect(authSource).toContain("Redirecionando para autenticação segura");
    expect(authSource).toContain("cypher-glitch");
    expect(authSource).toContain("cypher-neon-button");
    expect(styleSource).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styleSource).toContain(".cybercall-video { display: none; }");
    expect(getAuthSubmitA11yState(true)).toEqual({ ariaBusy: true, disabled: true, announcement: "Redirecionando para autenticação segura", preserveFocus: true });
    expect(getAuthSubmitA11yState(false).preserveFocus).toBe(true);
    const focus = vi.fn();
    focusAuthSubmitButton({ focus });
    expect(focus).toHaveBeenCalledOnce();
  });
});
