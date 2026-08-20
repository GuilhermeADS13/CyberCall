import { describe, expect, it } from "vitest";
import { authCopy, authModes } from "../client/src/pages/Auth";

describe("auth screen contract", () => {
  it("exposes accessible login and signup modes with actionable copy", () => {
    expect(authModes).toEqual(["login", "signup"]);
    expect(authCopy.login.cta).toBe("Continuar com Manus");
    expect(authCopy.signup.cta).toBe("Criar identidade segura");
    expect(authCopy.login.title).toContain("circuito");
    expect(authCopy.signup.title).toContain("circuito");
  });
});
