import { describe, expect, it } from "vitest";
import { cyberCallProfilePanelCopy } from "../client/src/pages/Home";

describe("CyberCall profile panel contract", () => {
  it("exposes the session, security, and presence labels", () => {
    expect(cyberCallProfilePanelCopy).toEqual({
      title: "Perfil da sessão",
      session: "Protegida",
      presence: "Online",
    });
  });
});
