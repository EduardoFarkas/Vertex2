import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  cloneProjectForUser,
  createProjectForUser,
  createProjectPageForUser,
  createTagForUser,
  deleteProjectForUser,
  deleteProjectPageForUser,
  getPageSeoForUser,
  getPageDocumentForUser,
  listAssetsForUser,
  listFormSubmissionsForUser,
  listErrorsForUser,
  listPageVersionsForUser,
  listProjectPagesForUser,
  listProjectsForUser,
  listTagsForUser,
  publishPageForUser,
  restorePageVersionForUser,
  savePageDocumentForUser,
  updatePageSeoForUser,
  updateFormSubmissionStatusForUser,
  recordErrorForUser,
  uploadAssetForUser,
} from "../db";
import { PROJECT_TEMPLATE_IDS } from "../projectTemplates";
import { UploadValidationError } from "../uploadValidation";
import { protectedProcedure, router } from "../_core/trpc";

const projectInput = z.object({ name: z.string().trim().min(2).max(180), templateId: z.enum(PROJECT_TEMPLATE_IDS).optional() });
const projectIdInput = z.object({ projectId: z.number().int().positive() });
const pageInput = z.object({ pageId: z.number().int().positive() });
const artifactInput = z.object({ html: z.string().max(1_000_000).optional(), css: z.string().max(1_000_000).optional() });
const pageSeoInput = pageInput.extend({
  seoTitle: z.string().trim().max(180).nullable().optional(),
  seoDescription: z.string().trim().max(320).nullable().optional(),
  faviconUrl: z.string().url().max(1_024).nullable().optional(),
  openGraphImageUrl: z.string().url().max(1_024).nullable().optional(),
});
const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"] as const;

export const siteBuilderRouter = router({
  listErrorLogs: protectedProcedure.query(({ ctx }) => listErrorsForUser(ctx.user.id)),
  reportClientError: protectedProcedure.input(z.object({ action: z.string().trim().min(1).max(80), route: z.string().trim().max(255), code: z.string().trim().min(1).max(80) })).mutation(async ({ ctx, input }) => {
    try { return { requestId: await recordErrorForUser(ctx.user.id, { ...input, message: "Erro inesperado na interface. Consulte o ID de suporte." }) }; }
    catch { throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível registrar o erro agora." }); }
  }),
  overview: protectedProcedure.query(({ ctx }) => listProjectsForUser(ctx.user.id, ctx.user.name)),
  createProject: protectedProcedure.input(projectInput).mutation(({ ctx, input }) => createProjectForUser(ctx.user.id, ctx.user.name, input.name, input.templateId)),
  cloneProject: protectedProcedure.input(projectIdInput).mutation(async ({ ctx, input }) => {
    const project = await cloneProjectForUser(ctx.user.id, input.projectId);
    if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Projeto não encontrado" });
    return project;
  }),
  deleteProject: protectedProcedure.input(projectIdInput).mutation(async ({ ctx, input }) => {
    const project = await deleteProjectForUser(ctx.user.id, input.projectId);
    if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Projeto não encontrado" });
    return project;
  }),
  listProjectPages: protectedProcedure.input(projectIdInput).query(async ({ ctx, input }) => {
    const projectPages = await listProjectPagesForUser(ctx.user.id, input.projectId);
    if (!projectPages) throw new TRPCError({ code: "NOT_FOUND", message: "Projeto não encontrado" });
    return projectPages;
  }),
  createProjectPage: protectedProcedure.input(projectIdInput.extend({ name: z.string().trim().min(2).max(120) })).mutation(async ({ ctx, input }) => {
    const page = await createProjectPageForUser(ctx.user.id, input.projectId, input.name);
    if (!page) throw new TRPCError({ code: "NOT_FOUND", message: "Projeto não encontrado" });
    return page;
  }),
  deleteProjectPage: protectedProcedure.input(projectIdInput.extend({ pageId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const result = await deleteProjectPageForUser(ctx.user.id, input.projectId, input.pageId);
    if (result.deleted) return result;
    if (result.reason === "home_page") throw new TRPCError({ code: "BAD_REQUEST", message: "A página inicial não pode ser excluída" });
    throw new TRPCError({ code: "NOT_FOUND", message: "Página não encontrada" });
  }),
  getPageDocument: protectedProcedure.input(pageInput).query(async ({ ctx, input }) => {
    const document = await getPageDocumentForUser(ctx.user.id, input.pageId);
    if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Página não encontrada" });
    return document;
  }),
  getPageSeo: protectedProcedure.input(pageInput).query(async ({ ctx, input }) => {
    const seo = await getPageSeoForUser(ctx.user.id, input.pageId);
    if (!seo) throw new TRPCError({ code: "NOT_FOUND", message: "Página não encontrada" });
    return seo;
  }),
  updatePageSeo: protectedProcedure.input(pageSeoInput).mutation(async ({ ctx, input }) => {
    const { pageId, ...seoInput } = input;
    const seo = await updatePageSeoForUser(ctx.user.id, pageId, seoInput);
    if (!seo) throw new TRPCError({ code: "NOT_FOUND", message: "Página não encontrada" });
    return seo;
  }),
  savePageDocument: protectedProcedure.input(pageInput.extend({ schema: z.unknown() }).merge(artifactInput)).mutation(async ({ ctx, input }) => {
    const version = await savePageDocumentForUser(ctx.user.id, input.pageId, input.schema, input.html, input.css);
    if (!version) throw new TRPCError({ code: "NOT_FOUND", message: "Página não encontrada" });
    return version;
  }),
  listVersions: protectedProcedure.input(pageInput).query(async ({ ctx, input }) => {
    const versions = await listPageVersionsForUser(ctx.user.id, input.pageId);
    if (!versions) throw new TRPCError({ code: "NOT_FOUND", message: "Página não encontrada" });
    return versions;
  }),
  restoreVersion: protectedProcedure.input(pageInput.extend({ versionId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const restored = await restorePageVersionForUser(ctx.user.id, input.pageId, input.versionId);
    if (!restored) throw new TRPCError({ code: "NOT_FOUND", message: "Versão não encontrada" });
    return restored;
  }),
  publishPage: protectedProcedure.input(pageInput.merge(artifactInput)).mutation(async ({ ctx, input }) => {
    const publication = await publishPageForUser(ctx.user.id, input.pageId, input.html, input.css);
    if (!publication) throw new TRPCError({ code: "NOT_FOUND", message: "Não há versão para publicar" });
    return publication;
  }),
  listAssets: protectedProcedure.query(({ ctx }) => listAssetsForUser(ctx.user.id, ctx.user.name)),
  listFormSubmissions: protectedProcedure.input(z.object({ projectId: z.number().int().positive().optional() }).optional()).query(({ ctx, input }) => listFormSubmissionsForUser(ctx.user.id, ctx.user.name, input?.projectId)),
  updateFormSubmissionStatus: protectedProcedure.input(z.object({ submissionId: z.number().int().positive(), status: z.enum(["new", "in_review", "qualified"]) })).mutation(async ({ ctx, input }) => {
    const submission = await updateFormSubmissionStatusForUser(ctx.user.id, input.submissionId, input.status);
    if (!submission) throw new TRPCError({ code: "NOT_FOUND", message: "Lead não encontrado" });
    return submission;
  }),
  uploadAsset: protectedProcedure.input(z.object({ filename: z.string().trim().min(1).max(255), mimeType: z.enum(allowedMimeTypes), base64: z.string().min(4).max(28_000_000), width: z.number().int().positive().max(20_000).optional(), height: z.number().int().positive().max(20_000).optional() })).mutation(async ({ ctx, input }) => {
    try {
      return await uploadAssetForUser(ctx.user.id, ctx.user.name, input);
    } catch (error) {
      if (error instanceof UploadValidationError) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "O armazenamento não conseguiu concluir o envio. Verifique sua conexão e tente novamente." });
    }
  }),
  listTags: protectedProcedure.query(({ ctx }) => listTagsForUser(ctx.user.id, ctx.user.name)),
  createTag: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(80), color: z.string().regex(/^#[0-9a-fA-F]{6}$/) })).mutation(({ ctx, input }) => createTagForUser(ctx.user.id, ctx.user.name, input.name, input.color)),
});
