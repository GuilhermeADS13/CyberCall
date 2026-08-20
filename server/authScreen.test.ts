import { describe, expect, it } from "vitest";
import {
  authCopy,
  authModes,
  getNextAuthTabIndex,
} from "../client/src/pages/Auth";

describe("auth screen contract", () => {
  it("exposes accessible login and signup modes with actionable copy", () => {
    expect(authModes).toEqual(["login", "signup"]);
    expect(authCopy.login.cta).toBe("Continuar com Manus");
    expect(authCopy.signup.cta).toBe("Criar identidade segura");
    expect(authCopy.login.title).toContain("circuito");
    expect(authCopy.signup.title).toContain("circuito");
    expect(getNextAuthTabIndex("ArrowRight", 0)).toBe(1);
    expect(getNextAuthTabIndex("ArrowLeft", 0)).toBe(1);
    expect(getNextAuthTabIndex("Home", 1)).toBe(0);
    expect(getNextAuthTabIndex("End", 0)).toBe(1);
    expect(getNextAuthTabIndex("Tab", 0)).toBe(0);
  });
});
