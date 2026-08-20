import { readNormalizedSource, snippet } from "./testSupport/source";
import { describe, expect, it, vi } from "vitest";
import {
  focusAuthSubmitButton,
  getAuthSubmitA11yState,
} from "../client/src/pages/Auth";

const authSource = readNormalizedSource(
  "../client/src/pages/Auth.tsx",
  import.meta.url
);
const styleSource = readNormalizedSource(
  "../client/src/index.css",
  import.meta.url
);

describe("CyberCall auth motion accessibility contract", () => {
  it("keeps loading and motion-reduction affordances present", () => {
    expect(authSource).toContain(
      "aria-busy={getAuthSubmitA11yState(isSubmitting).ariaBusy}"
    );
    expect(authSource).toContain(
      snippet("Redirecionando para autenticação segura")
    );
    expect(authSource).toContain(snippet("cypher-glitch"));
    expect(authSource).toContain(snippet("cypher-neon-button"));
    expect(styleSource).toContain(
      snippet("@media (prefers-reduced-motion: reduce)")
    );
    expect(styleSource).toContain(
      snippet(".cybercall-video { display: none; }")
    );
    expect(getAuthSubmitA11yState(true)).toEqual({
      ariaBusy: true,
      disabled: true,
      announcement: "Redirecionando para autenticação segura",
      preserveFocus: true,
    });
    expect(getAuthSubmitA11yState(false).preserveFocus).toBe(true);
    const focus = vi.fn();
    focusAuthSubmitButton({ focus });
    expect(focus).toHaveBeenCalledOnce();
  });
});
