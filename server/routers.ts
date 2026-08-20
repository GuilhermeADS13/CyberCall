import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createCommunity, createDirectMessage, createMessage, createRoomInvite, deleteMessage, getCommunityOverview, getOwnedAttachment, isCommunityMember, listCommunities, listDirectMessages, listMessages, listNotifications, listRoomInvites, markNotificationRead, respondRoomInvite, toggleMessageReaction, updateMessage } from "./db";

const attachmentInput = z.object({ id: z.number().int().positive(), key: z.string().min(1).max(512), url: z.string().startsWith("/manus-storage/").max(768), name: z.string().min(1).max(255), mimeType: z.string().min(1).max(120), size: z.number().int().positive().max(10 * 1024 * 1024) }).optional();

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  roomInvite: router({
    list: protectedProcedure.query(({ ctx }) => listRoomInvites(ctx.user.id)),
    create: protectedProcedure.input(z.object({ recipientId: z.number().int().positive(), communityId: z.number().int().positive(), roomKey: z.string().trim().min(1).max(160), roomName: z.string().trim().min(1).max(120) })).mutation(async ({ ctx, input }) => { if (ctx.user.role !== "admin" && !(await isCommunityMember(input.communityId, ctx.user.id))) throw new TRPCError({ code: "FORBIDDEN", message: "Você precisa ser membro da comunidade para emitir convites." }); return createRoomInvite(ctx.user.id, input.recipientId, input.communityId, input.roomKey, input.roomName); }),
    respond: protectedProcedure.input(z.object({ inviteId: z.number().int().positive(), status: z.enum(["accepted", "declined"]) })).mutation(async ({ ctx, input }) => {
      try { return await respondRoomInvite(input.inviteId, ctx.user.id, input.status); }
      catch (error) {
        if (error instanceof Error && error.message.includes("not found")) throw new TRPCError({ code: "NOT_FOUND", message: "Convite não encontrado." });
        if (error instanceof Error && (error.message.includes("already") || error.message.includes("expired"))) throw new TRPCError({ code: "BAD_REQUEST", message: "Este convite não está mais disponível." });
        throw error;
      }
    }),
  }),

  notification: router({
    list: protectedProcedure.query(({ ctx }) => listNotifications(ctx.user.id)),
    markRead: protectedProcedure.input(z.object({ notificationId: z.number().int().positive() })).mutation(({ ctx, input }) => markNotificationRead(input.notificationId, ctx.user.id)),
  }),

  message: router({
    update: protectedProcedure.input(z.object({ messageId: z.number().int().positive(), body: z.string().trim().min(1).max(4000) })).mutation(async ({ ctx, input }) => {
      try { return await updateMessage(input.messageId, ctx.user.id, input.body); }
      catch (error) { if (error instanceof Error && error.message.startsWith("Only")) throw new TRPCError({ code: "FORBIDDEN", message: "Somente o autor pode editar esta mensagem." }); throw error; }
    }),
    delete: protectedProcedure.input(z.object({ messageId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      try { return await deleteMessage(input.messageId, ctx.user.id); }
      catch (error) { if (error instanceof Error && error.message.startsWith("Only")) throw new TRPCError({ code: "FORBIDDEN", message: "Somente o autor pode excluir esta mensagem." }); throw error; }
    }),
    toggleReaction: protectedProcedure.input(z.object({ messageId: z.number().int().positive(), emoji: z.string().min(1).max(16) })).mutation(({ ctx, input }) => toggleMessageReaction(input.messageId, ctx.user.id, input.emoji)),
  }),

  directMessage: router({
    list: protectedProcedure.input(z.object({ otherUserId: z.number().int().positive() })).query(({ ctx, input }) => listDirectMessages(ctx.user.id, input.otherUserId)),
    send: protectedProcedure.input(z.object({ recipientId: z.number().int().positive(), body: z.string().trim().min(1).max(4000), attachment: attachmentInput })).mutation(async ({ ctx, input }) => {
      const attachment = input.attachment ? await getOwnedAttachment(input.attachment.id, ctx.user.id) : undefined;
      if (input.attachment && !attachment) throw new TRPCError({ code: "FORBIDDEN", message: "Este anexo não pertence à sua sessão." });
      return createDirectMessage(ctx.user.id, input.recipientId, input.body, attachment);
    }),
  }),

  community: router({
    list: publicProcedure.query(() => listCommunities()),
    overview: publicProcedure.input(z.object({ communityId: z.number().int().positive() })).query(({ input }) => getCommunityOverview(input.communityId)),
    messages: publicProcedure.input(z.object({ channelId: z.number().int().positive() })).query(({ ctx, input }) => listMessages(input.channelId, ctx.user?.id ?? 0)),
    create: protectedProcedure.input(z.object({ name: z.string().min(2).max(120), description: z.string().max(500).optional() })).mutation(({ ctx, input }) => createCommunity(ctx.user.id, input.name, input.description)),
    sendMessage: protectedProcedure.input(z.object({ communityId: z.number().int().positive(), channelId: z.number().int().positive(), body: z.string().trim().min(1).max(4000), attachment: attachmentInput })).mutation(async ({ ctx, input }) => {
      const member = await isCommunityMember(input.communityId, ctx.user.id);
      if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Você precisa entrar nesta comunidade." });
      const attachment = input.attachment ? await getOwnedAttachment(input.attachment.id, ctx.user.id) : undefined;
      if (input.attachment && !attachment) throw new TRPCError({ code: "FORBIDDEN", message: "Este anexo não pertence à sua sessão." });
      return createMessage(input.channelId, ctx.user.id, input.body, attachment);
    }),
  }),
});

export type AppRouter = typeof appRouter;
