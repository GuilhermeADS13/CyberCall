import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { closeVoiceRoomState, cyberCallVoiceRoomCopy, focusVoiceRoom, handleVoiceRoomKey, openVoiceRoomState, restoreVoiceRoomFocus } from "../client/src/pages/Home";

const homeSource = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../client/src/index.css", import.meta.url), "utf8");

describe("CyberCall voice room contract", () => {
  it("keeps the live room copy, controls, and glitch affordances", () => {
    expect(cyberCallVoiceRoomCopy).toEqual({
      eyebrow: "Live room",
      title: "CYBERCALL //",
      subtitle: "Sala de transmissão",
      status: "Sinal conectado",
      preview: "Prévia da sala",
    });
    expect(homeSource).toContain("voice-room-overlay");
    expect(homeSource).toContain("Convidar participantes");
    expect(homeSource).toContain("Compartilhar tela");
    expect(homeSource).toContain("voice-participant-grid");
    const dialog = { focus: () => { dialogFocused = true; } };
    const trigger = { focus: () => { triggerFocused = true; } };
    const triggerRef: { current: typeof trigger | null } = { current: null };
    let dialogFocused = false;
    let triggerFocused = false;
    focusVoiceRoom(dialog);
    restoreVoiceRoomFocus(trigger);
    expect(dialogFocused).toBe(true);
    expect(triggerFocused).toBe(true);
    let closedByEscape = false;
    expect(() => handleVoiceRoomKey("Tab", () => { closedByEscape = true; })).not.toThrow();
    expect(closedByEscape).toBe(false);
    let activeChannel: string | null = null;
    let joined = true;
    openVoiceRoomState("lobby", (value) => { activeChannel = value; }, (value) => { joined = value; }, triggerRef, trigger);
    expect(activeChannel).toBe("lobby");
    expect(joined).toBe(false);
    handleVoiceRoomKey("Escape", () => closeVoiceRoomState((value) => { activeChannel = value; }, (value) => { joined = value; }, triggerRef));
    expect(activeChannel).toBeNull();
    expect(joined).toBe(false);
    expect(triggerFocused).toBe(true);
    expect(styleSource).toContain("voice-room-title-glitch");
    expect(styleSource).toContain("voice-room-scanlines");
  });
});
