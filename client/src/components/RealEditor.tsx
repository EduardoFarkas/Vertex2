import grapesjs, { type Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, Code2, Download, Eye, FilePlus2, FileText, History, ImagePlus, Link2, Loader2, Monitor, MousePointer2, Redo2, RotateCcw, Save, Smartphone, Tablet, Trash2, Undo2, Unlink2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { findInlineDataImages, replaceInlineDataImages } from "@/lib/inlineMedia";
import { SITE_BLOCKS } from "@/lib/siteBlocks";
import { createStaticSiteZip } from "@/lib/siteExport";
import { getMissingProjectDataArtifacts, resolveEditorDocumentLoadPlan } from "@/lib/editorDocument";

type Snapshot = { schema: unknown; html: string; css: string };
type AssetItem = { id: number; url: string; filename: string; mimeType: string };

const starterHtml = '<main class="vertex-page"><section class="vertex-hero"><div class="vertex-container"><span class="vertex-kicker">VERTEX ECHAD · STUDIO</span><h1>Forma antes da <em>superfície.</em></h1><p>Edite esta página diretamente no canvas. Selecione qualquer elemento para ajustar as propriedades à direita.</p><a class="vertex-button" href="#">Começar projeto</a></div></section></main>';
const starterCss = '.vertex-page{font-family:Inter,Arial,sans-serif;color:#0f172a;background:#f8fafc;min-height:100vh}.vertex-hero{padding:112px 0;background:#fff}.vertex-container{max-width:1100px;margin:0 auto;padding:0 40px}.vertex-kicker{color:#2563eb;font-size:11px;letter-spacing:.16em;font-weight:700}.vertex-hero h1{max-width:760px;font-size:clamp(48px,8vw,110px);line-height:.92;letter-spacing:-.06em;margin:28px 0}.vertex-hero h1 em{color:#2563eb;font-style:normal}.vertex-hero p{max-width:440px;color:#64748b;font-size:18px;line-height:1.6}.vertex-button{display:inline-block;margin-top:26px;padding:14px 20px;background:#0f172a;color:#fff;text-decoration:none;border-radius:7px;font-weight:700}@keyframes vertexFadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes vertexSlideUp{from{opacity:0;transform:translateY(34px)}to{opacity:1;transform:translateY(0)}}@keyframes vertexZoom{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}.vertex-motion-fade{animation:vertexFadeIn .6s ease-out both}.vertex-motion-slide{animation:vertexSlideUp .6s ease-out both}.vertex-motion-zoom{animation:vertexZoom .6s ease-out both}';
const animationClassNames = ["vertex-motion-fade", "vertex-motion-slide", "vertex-motion-zoom"];
type EditorDevice = "desktop" | "tablet" | "mobile";
type SelectedEditorComponent = NonNullable<ReturnType<Editor["getSelected"]>>;
const responsiveMediaByDevice: Record<EditorDevice, string | null> = { desktop: null, tablet: "(max-width: 992px)", mobile: "(max-width: 480px)" };
const responsiveStyleProperties = ["color", "background-color", "font-family", "font-size", "font-weight", "letter-spacing", "line-height", "text-align", "padding-top", "padding-right", "padding-bottom", "padding-left", "margin-top", "margin-right", "margin-bottom", "margin-left", "gap", "display", "position", "width", "min-height", "max-width", "flex-direction", "flex-wrap", "justify-content", "align-items", "align-content", "flex-grow", "flex-shrink", "flex-basis", "grid-template-columns", "grid-template-rows", "grid-column", "grid-row", "justify-items", "place-items", "border", "border-radius", "box-shadow", "opacity"];

function dataUrlToBase64(value: string) { return value.split(",", 2)[1] ?? ""; }
function userFacingError(error: unknown, fallback: string) {
  const code = (error as { data?: { code?: string }; shape?: { data?: { code?: string } } } | null)?.data?.code ?? (error as { shape?: { data?: { code?: string } } } | null)?.shape?.data?.code;
  if (code === "INTERNAL_SERVER_ERROR" || code === "TIMEOUT") return `${fallback} O servidor não concluiu a operação. Tente novamente e consulte “Registros de erro” se persistir.`;
  if (code === "UNAUTHORIZED") return "Sua sessão expirou. Entre novamente para continuar.";
  if (error instanceof Error && error.message && !/internal server error|failed to fetch|network error/i.test(error.message)) return error.message;
  return `${fallback} Verifique sua conexão e os dados informados e tente novamente.`;
}
function getSnapshot(editor: Editor): Snapshot { return { schema: { kind: "grapesjs-document", schemaVersion: 1, projectData: editor.getProjectData() }, html: editor.getHtml(), css: editor.getCss() ?? "" }; }
function insertAsset(editor: Editor | null, asset: AssetItem) {
  if (!editor) return;
  if (asset.mimeType.startsWith("image/")) editor.addComponents(`<img src="${asset.url}" alt="${asset.filename}" style="display:block;max-width:100%;height:auto" />`);
  else editor.addComponents(`<a href="${asset.url}" target="_blank" rel="noreferrer" style="display:inline-block;padding:12px 14px;border:1px solid #cbd5e1;border-radius:6px;color:#2563eb;text-decoration:none">${asset.filename}</a>`);
}

export function RealEditor({ pageId, projectName }: { pageId: number | null; projectName: string }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const blocksRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const loadedPageRef = useRef<number | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const deviceRef = useRef<EditorDevice>("desktop");
  const responsiveIsolationRef = useRef(false);
  const responsiveSyncRef = useRef(false);
  const [selectedName, setSelectedName] = useState("Nenhum elemento selecionado");
  const [editorReady, setEditorReady] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [device, setDevice] = useState<EditorDevice>("desktop");
  const [isDeviceStyleIsolated, setIsDeviceStyleIsolated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showNewPage, setShowNewPage] = useState(false);
  const [showMobilePages, setShowMobilePages] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [linkMode, setLinkMode] = useState<"page" | "anchor">("page");
  const [linkValue, setLinkValue] = useState("");
  const [anchorId, setAnchorId] = useState("");
  const [animation, setAnimation] = useState("");
  const trpcUtils = trpc.useUtils();
  const pageQuery = trpc.siteBuilder.getPageDocument.useQuery({ pageId: pageId ?? 1 }, { enabled: pageId !== null, retry: false });
  const projectId = pageQuery.data?.page.projectId ?? null;
  const assetsQuery = trpc.siteBuilder.listAssets.useQuery(undefined, { enabled: pageId !== null });
  const versionsQuery = trpc.siteBuilder.listVersions.useQuery({ pageId: pageId ?? 1 }, { enabled: pageId !== null });
  const projectPagesQuery = trpc.siteBuilder.listProjectPages.useQuery({ projectId: projectId ?? 1 }, { enabled: projectId !== null });
  const seoQuery = trpc.siteBuilder.getPageSeo.useQuery({ pageId: pageId ?? 1 }, { enabled: pageId !== null });
  const saveMutation = trpc.siteBuilder.savePageDocument.useMutation();
  const publishMutation = trpc.siteBuilder.publishPage.useMutation();
  const restoreMutation = trpc.siteBuilder.restoreVersion.useMutation();
  const uploadMutation = trpc.siteBuilder.uploadAsset.useMutation();
  const createPageMutation = trpc.siteBuilder.createProjectPage.useMutation();
  const deletePageMutation = trpc.siteBuilder.deleteProjectPage.useMutation();
  const updateSeoMutation = trpc.siteBuilder.updatePageSeo.useMutation();
  const initialDocument = useMemo(() => pageQuery.data?.version, [pageQuery.data?.version]);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [openGraphImageUrl, setOpenGraphImageUrl] = useState("");

  const getResponsiveSelector = (component: SelectedEditorComponent) => {
    const existingKey = component.getAttributes()["data-vertex-responsive-id"];
    const key = typeof existingKey === "string" && existingKey ? existingKey : `vertex-responsive-${component.getId()}`;
    if (key !== existingKey) component.addAttributes({ "data-vertex-responsive-id": key });
    return `[data-vertex-responsive-id="${key}"]`;
  };
  const getComputedResponsiveStyle = (component: SelectedEditorComponent) => {
    const editor = editorRef.current;
    const selector = getResponsiveSelector(component);
    const element = editor?.Canvas.getDocument()?.querySelector(selector);
    const editorWindow = editor?.Canvas.getWindow();
    if (!element || !editorWindow) return component.getStyle();
    const computed = editorWindow.getComputedStyle(element);
    return Object.fromEntries(responsiveStyleProperties.map((property) => [property, computed.getPropertyValue(property)]).filter(([, value]) => Boolean(value)));
  };
  const refreshResponsiveIsolation = () => {
    const editor = editorRef.current;
    const selected = editor?.getSelected();
    const mediaText = responsiveMediaByDevice[deviceRef.current];
    if (!editor || !selected || !mediaText) { responsiveIsolationRef.current = false; setIsDeviceStyleIsolated(false); return; }
    const rule = editor.Css.getRule(getResponsiveSelector(selected), { atRuleType: "media", atRuleParams: mediaText });
    const isolated = Boolean(rule && Object.keys(rule.getStyle()).length);
    responsiveIsolationRef.current = isolated;
    setIsDeviceStyleIsolated(isolated);
  };
  const synchronizeCurrentDeviceStyle = (component: SelectedEditorComponent) => {
    const editor = editorRef.current;
    const mediaText = responsiveMediaByDevice[deviceRef.current];
    if (!editor || !mediaText || responsiveIsolationRef.current || responsiveSyncRef.current) return;
    const deviceRules = editor.Css.getComponentRules(component, { mediaText });
    if (!deviceRules.length) return;
    responsiveSyncRef.current = true;
    try {
      const deviceStyle = Object.assign({}, ...deviceRules.map((rule) => rule.getStyle()));
      if (Object.keys(deviceStyle).length) editor.Css.setRule(getResponsiveSelector(component), deviceStyle, { addStyles: true });
      deviceRules.forEach((rule) => editor.Css.remove(rule));
      editor.trigger("update");
    } finally {
      window.setTimeout(() => { responsiveSyncRef.current = false; }, 0);
    }
  };
  const toggleResponsiveIsolation = () => {
    const editor = editorRef.current;
    const selected = editor?.getSelected();
    const mediaText = responsiveMediaByDevice[deviceRef.current];
    if (!editor || !selected || !mediaText) { toast.error("Selecione um elemento e use Tablet ou Mobile para criar um estilo próprio."); return; }
    const selector = getResponsiveSelector(selected);
    if (isDeviceStyleIsolated) {
      const customRule = editor.Css.getRule(selector, { atRuleType: "media", atRuleParams: mediaText });
      if (customRule) editor.Css.remove(customRule);
      const componentRules = editor.Css.getComponentRules(selected, { mediaText });
      componentRules.forEach((rule) => editor.Css.remove(rule));
      responsiveIsolationRef.current = false;
      setIsDeviceStyleIsolated(false);
      toast.success("Estilo compartilhado ativado: mudanças futuras serão sincronizadas entre dispositivos.");
    } else {
      window.requestAnimationFrame(() => {
        editor.Css.setRule(selector, getComputedResponsiveStyle(selected), { atRuleType: "media", atRuleParams: mediaText, addStyles: true });
        responsiveIsolationRef.current = true;
        setIsDeviceStyleIsolated(true);
        editor.trigger("update");
        toast.success("Estilo próprio ativado: este dispositivo preservará sua aparência atual.");
      });
    }
  };

  useEffect(() => {
    if (!pageId || pageQuery.isLoading || !canvasRef.current || !blocksRef.current || !styleRef.current) return;
    if (loadedPageRef.current === pageId && editorRef.current) return;
    editorRef.current?.destroy();
    loadedPageRef.current = pageId;
    const editor = grapesjs.init({
      container: canvasRef.current,
      height: "100%",
      fromElement: false,
      storageManager: false,
      avoidInlineStyle: true,
      panels: { defaults: [] },
      blockManager: {
        appendTo: blocksRef.current,
        blocks: SITE_BLOCKS.map((block) => ({ id: block.id, label: block.label, category: block.category, content: block.html })),
      },
      styleManager: { appendTo: styleRef.current, sectors: [
        { name: "Layout e espaçamento", open: true, buildProps: ["display", "position", "width", "min-height", "max-width", "padding", "margin", "gap"] },
        { name: "Flexbox", open: true, buildProps: ["flex-direction", "flex-wrap", "justify-content", "align-items", "align-content", "flex-grow", "flex-shrink", "flex-basis"] },
        { name: "Grid", open: false, buildProps: ["grid-template-columns", "grid-template-rows", "grid-column", "grid-row", "justify-items", "align-items", "place-items"] },
        { name: "Tipografia", open: true, buildProps: ["font-family", "font-size", "font-weight", "letter-spacing", "color", "line-height", "text-align"] },
        { name: "Aparência", open: false, buildProps: ["background", "background-color", "background-image", "border", "border-radius", "box-shadow", "opacity"] },
      ] },
      deviceManager: { devices: [{ id: "desktop", name: "Desktop", width: "" }, { id: "tablet", name: "Tablet", width: "768px", widthMedia: "992px" }, { id: "mobile", name: "Mobile", width: "390px", widthMedia: "480px" }] },
      canvas: { styles: ["https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"] },
    });
    const loadPlan = resolveEditorDocumentLoadPlan(initialDocument, { html: starterHtml, css: starterCss });
    if (loadPlan.mode === "project-data") {
      editor.loadProjectData(loadPlan.projectData);
      // O projectData é a fonte de verdade do GrapesJS: ele mantém componentes e
      // regras CSS por breakpoint. HTML/CSS separados só entram como fallback quando
      // algum artefato não foi restaurado, evitando apagar media queries responsivas.
      const missingArtifacts = getMissingProjectDataArtifacts({ html: editor.getHtml(), css: editor.getCss() || "" }, loadPlan);
      if (missingArtifacts.html) editor.setComponents(missingArtifacts.html);
      if (missingArtifacts.css) editor.setStyle(missingArtifacts.css);
    } else {
      editor.setComponents(loadPlan.html);
      editor.setStyle(loadPlan.css);
    }
    const syncSnapshot = () => setSnapshot(getSnapshot(editor));
    const syncSelection = () => {
      const selected = editor.getSelected();
      const attributes = selected?.getAttributes?.() || {};
      setSelectedName(selected ? selected.getName?.() || selected.get("tagName") || "Elemento" : "Nenhum elemento selecionado");
      setLinkValue(typeof attributes.href === "string" ? attributes.href : "");
      setAnchorId(typeof attributes.id === "string" ? attributes.id : "");
      window.requestAnimationFrame(refreshResponsiveIsolation);
    };
    const handleStyleUpdate = (component: SelectedEditorComponent) => synchronizeCurrentDeviceStyle(component);
    editor.on("update", syncSnapshot);
    editor.on("component:selected", syncSelection);
    editor.on("component:deselected", syncSelection);
    editor.on("component:styleUpdate", handleStyleUpdate);
    setSnapshot(getSnapshot(editor));
    syncSelection();
    editorRef.current = editor;
    setEditorReady(true);
    return () => { editor.off("component:styleUpdate", handleStyleUpdate); editor.destroy(); editorRef.current = null; setEditorReady(false); };
  }, [initialDocument?.id, initialDocument?.schema, initialDocument?.html, initialDocument?.css, pageId, pageQuery.isLoading]);

  useEffect(() => {
    if (!editorRef.current || !assetsQuery.data) return;
    editorRef.current.AssetManager.add(assetsQuery.data.map((asset) => ({ src: asset.url, name: asset.filename, type: asset.mimeType.startsWith("image/") ? "image" : "file" })));
  }, [assetsQuery.data]);

  useEffect(() => {
    if (!seoQuery.data) return;
    setSeoTitle(seoQuery.data.seoTitle || "");
    setSeoDescription(seoQuery.data.seoDescription || "");
    setFaviconUrl(seoQuery.data.faviconUrl || "");
    setOpenGraphImageUrl(seoQuery.data.openGraphImageUrl || "");
  }, [seoQuery.data]);

  if (!pageId) return <div className="real-editor-empty"><Code2 size={24} /><strong>Selecione um projeto para iniciar o editor.</strong><span>Crie ou abra um projeto na área Projetos para carregar sua página.</span></div>;
  if (pageQuery.isLoading) return <div className="real-editor-empty"><Loader2 size={24} className="spin" /><strong>Carregando o documento</strong><span>Recuperando a versão mais recente da página.</span></div>;
  if (pageQuery.isError) return <div className="real-editor-empty"><Code2 size={24} /><strong>Não foi possível abrir esta página.</strong><span>{userFacingError(pageQuery.error, "Confira se o projeto ainda existe e se sua conta tem acesso.")}</span></div>;

  const prepareSnapshotForPersistence = async (): Promise<Snapshot> => {
    const editor = editorRef.current;
    if (!editor) throw new Error("Editor ainda não está pronto");
    const currentSnapshot = getSnapshot(editor);
    const inlineImages = findInlineDataImages(currentSnapshot);
    if (!inlineImages.length) return currentSnapshot;
    const replacements = new Map<string, string>();
    for (const image of inlineImages) {
      if (image.sizeBytes > 20 * 1024 * 1024) throw new Error(`A imagem inline ${image.filename} excede o limite de 20 MB.`);
      const asset = await uploadMutation.mutateAsync({ filename: image.filename, mimeType: image.mimeType, base64: image.base64 });
      replacements.set(image.dataUrl, asset.url);
    }
    const normalised = { schema: replaceInlineDataImages(currentSnapshot.schema, replacements), html: replaceInlineDataImages(currentSnapshot.html, replacements) as string, css: replaceInlineDataImages(currentSnapshot.css, replacements) as string };
    const schema = normalised.schema as { kind?: string; projectData?: Record<string, unknown> };
    if (schema.kind === "grapesjs-document" && schema.projectData) editor.loadProjectData(schema.projectData);
    setSnapshot(normalised);
    await trpcUtils.siteBuilder.listAssets.invalidate();
    return normalised;
  };
  const saveCurrent = async () => {
    if (!pageId) throw new Error("Editor ainda não está pronto");
    const preparedSnapshot = await prepareSnapshotForPersistence();
    const version = await saveMutation.mutateAsync({ pageId, ...preparedSnapshot });
    return { preparedSnapshot, version };
  };
  const navigateToPage = (nextPageId: number) => { setShowMobilePages(false); window.location.assign(`/?view=editor&page=${nextPageId}`); };
  const handleCreatePage = async () => {
    if (!projectId || newPageName.trim().length < 2) { toast.error("Informe um nome com pelo menos 2 caracteres."); return; }
    const toastId = toast.loading("Criando nova página…");
    try { const page = await createPageMutation.mutateAsync({ projectId, name: newPageName.trim() }); toast.success("Página criada no projeto.", { id: toastId }); navigateToPage(page.id); }
    catch (error) { toast.error(userFacingError(error, "Não foi possível criar a página."), { id: toastId }); }
  };
  const handleDeletePage = async (targetPageId: number, name: string, isHome: boolean) => {
    if (!projectId || isHome) { toast.error("A página inicial não pode ser excluída."); return; }
    if (!window.confirm(`Excluir a página “${name}”? Esta ação remove as versões associadas.`)) return;
    const toastId = toast.loading("Excluindo página…");
    try { await deletePageMutation.mutateAsync({ projectId, pageId: targetPageId }); const homePage = projectPagesQuery.data?.pages.find((page) => page.isHome); toast.success("Página excluída do projeto.", { id: toastId }); if (targetPageId === pageId && homePage) navigateToPage(homePage.id); else await projectPagesQuery.refetch(); }
    catch (error) { toast.error(userFacingError(error, "Não foi possível excluir esta página."), { id: toastId }); }
  };
  const handleSave = async () => {
    setIsSaving(true); const toastId = toast.loading("Salvando uma nova versão…");
    try { const { version } = await saveCurrent(); await Promise.all([trpcUtils.siteBuilder.getPageDocument.invalidate({ pageId }), trpcUtils.siteBuilder.listVersions.invalidate({ pageId }), trpcUtils.siteBuilder.overview.invalidate()]); toast.success(`Versão ${version.versionNumber} salva no workspace.`, { id: toastId }); }
    catch (error) { toast.error(userFacingError(error, "Não foi possível salvar a versão."), { id: toastId }); }
    finally { setIsSaving(false); }
  };
  const handlePublish = async () => {
    setIsPublishing(true); const toastId = toast.loading("Gerando HTML/CSS e publicando…");
    try { const { preparedSnapshot } = await saveCurrent(); const published = await publishMutation.mutateAsync({ pageId, html: preparedSnapshot.html, css: preparedSnapshot.css }); await Promise.all([trpcUtils.siteBuilder.getPageDocument.invalidate({ pageId }), trpcUtils.siteBuilder.listVersions.invalidate({ pageId }), trpcUtils.siteBuilder.overview.invalidate()]); toast.success("Versão publicada com sucesso.", { id: toastId, action: { label: "Abrir site", onClick: () => window.open(published.url, "_blank", "noopener,noreferrer") } }); }
    catch (error) { toast.error(userFacingError(error, "Não foi possível publicar a versão."), { id: toastId }); }
    finally { setIsPublishing(false); }
  };
  const handleExport = async () => {
    if (!editorRef.current) return;
    setIsExporting(true);
    const toastId = toast.loading("Montando o site estático…");
    try {
      const document = getSnapshot(editorRef.current);
      const exported = await createStaticSiteZip({
        projectName,
        html: document.html,
        css: document.css,
        metadata: { title: seoTitle, description: seoDescription, faviconUrl, openGraphImageUrl },
        assets: (assetsQuery.data ?? []).map((asset) => ({ url: asset.url, filename: asset.filename, mimeType: asset.mimeType })),
      });
      const url = URL.createObjectURL(exported.blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = exported.fileName;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      toast.success(exported.warnings.length ? "ZIP exportado; algumas mídias mantiveram URL remota." : "Site estático ZIP exportado.", { id: toastId });
    } catch (error) { toast.error(userFacingError(error, "Não foi possível exportar o site."), { id: toastId }); }
    finally { setIsExporting(false); }
  };
  const handleSaveSeo = async () => {
    const toastId = toast.loading("Salvando configurações SEO…");
    try {
      await updateSeoMutation.mutateAsync({
        pageId,
        seoTitle: seoTitle.trim() || null,
        seoDescription: seoDescription.trim() || null,
        faviconUrl: faviconUrl || null,
        openGraphImageUrl: openGraphImageUrl || null,
      });
      await seoQuery.refetch();
      toast.success("Configurações SEO salvas.", { id: toastId });
    } catch (error) {
      toast.error(userFacingError(error, "Não foi possível salvar as configurações SEO."), { id: toastId });
    }
  };
  const handleRestore = async (versionId: number, versionNumber: number) => {
    const toastId = toast.loading(`Restaurando a versão ${versionNumber}…`);
    try { const restored = await restoreMutation.mutateAsync({ pageId, versionId }); loadedPageRef.current = null; await Promise.all([pageQuery.refetch(), trpcUtils.siteBuilder.listVersions.invalidate({ pageId })]); toast.success(`Versão ${restored.versionNumber} criada a partir da versão ${versionNumber}.`, { id: toastId }); }
    catch (error) { toast.error(userFacingError(error, "Não foi possível restaurar a versão."), { id: toastId }); }
  };
  const handleUpload = async (file?: File) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error("Escolha um arquivo de até 20 MB."); return; }
    const reader = new FileReader();
    reader.onload = async () => { const toastId = toast.loading(`Enviando ${file.name}…`); try { const asset = await uploadMutation.mutateAsync({ filename: file.name, mimeType: file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "application/pdf", base64: dataUrlToBase64(String(reader.result)) }); await trpcUtils.siteBuilder.listAssets.invalidate(); insertAsset(editorRef.current, asset); toast.success("Mídia enviada e adicionada ao projeto.", { id: toastId }); } catch (error) { toast.error(userFacingError(error, "Não foi possível enviar este arquivo."), { id: toastId }); } };
    reader.onerror = () => toast.error("O navegador não conseguiu ler o arquivo. Verifique se ele ainda está disponível e tente novamente.");
    reader.readAsDataURL(file);
  };
  const updateSelectedAttributes = (attributes: Record<string, string>) => {
    const selected = editorRef.current?.getSelected();
    if (!selected) { toast.error("Selecione um elemento no canvas primeiro."); return false; }
    selected.addAttributes(attributes); editorRef.current?.trigger("update"); return true;
  };
  const applyLink = () => {
    const href = linkMode === "anchor" ? `#${linkValue.replace(/^#/, "")}` : linkValue;
    if (!href) { toast.error("Escolha uma página ou informe uma âncora."); return; }
    if (updateSelectedAttributes({ href })) toast.success("Vínculo aplicado ao elemento selecionado.");
  };
  const applyAnchorId = () => {
    const id = anchorId.replace(/[^a-zA-Z0-9_-]/g, "");
    if (!id) { toast.error("Informe um identificador de âncora válido."); return; }
    if (updateSelectedAttributes({ id })) { setAnchorId(id); toast.success("Âncora aplicada ao elemento selecionado."); }
  };
  const applyAnimation = (value: string) => {
    setAnimation(value);
    const selected = editorRef.current?.getSelected();
    if (!selected) { toast.error("Selecione um elemento no canvas primeiro."); return; }
    selected.removeClass(animationClassNames);
    if (value) selected.addClass(`vertex-motion-${value}`);
    editorRef.current?.addStyle(starterCss);
    editorRef.current?.trigger("update");
    toast.success(value ? "Animação aplicada ao elemento selecionado." : "Animação removida.");
  };
  const setCanvasDevice = (nextDevice: EditorDevice) => {
    editorRef.current?.setDevice(nextDevice);
    deviceRef.current = nextDevice;
    setDevice(nextDevice);
    window.requestAnimationFrame(refreshResponsiveIsolation);
  };
  const renderSeoPanel = () => <section className="real-seo-panel"><span className="micro-label">SEO da página</span><input value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} placeholder="Título da página" maxLength={180} aria-label="Título SEO" /><textarea value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} placeholder="Meta description" maxLength={320} aria-label="Meta description" rows={3} /><label>Favicon<select value={faviconUrl} onChange={(event) => setFaviconUrl(event.target.value)}><option value="">Sem favicon</option>{assetsQuery.data?.filter((asset) => asset.mimeType.startsWith("image/")).map((asset) => <option key={asset.id} value={asset.url}>{asset.filename}</option>)}</select></label><label>Imagem OpenGraph<select value={openGraphImageUrl} onChange={(event) => setOpenGraphImageUrl(event.target.value)}><option value="">Sem imagem</option>{assetsQuery.data?.filter((asset) => asset.mimeType.startsWith("image/")).map((asset) => <option key={asset.id} value={asset.url}>{asset.filename}</option>)}</select></label><button className="real-tool-action" onClick={() => void handleSaveSeo()} disabled={updateSeoMutation.isPending}>{updateSeoMutation.isPending ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Salvar SEO</button></section>;
  const renderPages = () => <div className="real-editor-pages"><div className="real-pages-heading"><span className="micro-label">Páginas</span><button onClick={() => setShowNewPage((value) => !value)} aria-label="Criar página"><FilePlus2 size={15} /></button></div>{showNewPage && <div className="real-new-page"><input autoFocus value={newPageName} onChange={(event) => setNewPageName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void handleCreatePage(); }} placeholder="Nome da página" /><button onClick={() => void handleCreatePage()} disabled={createPageMutation.isPending}>{createPageMutation.isPending ? <Loader2 size={13} className="spin" /> : "Criar"}</button></div>}<div className="real-page-list">{projectPagesQuery.data?.pages.map((page) => <div key={page.id} className={`real-page-item ${page.id === pageId ? "active" : ""}`}><button onClick={() => navigateToPage(page.id)}><FileText size={14} /><span>{page.name}</span><small>{page.path}</small></button><button className="real-page-delete" disabled={page.isHome || deletePageMutation.isPending} onClick={() => void handleDeletePage(page.id, page.name, page.isHome)} aria-label={`Excluir ${page.name}`} title={page.isHome ? "A página inicial é protegida" : `Excluir ${page.name}`}><Trash2 size={13} /></button></div>) || <span className="real-empty-note">Carregando páginas…</span>}</div></div>;

  return <div className="real-editor-shell">
    <header className="real-editor-toolbar">
      <div className="real-editor-crumb"><span>Projetos</span><ChevronLeft size={14} /><strong>{projectName}</strong><span>· {pageQuery.data?.page.pageName || "Página"}</span></div>
      <div className="real-editor-devices" aria-label="Visualização responsiva"><button onClick={() => setCanvasDevice("desktop")} className={device === "desktop" ? "active" : ""} aria-label="Desktop" aria-pressed={device === "desktop"}><Monitor size={15} /></button><button onClick={() => setCanvasDevice("tablet")} className={device === "tablet" ? "active" : ""} aria-label="Tablet" aria-pressed={device === "tablet"}><Tablet size={15} /></button><button onClick={() => setCanvasDevice("mobile")} className={device === "mobile" ? "active" : ""} aria-label="Mobile" aria-pressed={device === "mobile"}><Smartphone size={15} /></button></div>
      <div className="real-editor-actions"><button className="button button-outline mobile-pages-toggle" onClick={() => setShowMobilePages((value) => !value)} aria-expanded={showMobilePages} aria-controls="mobile-page-manager"><FileText size={15} /><span>Páginas</span></button><button className="button button-outline compact-on-mobile" onClick={() => editorRef.current?.UndoManager.undo()}><Undo2 size={15} /> Desfazer</button><button className="button button-outline compact-on-mobile" onClick={() => editorRef.current?.UndoManager.redo()}><Redo2 size={15} /> Refazer</button><button className="button button-outline compact-on-mobile" onClick={() => editorRef.current?.runCommand("preview")}><Eye size={15} /> Prévia</button><button className="button button-outline export-button" disabled={!editorReady || isExporting} onClick={() => void handleExport()}>{isExporting ? <Loader2 size={15} className="spin" /> : <Download size={15} />} Exportar Site (ZIP)</button><button className="button button-outline" disabled={!editorReady || isSaving} onClick={handleSave}>{isSaving ? <Loader2 size={15} className="spin" /> : <Save size={15} />} Salvar</button><button className="button button-dark" disabled={!editorReady || isPublishing} onClick={handlePublish}>{isPublishing ? <Loader2 size={15} className="spin" /> : <CheckCircle2 size={15} />} Publicar</button></div>
    </header>
    {showMobilePages && <section id="mobile-page-manager" className="real-mobile-pages" aria-label="Gerenciar páginas do projeto"><div className="real-mobile-pages-card"><div className="real-mobile-pages-head"><div><span className="micro-label">Estrutura do site</span><strong>Páginas do projeto</strong></div><button onClick={() => setShowMobilePages(false)} aria-label="Fechar gerenciador de páginas"><X size={17} /></button></div>{renderPages()}</div></section>}
    <div className="real-editor-grid">
      <aside className="real-editor-left">{renderPages()}<div className="real-blocks"><span className="micro-label">Blocos arrastáveis</span><p className="real-blocks-hint">Arraste layouts Flex/Grid, textos, imagens e botões para o canvas.</p><div ref={blocksRef} className="grapes-block-manager" /></div><div className="real-editor-media"><span className="micro-label">Mídia do cliente</span><input ref={uploadRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" hidden onChange={(event) => { void handleUpload(event.target.files?.[0]); event.currentTarget.value = ""; }} /><button className="media-upload-button" onClick={() => uploadRef.current?.click()} disabled={uploadMutation.isPending}>{uploadMutation.isPending ? <Loader2 size={15} className="spin" /> : <UploadCloud size={15} />} Enviar arquivo</button><div className="real-asset-list">{assetsQuery.data?.length ? assetsQuery.data.map((asset) => <button key={asset.id} onClick={() => insertAsset(editorRef.current, asset)}><ImagePlus size={14} /><span>{asset.filename}</span></button>) : <span className="real-empty-note">Nenhuma mídia enviada.</span>}</div></div></aside>
      <main className="real-editor-canvas"><div ref={canvasRef} className="grapes-canvas" /></main>
      <aside className="real-editor-right"><div className="real-selection"><MousePointer2 size={15} /><span>Selecionado</span><strong>{selectedName}</strong></div><div className="real-responsive-note"><span>Breakpoint ativo</span><strong>{device === "desktop" ? "Desktop · estilo base" : device === "tablet" ? "Tablet · até 992 px" : "Mobile · até 480 px"}</strong><small>{device === "desktop" ? "O Desktop é a fonte dos estilos compartilhados." : isDeviceStyleIsolated ? "Estilo próprio ativo: este dispositivo não receberá mudanças do Desktop." : "Estilo compartilhado: mudanças feitas aqui serão sincronizadas entre dispositivos."}</small>{device !== "desktop" && <button className={`real-responsive-toggle ${isDeviceStyleIsolated ? "is-isolated" : ""}`} onClick={toggleResponsiveIsolation}>{isDeviceStyleIsolated ? <Unlink2 size={13} /> : <Link2 size={13} />}{isDeviceStyleIsolated ? "Usar estilo compartilhado" : "Criar estilo próprio"}</button>}</div><div className="real-inspector-tools"><span className="micro-label">Vínculos e movimento</span><div className="real-link-mode"><button className={linkMode === "page" ? "active" : ""} onClick={() => setLinkMode("page")}>Página</button><button className={linkMode === "anchor" ? "active" : ""} onClick={() => setLinkMode("anchor")}>Âncora</button></div>{linkMode === "page" ? <select value={linkValue} onChange={(event) => setLinkValue(event.target.value)} aria-label="Vincular a página"><option value="">Selecionar página</option>{projectPagesQuery.data?.pages.map((page) => <option key={page.id} value={page.path}>{page.name} · {page.path}</option>)}</select> : <input value={linkValue.replace(/^#/, "")} onChange={(event) => setLinkValue(event.target.value)} placeholder="contato" aria-label="Nome da âncora" />}<button className="real-tool-action" onClick={applyLink}><Link2 size={14} /> Aplicar vínculo</button><div className="real-anchor-row"><input value={anchorId} onChange={(event) => setAnchorId(event.target.value)} placeholder="id da seção" aria-label="Identificador da âncora" /><button onClick={applyAnchorId}>Definir</button></div><label className="real-motion-control">Animação<select value={animation} onChange={(event) => applyAnimation(event.target.value)}><option value="">Sem animação</option><option value="fade">Fade in</option><option value="slide">Slide up</option><option value="zoom">Zoom</option></select></label></div>{renderSeoPanel()}<div className="grapes-inspector" ref={styleRef} /><div className="real-versions"><div><History size={15} /><span>Histórico</span></div>{versionsQuery.data?.slice(0, 6).map((version) => <button key={version.id} className={version.state === "published" ? "is-published" : ""} onClick={() => void handleRestore(version.id, version.versionNumber)} disabled={restoreMutation.isPending}><span>v{version.versionNumber}</span><small>{version.state === "published" ? "Publicada" : "Rascunho"}</small><RotateCcw size={13} /></button>) || <span className="real-empty-note">Carregando versões…</span>}</div></aside>
    </div>
  </div>;
}
