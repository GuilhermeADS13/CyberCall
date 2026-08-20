import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../client/src/index.css", import.meta.url), "utf8");
const botSource = readFileSync(new URL("../client/src/components/CyberCallHelpBot.tsx", import.meta.url), "utf8");

describe("CyberCall responsive contract", () => {
  it("exposes responsive shell and accessible help controls", () => {
    expect(homeSource).toContain("cybercall-app");
    expect(homeSource).toContain("Suspense fallback={null}");
    expect(botSource).toContain("aria-expanded={open}");
    expect(botSource).toContain("Não compartilhe senhas");
  });

  it("covers mobile, tablet and reduced-motion rules", () => {
    expect(cssSource).toContain("@media (max-width: 767px)");
    expect(cssSource).toContain("@media (min-width: 768px) and (max-width: 1199px)");
    expect(cssSource).toContain("@media (prefers-reduced-motion: reduce)");
    expect(cssSource).toContain("min-height: 44px");
  });
});
