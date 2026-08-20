import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const renderConfig = readFileSync(
  new URL("../render.yaml", import.meta.url),
  "utf8"
);
const deployGuide = readFileSync(
  new URL("../docs/RENDER_DEPLOY.md", import.meta.url),
  "utf8"
);

describe("Render deployment preparation", () => {
  it("keeps production build and start commands compatible with the Node service", () => {
    expect(renderConfig).toContain("runtime: node");
    expect(renderConfig).toContain(
      "buildCommand: pnpm install --frozen-lockfile && pnpm build"
    );
    expect(renderConfig).toContain("startCommand: pnpm start");
    expect(deployGuide).toContain("process.env.PORT");
    expect(deployGuide).toContain("/api/realtime");
  });

  it("declares required server and frontend environment variables without secret values", () => {
    expect(renderConfig).toContain("key: DATABASE_URL");
    expect(renderConfig).toContain("key: JWT_SECRET");
    expect(renderConfig).toContain("key: OAUTH_SERVER_URL");
    expect(renderConfig).toContain("key: BUILT_IN_FORGE_API_KEY");
    expect(renderConfig).toContain("key: VITE_FRONTEND_FORGE_API_KEY");
    expect(renderConfig).not.toMatch(/(JWT_SECRET|DATABASE_URL):\s+[^\n]+/);
  });

  it("documents the external hosting trade-off and required manual OAuth setup", () => {
    expect(deployGuide).toContain("alternativa externa ao WebDev");
    expect(deployGuide).toContain("callback OAuth");
    expect(deployGuide).toContain("MySQL/TiDB");
  });
});
