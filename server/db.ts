import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import type { ResultSetHeader } from "mysql2";
import {
  assets,
  documentVersions,
  errorLogs,
  formSubmissions,
  pages,
  projectTags,
  projects,
  tags,
  users,
  workspaceMembers,
  workspaces,
  type InsertUser,
} from "../drizzle/schema";
import { createInitialDocumentSchema, slugify } from "./builderModel";
import { createProjectTemplateDocument, type ProjectTemplateId } from "./projectTemplates";
import { sanitizePublishedCss, sanitizePublishedHtml } from "./publishedSanitization";
import { validateUploadedFile } from "./uploadValidation";
import { ENV } from "./_core/env";
import { storagePut } from "./storage";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db;
}

function insertId(result: unknown) { return Number((result as ResultSetHeader).insertId); }

export async function recordErrorForUser(userId: number, input: { action: string; route: string; code: string; message: string }) {
  const db = await requireDb();
  const requestId = randomUUID();
  await db.insert(errorLogs).values({ userId, requestId, action: input.action.slice(0, 80), route: input.route.slice(0, 255), code: input.code.slice(0, 80), message: input.message.slice(0, 500) });
  return requestId;
}

export async function listErrorsForUser(userId: number, limit = 50) {
  const db = await requireDb();
  return db.select({ requestId: errorLogs.requestId, action: errorLogs.action, route: errorLogs.route, code: errorLogs.code, message: errorLogs.message, createdAt: errorLogs.createdAt }).from(errorLogs).where(eq(errorLogs.userId, userId)).orderBy(desc(errorLogs.createdAt)).limit(Math.min(Math.max(limit, 1), 100));
}

function safeFilename(value: string) { return value.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 180) || "arquivo"; }

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: new Date() };
  for (const field of ["name", "email", "loginMethod"] as const) if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
}

export async function ensurePersonalWorkspace(userId: number, userName?: string | null) {
  const db = await requireDb();
  const personalSlug = `workspace-${userId}`;
  const personalScope = and(eq(workspaceMembers.userId, userId), eq(workspaces.slug, personalSlug));
  const membership = await db.select({ id: workspaces.id, name: workspaces.name, slug: workspaces.slug, permission: workspaceMembers.permission }).from(workspaceMembers).innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id)).where(personalScope).limit(1);
  if (membership[0]) return membership[0];
  const workspaceName = `${(userName?.trim() || "Meu").slice(0, 120)} Workspace`;
  try {
    return await db.transaction(async (tx) => {
      const [existing] = await tx.select({ id: workspaces.id, name: workspaces.name, slug: workspaces.slug, permission: workspaceMembers.permission }).from(workspaceMembers).innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id)).where(personalScope).limit(1);
      if (existing) return existing;
      const slug = `workspace-${userId}`;
      const [workspaceResult] = await tx.insert(workspaces).values({ name: workspaceName, slug, createdBy: userId });
      const workspaceId = insertId(workspaceResult);
      await tx.insert(workspaceMembers).values({ workspaceId, userId, permission: "owner" });
      return { id: workspaceId, name: workspaceName, slug, permission: "owner" as const };
    });
  } catch (error) {
    // Duas primeiras requisições simultâneas podem disputar o slug único. Se a outra já concluiu, reutilize o workspace.
    const [created] = await db.select({ id: workspaces.id, name: workspaces.name, slug: workspaces.slug, permission: workspaceMembers.permission }).from(workspaceMembers).innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id)).where(personalScope).limit(1);
    if (created) return created;
    throw error;
  }
}

export async function listProjectsForUser(userId: number, userName?: string | null) {
  const db = await requireDb();
  const workspace = await ensurePersonalWorkspace(userId, userName);
  const rows = await db.select().from(projects).where(eq(projects.workspaceId, workspace.id)).orderBy(desc(projects.updatedAt));
  const projectIds = rows.map((project) => project.id);
  const pageRows = projectIds.length ? await db.select().from(pages).where(inArray(pages.projectId, projectIds)) : [];
  const tagRows = projectIds.length ? await db.select({ projectId: projectTags.projectId, id: tags.id, name: tags.name, color: tags.color }).from(projectTags).innerJoin(tags, eq(projectTags.tagId, tags.id)).where(inArray(projectTags.projectId, projectIds)) : [];
  return { workspace, projects: rows.map((project) => ({ ...project, pageCount: pageRows.filter((page) => page.projectId === project.id).length, primaryPageId: pageRows.find((page) => page.projectId === project.id)?.id, tags: tagRows.filter((tag) => tag.projectId === project.id).map(({ id, name, color }) => ({ id, name, color })) })) };
}

export async function createProjectForUser(userId: number, userName: string | null | undefined, name: string, templateId?: ProjectTemplateId) {
  const db = await requireDb();
  const workspace = await ensurePersonalWorkspace(userId, userName);
  const slug = `${slugify(name)}-${Date.now().toString(36)}`;
  const initial = templateId ? createProjectTemplateDocument(templateId, name) : { schema: createInitialDocumentSchema(name), html: undefined, css: undefined };
  return db.transaction(async (tx) => {
    const [projectResult] = await tx.insert(projects).values({ workspaceId: workspace.id, name, slug, createdBy: userId, status: "draft" });
    const projectId = insertId(projectResult);
    const [pageResult] = await tx.insert(pages).values({ projectId, name: "Início", path: "/", sortOrder: 0 });
    const pageId = insertId(pageResult);
    const [versionResult] = await tx.insert(documentVersions).values({ pageId, versionNumber: 1, state: "draft", schema: initial.schema, html: initial.html, css: initial.css, createdBy: userId });
    return { id: projectId, workspaceId: workspace.id, name, slug, status: "draft" as const, createdBy: userId, pageId, versionId: insertId(versionResult), schema: initial.schema, html: initial.html, css: initial.css, templateId: templateId ?? null };
  });
}

export async function cloneProjectForUser(userId: number, projectId: number) {
  const db = await requireDb();
  const sourceProject = await getScopedProject(userId, projectId, true);
  if (!sourceProject) return null;

  const sourcePages = await db.select().from(pages).where(eq(pages.projectId, projectId)).orderBy(pages.sortOrder);
  const sourceTags = await db.select({ tagId: projectTags.tagId }).from(projectTags).where(eq(projectTags.projectId, projectId));
  const cloneName = `[CÓPIA] ${sourceProject.name}`.slice(0, 180);
  const cloneSlug = `${slugify(cloneName)}-${Date.now().toString(36)}`.slice(0, 200);

  return db.transaction(async (tx) => {
    const [projectResult] = await tx.insert(projects).values({
      workspaceId: sourceProject.workspaceId,
      name: cloneName,
      slug: cloneSlug,
      status: "draft",
      createdBy: userId,
    });
    const cloneProjectId = insertId(projectResult);
    let primaryPageId: number | null = null;

    for (const sourcePage of sourcePages) {
      const [pageResult] = await tx.insert(pages).values({
        projectId: cloneProjectId,
        name: sourcePage.name,
        path: sourcePage.path,
        sortOrder: sourcePage.sortOrder,
        seoTitle: sourcePage.seoTitle,
        seoDescription: sourcePage.seoDescription,
        faviconUrl: sourcePage.faviconUrl,
        openGraphImageUrl: sourcePage.openGraphImageUrl,
      });
      const clonedPageId = insertId(pageResult);
      if (sourcePage.path === "/" || primaryPageId === null) primaryPageId = clonedPageId;

      const latestVersion = (await tx.select().from(documentVersions).where(eq(documentVersions.pageId, sourcePage.id)).orderBy(desc(documentVersions.versionNumber)).limit(1))[0];
      if (latestVersion) {
        await tx.insert(documentVersions).values({
          pageId: clonedPageId,
          versionNumber: 1,
          state: "draft",
          schema: latestVersion.schema,
          html: latestVersion.html,
          css: latestVersion.css,
          createdBy: userId,
        });
      } else {
        await tx.insert(documentVersions).values({
          pageId: clonedPageId,
          versionNumber: 1,
          state: "draft",
          schema: createInitialDocumentSchema(`${cloneName} — ${sourcePage.name}`),
          createdBy: userId,
        });
      }
    }

    if (sourceTags.length) await tx.insert(projectTags).values(sourceTags.map(({ tagId }) => ({ projectId: cloneProjectId, tagId })));
    return { id: cloneProjectId, workspaceId: sourceProject.workspaceId, name: cloneName, slug: cloneSlug, status: "draft" as const, createdBy: userId, pageId: primaryPageId };
  });
}

export async function deleteProjectForUser(userId: number, projectId: number) {
  const db = await requireDb();
  const project = await getScopedProject(userId, projectId, true);
  if (!project) return null;
  await db.delete(projects).where(eq(projects.id, projectId));
  return { id: projectId, name: project.name };
}

async function getScopedProject(userId: number, projectId: number, requireWrite = false) {
  const db = await requireDb();
  const project = await db.select({ id: projects.id, name: projects.name, workspaceId: projects.workspaceId, permission: workspaceMembers.permission }).from(projects).innerJoin(workspaceMembers, and(eq(workspaceMembers.workspaceId, projects.workspaceId), eq(workspaceMembers.userId, userId))).where(eq(projects.id, projectId)).limit(1);
  if (!project[0] || (requireWrite && project[0].permission === "viewer")) return null;
  return project[0];
}

export async function listProjectPagesForUser(userId: number, projectId: number) {
  const db = await requireDb();
  const project = await getScopedProject(userId, projectId);
  if (!project) return null;
  const pageRows = await db.select().from(pages).where(eq(pages.projectId, projectId)).orderBy(pages.sortOrder);
  return { project, pages: pageRows.map((page) => ({ ...page, isHome: page.path === "/" })) };
}

export async function createProjectPageForUser(userId: number, projectId: number, name: string) {
  const db = await requireDb();
  const project = await getScopedProject(userId, projectId, true);
  if (!project) return null;
  const existing = await db.select().from(pages).where(eq(pages.projectId, projectId)).orderBy(desc(pages.sortOrder));
  const basePath = `/${slugify(name) || "pagina"}`;
  let path = basePath;
  let suffix = 2;
  while (existing.some((page) => page.path === path)) { path = `${basePath}-${suffix}`; suffix += 1; }
  const sortOrder = (existing[0]?.sortOrder ?? -1) + 1;
  const [pageResult] = await db.insert(pages).values({ projectId, name, path, sortOrder });
  const pageId = insertId(pageResult);
  const schema = createInitialDocumentSchema(`${project.name} — ${name}`);
  const [versionResult] = await db.insert(documentVersions).values({ pageId, versionNumber: 1, state: "draft", schema, createdBy: userId });
  return { id: pageId, projectId, name, path, sortOrder, isHome: false, versionId: insertId(versionResult) };
}

export async function deleteProjectPageForUser(userId: number, projectId: number, pageId: number) {
  const db = await requireDb();
  const project = await getScopedProject(userId, projectId, true);
  if (!project) return { deleted: false as const, reason: "not_found" as const };
  const target = (await db.select().from(pages).where(and(eq(pages.id, pageId), eq(pages.projectId, projectId))).limit(1))[0];
  if (!target) return { deleted: false as const, reason: "not_found" as const };
  if (target.path === "/") return { deleted: false as const, reason: "home_page" as const };
  await db.delete(pages).where(eq(pages.id, pageId));
  return { deleted: true as const, pageId };
}

async function getScopedPage(userId: number, pageId: number, requireWrite = false) {
  const db = await requireDb();
  const result = await db.select({ pageId: pages.id, pageName: pages.name, pagePath: pages.path, projectId: projects.id, projectName: projects.name, projectSlug: projects.slug, workspaceId: projects.workspaceId, permission: workspaceMembers.permission }).from(pages).innerJoin(projects, eq(pages.projectId, projects.id)).innerJoin(workspaceMembers, and(eq(workspaceMembers.workspaceId, projects.workspaceId), eq(workspaceMembers.userId, userId))).where(eq(pages.id, pageId)).limit(1);
  if (!result[0] || (requireWrite && result[0].permission === "viewer")) return null;
  return result[0];
}

export async function getPageDocumentForUser(userId: number, pageId: number) {
  const db = await requireDb();
  const page = await getScopedPage(userId, pageId);
  if (!page) return null;
  const version = (await db.select().from(documentVersions).where(eq(documentVersions.pageId, pageId)).orderBy(desc(documentVersions.versionNumber)).limit(1))[0] ?? null;
  return { page, version };
}

export async function getPageSeoForUser(userId: number, pageId: number) {
  const db = await requireDb();
  const scopedPage = await getScopedPage(userId, pageId);
  if (!scopedPage) return null;
  const seo = (await db.select({ seoTitle: pages.seoTitle, seoDescription: pages.seoDescription, faviconUrl: pages.faviconUrl, openGraphImageUrl: pages.openGraphImageUrl }).from(pages).where(eq(pages.id, pageId)).limit(1))[0];
  return { page: scopedPage, ...seo };
}

export async function updatePageSeoForUser(userId: number, pageId: number, input: { seoTitle?: string | null; seoDescription?: string | null; faviconUrl?: string | null; openGraphImageUrl?: string | null }) {
  const db = await requireDb();
  const scopedPage = await getScopedPage(userId, pageId, true);
  if (!scopedPage) return null;
  await db.update(pages).set(input).where(eq(pages.id, pageId));
  return getPageSeoForUser(userId, pageId);
}

export async function savePageDocumentForUser(userId: number, pageId: number, schema: unknown, html?: string, css?: string) {
  const db = await requireDb();
  const page = await getScopedPage(userId, pageId, true);
  if (!page) return null;
  return db.transaction(async (tx) => {
    await tx.select({ id: pages.id }).from(pages).where(eq(pages.id, pageId)).for("update");
    const latest = await tx.select().from(documentVersions).where(eq(documentVersions.pageId, pageId)).orderBy(desc(documentVersions.versionNumber)).limit(1);
    const versionNumber = (latest[0]?.versionNumber ?? 0) + 1;
    const [result] = await tx.insert(documentVersions).values({ pageId, versionNumber, state: "draft", schema, html: html?.slice(0, 1_000_000), css: css?.slice(0, 1_000_000), createdBy: userId });
    return { id: insertId(result), versionNumber, state: "draft" as const };
  });
}

export async function listPageVersionsForUser(userId: number, pageId: number) {
  const db = await requireDb();
  const page = await getScopedPage(userId, pageId);
  if (!page) return null;
  return db.select({ id: documentVersions.id, versionNumber: documentVersions.versionNumber, state: documentVersions.state, createdAt: documentVersions.createdAt, publishedAt: documentVersions.publishedAt }).from(documentVersions).where(eq(documentVersions.pageId, pageId)).orderBy(desc(documentVersions.versionNumber));
}

export async function restorePageVersionForUser(userId: number, pageId: number, versionId: number) {
  const db = await requireDb();
  const page = await getScopedPage(userId, pageId, true);
  if (!page) return null;
  const source = (await db.select().from(documentVersions).where(and(eq(documentVersions.id, versionId), eq(documentVersions.pageId, pageId))).limit(1))[0];
  if (!source) return null;
  const latest = await db.select().from(documentVersions).where(eq(documentVersions.pageId, pageId)).orderBy(desc(documentVersions.versionNumber)).limit(1);
  const versionNumber = (latest[0]?.versionNumber ?? 0) + 1;
  const [result] = await db.insert(documentVersions).values({ pageId, versionNumber, state: "draft", schema: source.schema, html: source.html, css: source.css, createdBy: userId });
  return { id: insertId(result), versionNumber, restoredFrom: source.versionNumber };
}

export async function publishPageForUser(userId: number, pageId: number, html?: string, css?: string) {
  const db = await requireDb();
  const page = await getScopedPage(userId, pageId, true);
  if (!page) return null;
  return db.transaction(async (tx) => {
    await tx.select({ id: pages.id }).from(pages).where(eq(pages.id, pageId)).for("update");
    const latest = (await tx.select().from(documentVersions).where(eq(documentVersions.pageId, pageId)).orderBy(desc(documentVersions.versionNumber)).limit(1))[0];
    if (!latest) return null;
    const publishedHtml = sanitizePublishedHtml(html ?? latest.html ?? `<main><h1>${page.projectName}</h1></main>`);
    const publishedCss = sanitizePublishedCss(css ?? latest.css ?? "body{font-family:Inter,Arial,sans-serif;margin:0;padding:48px;color:#1d1d1f}");
    await tx.update(documentVersions).set({ state: "archived" }).where(and(eq(documentVersions.pageId, pageId), eq(documentVersions.state, "published")));
    await tx.update(documentVersions).set({ state: "published", publishedAt: new Date(), html: publishedHtml, css: publishedCss }).where(eq(documentVersions.id, latest.id));
    await tx.update(projects).set({ status: "published" }).where(eq(projects.id, page.projectId));
    return { versionId: latest.id, versionNumber: latest.versionNumber, url: `/site/${page.projectSlug}${page.pagePath === "/" ? "" : page.pagePath}` };
  });
}

export async function getPublishedProjectBySlug(slug: string, pagePath = "/") {
  const db = await requireDb();
  const path = `/${pagePath.replace(/^\/+/, "").replace(/\/+$/, "")}`.replace(/\/$/, "") || "/";
  const page = (await db.select({ projectId: projects.id, projectName: projects.name, projectSlug: projects.slug, pageId: pages.id, pagePath: pages.path, seoTitle: pages.seoTitle, seoDescription: pages.seoDescription, faviconUrl: pages.faviconUrl, openGraphImageUrl: pages.openGraphImageUrl }).from(projects).innerJoin(pages, eq(pages.projectId, projects.id)).where(and(eq(projects.slug, slug), eq(projects.status, "published"), eq(pages.path, path))).limit(1))[0];
  if (!page) return null;
  const version = (await db.select({ html: documentVersions.html, css: documentVersions.css, versionNumber: documentVersions.versionNumber, publishedAt: documentVersions.publishedAt }).from(documentVersions).where(and(eq(documentVersions.pageId, page.pageId), eq(documentVersions.state, "published"))).orderBy(desc(documentVersions.versionNumber)).limit(1))[0];
  if (!version?.html) return null;
  return { ...page, ...version };
}

export async function createPublicLeadSubmission(projectSlug: string, pagePath: string, input: { formId?: string; name?: string; email?: string; phone?: string; message?: string; payload?: Record<string, unknown> }) {
  const db = await requireDb();
  const path = `/${pagePath.replace(/^\/+/, "").replace(/\/+$/, "")}`.replace(/\/$/, "") || "/";
  const page = (await db.select({ projectId: projects.id, pageId: pages.id }).from(projects).innerJoin(pages, eq(pages.projectId, projects.id)).where(and(eq(projects.slug, projectSlug), eq(projects.status, "published"), eq(pages.path, path))).limit(1))[0];
  if (!page) return null;
  const cleanValue = (value: unknown, maxLength: number) => typeof value === "string" ? value.trim().slice(0, maxLength) : undefined;
  const payload = Object.fromEntries(Object.entries(input.payload || {}).filter(([key, value]) => key.length <= 80 && typeof value === "string").map(([key, value]) => [key, cleanValue(value, 2_000) || ""]));
  const [result] = await db.insert(formSubmissions).values({
    projectId: page.projectId,
    pageId: page.pageId,
    formId: cleanValue(input.formId, 160) || "contact",
    name: cleanValue(input.name, 180),
    email: cleanValue(input.email, 320),
    phone: cleanValue(input.phone, 80),
    message: cleanValue(input.message, 10_000),
    payload,
  });
  return { id: insertId(result) };
}

export async function listFormSubmissionsForUser(userId: number, userName?: string | null, projectId?: number) {
  const db = await requireDb();
  const workspace = await ensurePersonalWorkspace(userId, userName);
  const scope = projectId ? and(eq(projects.workspaceId, workspace.id), eq(projects.id, projectId)) : eq(projects.workspaceId, workspace.id);
  return db.select({ id: formSubmissions.id, projectId: formSubmissions.projectId, projectName: projects.name, pageId: formSubmissions.pageId, pageName: pages.name, formId: formSubmissions.formId, name: formSubmissions.name, email: formSubmissions.email, phone: formSubmissions.phone, message: formSubmissions.message, payload: formSubmissions.payload, status: formSubmissions.status, createdAt: formSubmissions.createdAt }).from(formSubmissions).innerJoin(projects, eq(formSubmissions.projectId, projects.id)).innerJoin(pages, eq(formSubmissions.pageId, pages.id)).where(scope).orderBy(desc(formSubmissions.createdAt));
}

export async function updateFormSubmissionStatusForUser(userId: number, submissionId: number, status: "new" | "in_review" | "qualified") {
  const db = await requireDb();
  const submission = (await db.select({ id: formSubmissions.id }).from(formSubmissions).innerJoin(projects, eq(formSubmissions.projectId, projects.id)).innerJoin(workspaceMembers, and(eq(workspaceMembers.workspaceId, projects.workspaceId), eq(workspaceMembers.userId, userId))).where(and(eq(formSubmissions.id, submissionId), inArray(workspaceMembers.permission, ["owner", "editor"]))).limit(1))[0];
  if (!submission) return null;
  await db.update(formSubmissions).set({ status }).where(eq(formSubmissions.id, submissionId));
  return { id: submissionId, status };
}

export async function listAssetsForUser(userId: number, userName?: string | null) {
  const db = await requireDb();
  const workspace = await ensurePersonalWorkspace(userId, userName);
  return db.select().from(assets).where(eq(assets.workspaceId, workspace.id)).orderBy(desc(assets.createdAt));
}

export async function uploadAssetForUser(userId: number, userName: string | null | undefined, input: { filename: string; mimeType: string; base64: string; width?: number; height?: number }) {
  const db = await requireDb();
  const workspace = await ensurePersonalWorkspace(userId, userName);
  const bytes = Buffer.from(input.base64, "base64");
  validateUploadedFile(bytes, input.mimeType);
  const filename = safeFilename(input.filename);
  const { key, url } = await storagePut(`workspaces/${workspace.id}/assets/${filename}`, bytes, input.mimeType);
  const [result] = await db.insert(assets).values({ workspaceId: workspace.id, storageKey: key, url, filename, mimeType: input.mimeType, sizeBytes: bytes.length, width: input.width, height: input.height, uploadedBy: userId });
  return { id: insertId(result), storageKey: key, url, filename, mimeType: input.mimeType, sizeBytes: bytes.length, width: input.width ?? null, height: input.height ?? null };
}

export async function listTagsForUser(userId: number, userName?: string | null) {
  const db = await requireDb();
  const workspace = await ensurePersonalWorkspace(userId, userName);
  return db.select().from(tags).where(eq(tags.workspaceId, workspace.id)).orderBy(tags.name);
}

export async function createTagForUser(userId: number, userName: string | null | undefined, name: string, color: string) {
  const db = await requireDb();
  const workspace = await ensurePersonalWorkspace(userId, userName);
  const [result] = await db.insert(tags).values({ workspaceId: workspace.id, name, color, createdBy: userId });
  return { id: insertId(result), name, color, workspaceId: workspace.id };
}
