import { describe, expect, it } from "vitest";
import {
  buildHelpBotMessages,
  cyberCallHelpSystemPrompt,
  cyberCallHelpTopics,
} from "./helpBot";

describe("CyberCall help bot", () => {
  it("keeps the assistant scoped to safe CyberCall FAQ topics", () => {
    expect(cyberCallHelpTopics).toContain("salas de voz e vídeo");
    expect(cyberCallHelpSystemPrompt).toContain("Nunca peça senha");
    expect(cyberCallHelpSystemPrompt).toContain(
      "Não desative nem recomende contornar bloqueios"
    );
  });

  it("prepends policy context and keeps only the latest messages", () => {
    const messages = Array.from({ length: 10 }, (_, index) => ({
      role: "user" as const,
      content: `dúvida ${index}`,
    }));
    const result = buildHelpBotMessages(messages);
    expect(result[0].role).toBe("system");
    expect(result).toHaveLength(9);
    expect(result.at(-1)?.content).toBe("dúvida 9");
  });
});
