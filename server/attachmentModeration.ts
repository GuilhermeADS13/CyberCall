import { invokeLLM } from "./_core/llm";

export type ModerationDecision = {
  allowed: boolean;
  reason: string;
  category:
    | "safe"
    | "malware"
    | "spoofed_type"
    | "inappropriate_image"
    | "moderation_unavailable";
};

function startsWith(buffer: Buffer, bytes: number[]) {
  return bytes.every((byte, index) => buffer[index] === byte);
}

export function hasExpectedSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") return startsWith(buffer, [0xff, 0xd8, 0xff]);
  if (mimeType === "image/png")
    return startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (mimeType === "image/gif")
    return (
      buffer.subarray(0, 6).toString("ascii") === "GIF87a" ||
      buffer.subarray(0, 6).toString("ascii") === "GIF89a"
    );
  if (mimeType === "image/webp")
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  if (mimeType === "application/pdf")
    return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  if (mimeType === "application/zip" || mimeType.includes("openxmlformats"))
    return (
      startsWith(buffer, [0x50, 0x4b, 0x03, 0x04]) ||
      startsWith(buffer, [0x50, 0x4b, 0x05, 0x06])
    );
  if (mimeType === "text/plain" || mimeType === "text/csv")
    return !buffer.subarray(0, 1024).includes(0);
  return false;
}

export async function moderateAttachment(
  buffer: Buffer,
  mimeType: string
): Promise<ModerationDecision> {
  if (!hasExpectedSignature(buffer, mimeType)) {
    return {
      allowed: false,
      reason: "A assinatura real do arquivo não corresponde ao tipo declarado.",
      category: "spoofed_type",
    };
  }

  if (!mimeType.startsWith("image/")) {
    return {
      allowed: false,
      reason:
        "Arquivos não visuais estão temporariamente bloqueados até a conexão de um scanner antimalware confiável.",
      category: "malware",
    };
  }

  try {
    const response = await invokeLLM({
      model: "gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content:
            "Você é um moderador de imagens para uma plataforma de comunidade. Bloqueie imagens sexualmente explícitas, qualquer sexualização de menores, nudez explícita, violência gráfica extrema, exploração, símbolos de ódio usados para promover ódio, automutilação explícita e instruções visuais de fabricação de armas ou drogas. Não bloqueie arte, cosplay, ficção, violência não gráfica ou conteúdo médico não explícito apenas por existir. Responda somente no schema JSON.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Classifique esta imagem para exibição em um chat público.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${buffer.toString("base64")}`,
                detail: "low",
              },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "attachment_moderation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              safe: { type: "boolean" },
              category: {
                type: "string",
                enum: [
                  "safe",
                  "sexual_explicit",
                  "sexual_minors",
                  "graphic_violence",
                  "hate",
                  "self_harm",
                  "weapons_or_drugs",
                ],
              },
              reason: { type: "string" },
            },
            required: ["safe", "category", "reason"],
            additionalProperties: false,
          },
        },
      },
    });
    const content = response.choices[0]?.message?.content;
    const parsed =
      typeof content === "string"
        ? (JSON.parse(content) as {
            safe: boolean;
            category: string;
            reason: string;
          })
        : null;
    if (!parsed || typeof parsed.safe !== "boolean")
      throw new Error("Invalid moderation response");
    return parsed.safe
      ? {
          allowed: true,
          reason: "Imagem aprovada para exibição.",
          category: "safe",
        }
      : {
          allowed: false,
          reason:
            "A imagem foi bloqueada pela política de segurança da comunidade.",
          category: "inappropriate_image",
        };
  } catch (error) {
    console.error("[AttachmentModeration] Vision moderation failed:", error);
    return {
      allowed: false,
      reason:
        "Não foi possível concluir a análise de segurança da imagem. Tente novamente.",
      category: "moderation_unavailable",
    };
  }
}
