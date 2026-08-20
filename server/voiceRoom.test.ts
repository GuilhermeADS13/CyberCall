import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { appendVoiceChatMessage, closeVoiceRoomState, cyberCallVoiceRoomCopy, focusVoiceRoom, formatVoiceTypingLabel, handleVoiceRoomKey, normalizeVoiceChatBody, openVoiceRoomState, removeVoiceChatMessage, updateVoiceChatMessage, pruneVoiceTypingParticipants, restoreVoiceRoomFocus } from "../client/src/pages/Home";

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
    expect(homeSource).toContain("Chat textual da chamada");
    expect(homeSource).toContain("Mensagem da chamada");
    expect(homeSource).toContain("voice.chat");
    expect(homeSource).toContain("voice.typing");
    expect(homeSource).toContain("voice.chat.edit");
    expect(homeSource).toContain("voice.chat.delete");
    expect(homeSource).toContain("Editar minha mensagem");
    expect(homeSource).toContain("Excluir minha mensagem");
    expect(homeSource).toContain("está digitando");
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

  it("normalizes chat messages and deduplicates repeated realtime events", () => {
    expect(normalizeVoiceChatBody("  sinal   ")).toBe("sinal");
    expect(normalizeVoiceChatBody("x".repeat(2100))).toHaveLength(2000);
    const first = { id: "evt-1", userId: 7, authorName: "Piloto", body: "Olá", occurredAt: 1 };
    const second = { id: "evt-2", userId: 8, authorName: "Maya", body: "Tudo certo", occurredAt: 2 };
    expect(appendVoiceChatMessage([first], first)).toEqual([first]);
    expect(appendVoiceChatMessage([first], second)).toEqual([first, second]);
    expect(updateVoiceChatMessage([first], "evt-1", " editado ", 3)[0]).toMatchObject({ body: "editado", editedAt: 3 });
    expect(removeVoiceChatMessage([first, second], "evt-1")).toEqual([second]);
  });

  it("formats typing participants and removes expired states", () => {
    expect(formatVoiceTypingLabel([{ userId: 7, authorName: "Maya", expiresAt: 10 }])).toBe("Maya está digitando...");
    expect(formatVoiceTypingLabel([{ userId: 7, authorName: "Maya", expiresAt: 10 }, { userId: 8, authorName: "Neo", expiresAt: 10 }])).toBe("Maya e Neo estão digitando...");
    const current = { 7: { userId: 7, authorName: "Maya", expiresAt: 100 }, 8: { userId: 8, authorName: "Neo", expiresAt: 90 } };
    expect(Object.keys(pruneVoiceTypingParticipants(current, 95))).toEqual(["7"]);
  });
});
