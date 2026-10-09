import { afterEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import express from "express";
import { createServer } from "http";
import { users, workspaceMembers } from "../drizzle/schema";
import { findInlineDataImages, replaceInlineDataImages } from "../client/src/lib/inlineMedia";
import { cloneProjectForUser, createProjectForUser, createProjectPageForUser, createPublicLeadSubmission, deleteProjectForUser, deleteProjectPageForUser, getDb, getPageDocumentForUser, getPageSeoForUser, getPublishedProjectBySlug, listAssetsForUser, listFormSubmissionsForUser, listProjectPagesForUser, listProjectsForUser, publishPageForUser, restorePageVersionForUser, savePageDocumentForUser, updateFormSubmissionStatusForUser, updatePageSeoForUser, uploadAssetForUser } from "./db";
import { registerPublishedSiteRoutes } from "./publishedSite";

const testOpenId = `site-builder-test-${Date.now()}`;
const viewerOpenId = `${testOpenId}-viewer`;

afterEach(async () => {
  const db = await getDb();
  if (db) await db.delete(users).where(eq(users.openId, testOpenId));
  if (db) await db.delete(users).where(eq(users.openId, viewerOpenId));
});

describe("site builder persistence", () => {
  it("creates, opens, versions and publishes a page for its owner", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();
    if (!db) return;

    const [userResult] = await db.insert(users).values({
      openId: testOpenId,
      name: "Integration Test",
      email: "integration-test@vertexechad.invalid",
      loginMethod: "test",
      role: "user",
    });
    const userId = Number(userResult.insertId);

    const project = await createProjectForUser(userId, "Integration Test", "Projeto de validação");
    const [viewerResult] = await db.insert(users).values({ openId: viewerOpenId, name: "Viewer Test", role: "user" });
    const viewerId = Number(viewerResult.insertId);
    await db.insert(workspaceMembers).values({ workspaceId: project.workspaceId, userId: viewerId, permission: "viewer" });
    expect(await getPageDocumentForUser(viewerId, project.pageId)).not.toBeNull();
    expect(await savePageDocumentForUser(viewerId, project.pageId, { unauthorized: true }, "<main>não autorizado</main>")).toBeNull();
    expect(await publishPageForUser(viewerId, project.pageId)).toBeNull();
    expect(await deleteProjectForUser(viewerId, project.id)).toBeNull();
    expect(project.templateId).toBeNull();
    expect(project.html).toBeUndefined();
    const templateProject = await createProjectForUser(userId, "Integration Test", "Projeto editorial", "editorial");
    expect(templateProject).toMatchObject({ templateId: "editorial", html: expect.stringContaining("Projeto editorial"), css: expect.any(String) });
    const templateDocument = await getPageDocumentForUser(userId, templateProject.pageId);
    expect(templateDocument?.version).toMatchObject({ html: expect.stringContaining("vertex-editorial"), css: expect.stringContaining("vertex-editorial__hero"), schema: expect.objectContaining({ kind: "vertex-template-document", templateId: "editorial" }) });
    const aboutPage = await createProjectPageForUser(userId, project.id, "Sobre nós");
    expect(aboutPage).toMatchObject({ name: "Sobre nós", path: "/sobre-nos", isHome: false });
    const pagesBeforeDeletion = await listProjectPagesForUser(userId, project.id);
    expect(pagesBeforeDeletion?.pages).toHaveLength(2);
    expect(await deleteProjectPageForUser(userId, project.id, project.pageId)).toMatchObject({ deleted: false, reason: "home_page" });
    expect(await deleteProjectPageForUser(userId, project.id, aboutPage!.id)).toMatchObject({ deleted: true, pageId: aboutPage!.id });
    const uploaded = await uploadAssetForUser(userId, "Integration Test", {
      filename: "pixel.png",
      mimeType: "image/png",
      base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL7kgAAAABJRU5ErkJggg==",
      width: 1,
      height: 1,
    });
    expect(uploaded.url).toMatch(/^\/manus-storage\//);
    expect((await listAssetsForUser(userId, "Integration Test")).map((asset) => asset.filename)).toContain("pixel.png");
    const opened = await getPageDocumentForUser(userId, project.pageId);
    expect(opened?.page.projectName).toBe("Projeto de validação");
    expect(opened?.version?.versionNumber).toBe(1);

    const inlineDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL7kgAAAABJRU5ErkJggg==";
    const inlineDocument = {
      schema: { kind: "grapesjs-document", schemaVersion: 1, projectData: { assets: [inlineDataUrl], pages: [{ component: { src: inlineDataUrl } }] } },
      html: `<main><h1>Versão publicada</h1><img src="${inlineDataUrl}" onerror="alert(1)" /><script>alert(2)</script></main>`,
      css: "main{color:#2563eb;background:url(javascript:alert(1));opacity:1}@import url(https://evil.test/x.css);",
    };
    const [inlineImage] = findInlineDataImages(inlineDocument);
    expect(inlineImage).toBeDefined();
    const persistedInlineAsset = await uploadAssetForUser(userId, "Integration Test", inlineImage!);
    const replacements = new Map([[inlineImage!.dataUrl, persistedInlineAsset.url]]);
    const normalizedSchema = replaceInlineDataImages(inlineDocument.schema, replacements);
    const normalizedHtml = replaceInlineDataImages(inlineDocument.html, replacements) as string;
    expect(JSON.stringify({ normalizedSchema, normalizedHtml })).not.toContain("data:image/");
    expect(normalizedHtml).toContain(persistedInlineAsset.url);

    const saved = await savePageDocumentForUser(userId, project.pageId, normalizedSchema, normalizedHtml, inlineDocument.css);
    expect(saved).toMatchObject({ versionNumber: 2, state: "draft" });

    const seo = await updatePageSeoForUser(userId, project.pageId, {
      seoTitle: "Projeto de validação | Vertex Echad",
      seoDescription: "Página publicada para validar SEO e formulário.",
      faviconUrl: persistedInlineAsset.url,
      openGraphImageUrl: persistedInlineAsset.url,
    });
    expect(seo).toMatchObject({ seoTitle: "Projeto de validação | Vertex Echad", faviconUrl: persistedInlineAsset.url });
    expect(await getPageSeoForUser(userId, project.pageId)).toMatchObject({ seoDescription: "Página publicada para validar SEO e formulário." });

    const published = await publishPageForUser(userId, project.pageId, normalizedHtml, inlineDocument.css);
    expect(published).toMatchObject({ versionNumber: 2, url: `/site/${project.slug}` });
    const publicSite = await getPublishedProjectBySlug(project.slug);
    expect(publicSite?.html).toContain("Versão publicada");
    expect(publicSite?.html).not.toMatch(/<script|onerror/i);
    expect(publicSite?.css).toContain("#2563eb");
    expect(publicSite?.css).not.toMatch(/javascript:|@import/i);
    expect(publicSite).toMatchObject({ seoTitle: "Projeto de validação | Vertex Echad", openGraphImageUrl: persistedInlineAsset.url });

    const submission = await createPublicLeadSubmission(project.slug, "/", { formId: "contact", name: "Contato de teste", email: "contato@example.com", message: "Preciso de uma landing page.", payload: { name: "Contato de teste", email: "contato@example.com", message: "Preciso de uma landing page." } });
    expect(submission?.id).toBeTypeOf("number");
    const app = express();
    app.use(express.json());
    registerPublishedSiteRoutes(app);
    const server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    try {
      const response = await fetch(`http://127.0.0.1:${port}/site/${project.slug}/leads`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pagePath: "/", formId: "contact", name: "Contato HTTP", email: "http@example.com", message: "Mensagem enviada pela rota publicada.", payload: { name: "Contato HTTP", email: "http@example.com" } }) });
      expect(response.status).toBe(201);
      expect(await response.json()).toMatchObject({ success: true });
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
    const leads = await listFormSubmissionsForUser(userId, "Integration Test", project.id);
    expect(leads).toEqual(expect.arrayContaining([expect.objectContaining({ id: submission?.id, email: "contato@example.com", status: "new" }), expect.objectContaining({ email: "http@example.com", status: "new" })]));
    expect(await updateFormSubmissionStatusForUser(userId, submission!.id, "qualified")).toEqual({ id: submission!.id, status: "qualified" });

    const contactPage = await createProjectPageForUser(userId, project.id, "Contato");
    expect(contactPage?.path).toBe("/contato");
    await savePageDocumentForUser(userId, contactPage!.id, { kind: "grapesjs-document", schemaVersion: 1, projectData: {} }, "<main><h1>Contato publicado</h1></main>", "main{color:#0f172a}");
    await publishPageForUser(userId, contactPage!.id);
    expect(await getPublishedProjectBySlug(project.slug, "/contato")).toMatchObject({ pagePath: "/contato", html: expect.stringContaining("Contato publicado") });

    const clonedProject = await cloneProjectForUser(userId, project.id);
    expect(clonedProject).toMatchObject({ name: "[CÓPIA] Projeto de validação", status: "draft" });
    const clonedPages = await listProjectPagesForUser(userId, clonedProject!.id);
    expect(clonedPages?.pages).toHaveLength(2);
    expect(clonedPages?.pages.map((page) => page.path)).toEqual(["/", "/contato"]);
    const clonedHome = await getPageDocumentForUser(userId, clonedProject!.pageId!);
    expect(clonedHome?.version).toMatchObject({ versionNumber: 1, html: expect.stringContaining("Versão publicada"), css: expect.stringContaining("#2563eb") });
    expect(await getPageSeoForUser(userId, clonedProject!.pageId!)).toMatchObject({ seoTitle: "Projeto de validação | Vertex Echad", faviconUrl: persistedInlineAsset.url });
    expect((await listProjectsForUser(userId, "Integration Test")).projects.map((item) => item.name)).toContain("[CÓPIA] Projeto de validação");
    expect(await deleteProjectForUser(userId, clonedProject!.id)).toMatchObject({ id: clonedProject!.id, name: "[CÓPIA] Projeto de validação" });
    expect(await listProjectPagesForUser(userId, clonedProject!.id)).toBeNull();

    const restored = await restorePageVersionForUser(userId, project.pageId, project.versionId);
    expect(restored).toMatchObject({ versionNumber: 3, restoredFrom: 1 });
  }, 20_000);
});
