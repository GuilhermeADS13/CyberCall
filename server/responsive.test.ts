import { readNormalizedSource, snippet } from "./testSupport/source";
import { describe, expect, it } from "vitest";

const homeSource = readNormalizedSource(
  "../client/src/pages/Home.tsx",
  import.meta.url
);
const cssSource = readNormalizedSource(
  "../client/src/index.css",
  import.meta.url
);
const botSource = readNormalizedSource(
  "../client/src/components/CyberCallHelpBot.tsx",
  import.meta.url
);

describe("CyberCall responsive contract", () => {
  it("exposes responsive shell and accessible help controls", () => {
    expect(homeSource).toContain(snippet("cybercall-app"));
    expect(homeSource).toContain(snippet("Suspense fallback={null}"));
    expect(botSource).toContain(snippet("aria-expanded={open}"));
    expect(botSource).toContain(snippet("Não compartilhe senhas"));
  });

  it("covers mobile, tablet and reduced-motion rules", () => {
    expect(cssSource).toContain(snippet("@media (max-width: 767px)"));
    expect(cssSource).toContain(
      snippet("@media (min-width: 768px) and (max-width: 1199px)")
    );
    expect(cssSource).toContain(
      snippet("@media (prefers-reduced-motion: reduce)")
    );
    expect(cssSource).toContain(snippet("min-height: 44px"));
  });
});
