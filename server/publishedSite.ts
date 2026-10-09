import type { Express } from "express";
import { createPublicLeadSubmission, getPublishedProjectBySlug } from "./db";
import { sanitizePublishedCss, sanitizePublishedHtml, sanitizePublishedUrl } from "./publishedSanitization";

function escapeTitle(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character] || character);
}

function buildLeadCaptureRuntime(projectSlug: string, pagePath: string) {
  const endpoint = JSON.stringify(`/site/${projectSlug}/leads`);
  const siteBase = JSON.stringify(`/site/${projectSlug}`);
  const currentPath = JSON.stringify(pagePath);
  return `<script>(function(){var siteBase=${siteBase};var pagePath=${currentPath};document.querySelectorAll('a[href^="/"]').forEach(function(link){var href=link.getAttribute('href');if(href&&href.indexOf('/site/')!==0)link.setAttribute('href',siteBase+href);});document.querySelectorAll('form[data-vertex-lead-form]').forEach(function(form){form.addEventListener('submit',async function(event){event.preventDefault();var status=form.querySelector('[data-vertex-form-status]');if(status)status.textContent='Enviando mensagem…';var values=Object.fromEntries(new FormData(form).entries());try{var response=await fetch(${endpoint},{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pagePath:pagePath,formId:form.getAttribute('data-vertex-form-id')||'contact',name:values.name,email:values.email,phone:values.phone,message:values.message,payload:values})});if(!response.ok)throw new Error('Falha no envio');form.reset();if(status)status.textContent='Mensagem recebida. Obrigado pelo contato!';}catch(error){if(status)status.textContent='Não foi possível enviar agora. Tente novamente.';}});});})();</script>`;
}

export function registerPublishedSiteRoutes(app: Express) {
  app.post("/site/:slug/leads", async (req, res, next) => {
    try {
      const body = req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {};
      const email = typeof body.email === "string" ? body.email.trim() : "";
      if (!email || email.length > 320 || !/^\S+@\S+\.\S+$/.test(email)) {
        res.status(400).json({ success: false, message: "Informe um e-mail válido." });
        return;
      }
      const payload = body.payload && typeof body.payload === "object" && !Array.isArray(body.payload) ? body.payload as Record<string, unknown> : {};
      const submission = await createPublicLeadSubmission(req.params.slug, typeof body.pagePath === "string" ? body.pagePath : "/", {
        formId: typeof body.formId === "string" ? body.formId : undefined,
        name: typeof body.name === "string" ? body.name : undefined,
        email,
        phone: typeof body.phone === "string" ? body.phone : undefined,
        message: typeof body.message === "string" ? body.message : undefined,
        payload,
      });
      if (!submission) {
        res.status(404).json({ success: false, message: "Site não encontrado." });
        return;
      }
      res.status(201).json({ success: true, id: submission.id });
    } catch (error) {
      next(error);
    }
  });

  const sendPublishedPage = async (req: Parameters<Express["get"]>[1] extends (req: infer Request, ...args: never[]) => unknown ? Request : never, res: Parameters<Express["get"]>[1] extends (req: never, res: infer Response, ...args: never[]) => unknown ? Response : never, next: (error?: unknown) => void) => {
    try {
      const pagePath = req.params[0] ? `/${req.params[0]}` : "/";
      const project = await getPublishedProjectBySlug(req.params.slug, pagePath);
      if (!project) {
        res.status(404).type("html").send("<!doctype html><title>Site não encontrado</title><h1>Site não encontrado</h1>");
        return;
      }
      const css = sanitizePublishedCss(project.css || "");
      const html = sanitizePublishedHtml(project.html || "");
      const title = project.seoTitle || project.projectName;
      const description = project.seoDescription ? `<meta name="description" content="${escapeTitle(project.seoDescription)}">` : "";
      const faviconUrl = project.faviconUrl ? sanitizePublishedUrl(project.faviconUrl) : null;
      const openGraphImageUrl = project.openGraphImageUrl ? sanitizePublishedUrl(project.openGraphImageUrl) : null;
      const favicon = faviconUrl ? `<link rel="icon" href="${escapeTitle(faviconUrl)}">` : "";
      const openGraph = openGraphImageUrl ? `<meta property="og:image" content="${escapeTitle(openGraphImageUrl)}">` : "";
      res.type("html").send(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeTitle(title)}</title><meta property="og:title" content="${escapeTitle(title)}">${description}${favicon}${openGraph}<style>${css}</style></head><body>${html}${buildLeadCaptureRuntime(project.projectSlug, project.pagePath)}</body></html>`);
    } catch (error) {
      next(error);
    }
  };
  app.get("/site/:slug", sendPublishedPage);
  app.get("/site/:slug/*", sendPublishedPage);
}
