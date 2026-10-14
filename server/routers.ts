import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import { createLocalUser, getUserByEmail, getUserByOpenId } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { verifyPassword } from "./_core/password";
import { sdk } from "./_core/sdk";
import { publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { siteBuilderRouter } from "./routers/siteBuilder";

const passwordSchema = z.string().min(8, "A senha deve ter ao menos 8 caracteres");
const emailSchema = z.string().email("Informe um e-mail válido");

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    login: publicProcedure
      .input(z.object({ email: emailSchema, password: z.string().min(1, "Informe a senha") }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByEmail(input.email);
        // Uniform error so we never reveal whether an email exists.
        if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha inválidos" });
        }
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name ?? "",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        const fresh = await getUserByOpenId(user.openId);
        return { success: true as const, user: fresh ?? user };
      }),
    register: publicProcedure
      .input(
        z.object({
          name: z.string().min(1, "Informe seu nome"),
          email: emailSchema,
          password: passwordSchema,
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const user = await createLocalUser(input.name, input.email, input.password);
        if (!user) {
          throw new TRPCError({ code: "CONFLICT", message: "Este e-mail já está em uso" });
        }
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name ?? "",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true as const, user };
      }),
  }),
  siteBuilder: siteBuilderRouter,
});

export type AppRouter = typeof appRouter;
