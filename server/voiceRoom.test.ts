import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { appendVoiceChatMessage, closeVoiceRoomState, cyberCallVoiceRoomCopy, focusVoiceRoom, formatVoiceTypingLabel, handleVoiceRoomKey, addRecentSearch, filterGlobalSearchResults, highlightSearchMatches, normalizeRecentSearches, normalizeVoiceChatBody, searchGlobalContent, openVoiceRoomState, removeVoiceChatMessage, updateVoiceChatMessage, pruneVoiceTypingParticipants, restoreVoiceRoomFocus } from "../client/src/pages/Home";

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

  it("highlights repeated terms and treats regex characters literally", () => {
    expect(highlightSearchMatches("Cyber cyber C++", "cyber").filter((part) => part.matched).map((part) => part.text)).toEqual(["Cyber", "cyber"]);
    expect(highlightSearchMatches("a+b a+b", "a+b").filter((part) => part.matched)).toHaveLength(2);
    expect(highlightSearchMatches("sem sinal", "")).toEqual([{ text: "sem sinal", matched: false }]);
  });

  it("migrates and manages recent searches with date and channel context", () => {
    const migrated = normalizeRecentSearches([" alpha ", "alpha", 42, "", "beta"], 6, "general", 1700000000000);
    expect(migrated).toEqual([{ query: "alpha", searchedAt: 1700000000000, channelName: "general" }, { query: "beta", searchedAt: 1700000000000, channelName: "general" }]);
    expect(addRecentSearch(migrated, "gamma", "lobby", 1700000001000, 2)).toEqual([{ query: "gamma", searchedAt: 1700000001000, channelName: "lobby" }, { query: "alpha", searchedAt: 1700000000000, channelName: "general" }]);
    expect(addRecentSearch(migrated, " alpha ", "lobby", 1700000002000)).toHaveLength(2);
  });

  it("filters global search results by category", () => {
    const results = searchGlobalContent("maya", [{ id: 1, authorName: "Maya", body: "Sinal confirmado" }], [{ userId: 8, name: "Maya // MOD", email: "maya@cybercall.test", memberRole: "moderator" }]);
    expect(filterGlobalSearchResults(results, "all")).toHaveLength(2);
    expect(filterGlobalSearchResults(results, "message").every((result) => result.kind === "message")).toBe(true);
    expect(filterGlobalSearchResults(results, "user").every((result) => result.kind === "user")).toBe(true);
  });

  it("searches messages and users with normalized query", () => {
    const results = searchGlobalContent("maya", [{ id: 1, authorName: "Maya", body: "Sinal confirmado" }], [{ userId: 8, name: "Maya // MOD", email: "maya@cybercall.test", memberRole: "moderator" }]);
    expect(results.map((result) => result.kind)).toEqual(["message", "user"]);
    expect(searchGlobalContent("", [], [])).toEqual([]);
  });

  it("formats typing participants and removes expired states", () => {
    expect(formatVoiceTypingLabel([{ userId: 7, authorName: "Maya", expiresAt: 10 }])).toBe("Maya está digitando...");
    expect(formatVoiceTypingLabel([{ userId: 7, authorName: "Maya", expiresAt: 10 }, { userId: 8, authorName: "Neo", expiresAt: 10 }])).toBe("Maya e Neo estão digitando...");
    const current = { 7: { userId: 7, authorName: "Maya", expiresAt: 100 }, 8: { userId: 8, authorName: "Neo", expiresAt: 90 } };
    expect(Object.keys(pruneVoiceTypingParticipants(current, 95))).toEqual(["7"]);
  });
});
