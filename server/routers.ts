import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createCommunity, createMessage, getCommunityOverview, isCommunityMember, listCommunities, listMessages } from "./db";

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

  community: router({
    list: publicProcedure.query(() => listCommunities()),
    overview: publicProcedure.input(z.object({ communityId: z.number().int().positive() })).query(({ input }) => getCommunityOverview(input.communityId)),
    messages: publicProcedure.input(z.object({ channelId: z.number().int().positive() })).query(({ input }) => listMessages(input.channelId)),
    create: protectedProcedure.input(z.object({ name: z.string().min(2).max(120), description: z.string().max(500).optional() })).mutation(({ ctx, input }) => createCommunity(ctx.user.id, input.name, input.description)),
    sendMessage: protectedProcedure.input(z.object({ communityId: z.number().int().positive(), channelId: z.number().int().positive(), body: z.string().trim().min(1).max(4000) })).mutation(async ({ ctx, input }) => {
      const member = await isCommunityMember(input.communityId, ctx.user.id);
      if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Você precisa entrar nesta comunidade." });
      return createMessage(input.channelId, ctx.user.id, input.body);
    }),
  }),
});

export type AppRouter = typeof appRouter;
