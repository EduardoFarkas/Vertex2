import { index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/** Core identity table managed by Manus OAuth. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const errorLogs = mysqlTable("error_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  requestId: varchar("requestId", { length: 64 }).notNull().unique(),
  action: varchar("action", { length: 80 }).notNull(),
  route: varchar("route", { length: 255 }).notNull(),
  code: varchar("code", { length: 80 }).notNull(),
  message: varchar("message", { length: 500 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("error_log_user_created_idx").on(table.userId, table.createdAt)]);

export const workspaces = mysqlTable("workspaces", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  createdBy: int("createdBy").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const workspaceMembers = mysqlTable("workspace_members", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  permission: mysqlEnum("permission", ["owner", "editor", "viewer"]).default("editor").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("workspace_member_unique").on(table.workspaceId, table.userId),
  index("workspace_member_user_idx").on(table.userId),
]);

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  createdBy: int("createdBy").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("project_workspace_slug_unique").on(table.workspaceId, table.slug),
  index("project_workspace_updated_idx").on(table.workspaceId, table.updatedAt),
]);

export const pages = mysqlTable("pages", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  path: varchar("path", { length: 240 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  seoTitle: varchar("seoTitle", { length: 180 }),
  seoDescription: varchar("seoDescription", { length: 320 }),
  faviconUrl: varchar("faviconUrl", { length: 1024 }),
  openGraphImageUrl: varchar("openGraphImageUrl", { length: 1024 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("page_project_path_unique").on(table.projectId, table.path),
  index("page_project_order_idx").on(table.projectId, table.sortOrder),
]);

export const documentVersions = mysqlTable("document_versions", {
  id: int("id").autoincrement().primaryKey(),
  pageId: int("pageId").notNull().references(() => pages.id, { onDelete: "cascade" }),
  versionNumber: int("versionNumber").notNull(),
  state: mysqlEnum("state", ["draft", "published", "archived"]).default("draft").notNull(),
  schema: json("schema").notNull(),
  html: text("html"),
  css: text("css"),
  createdBy: int("createdBy").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  publishedAt: timestamp("publishedAt"),
}, (table) => [
  uniqueIndex("document_page_version_unique").on(table.pageId, table.versionNumber),
  index("document_page_state_idx").on(table.pageId, table.state),
]);

export const assets = mysqlTable("assets", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  url: varchar("url", { length: 1024 }).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  width: int("width"),
  height: int("height"),
  uploadedBy: int("uploadedBy").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("asset_storage_key_unique").on(table.storageKey),
  index("asset_workspace_created_idx").on(table.workspaceId, table.createdAt),
]);

export const formSubmissions = mysqlTable("form_submissions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  pageId: int("pageId").notNull().references(() => pages.id, { onDelete: "cascade" }),
  formId: varchar("formId", { length: 160 }).default("contact").notNull(),
  name: varchar("name", { length: 180 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 80 }),
  message: text("message"),
  payload: json("payload").notNull(),
  status: mysqlEnum("status", ["new", "in_review", "qualified"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("submission_project_created_idx").on(table.projectId, table.createdAt),
  index("submission_page_created_idx").on(table.pageId, table.createdAt),
]);

export const tags = mysqlTable("tags", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 80 }).notNull(),
  color: varchar("color", { length: 20 }).default("#2563eb").notNull(),
  createdBy: int("createdBy").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("tag_workspace_name_unique").on(table.workspaceId, table.name),
]);

export const projectTags = mysqlTable("project_tags", {
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  tagId: int("tagId").notNull().references(() => tags.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("project_tag_unique").on(table.projectId, table.tagId),
  index("project_tag_tag_idx").on(table.tagId),
]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Workspace = typeof workspaces.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type FormSubmission = typeof formSubmissions.$inferSelect;
