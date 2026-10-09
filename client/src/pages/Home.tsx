// Direção visual: Minimalismo Operacional — uma ferramenta calma e precisa, com navegação lateral, cartões brancos e acentos Azul Vertex.
import { useEffect, useMemo, useState, type DragEvent } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BoxSelect,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Command,
  ContactRound,
  Copy,
  BookOpenText,
  Building2,
  Download,
  Eye,
  Loader2,
  ExternalLink,
  FileStack,
  FolderKanban,
  Grid2X2,
  Images,
  LayoutDashboard,
  Layers3,
  LockKeyhole,
  LogOut,
  Map,
  Menu,
  Megaphone,
  Monitor,
  MoreHorizontal,
  Moon,
  Palette,
  PanelLeft,
  PenLine,
  Plus,
  Redo2,
  Search,
  Save,
  Settings2,
  Share2,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Sun,
  Tablet,
  Tag,
  Trash2,
  Type,
  Undo2,
  UploadCloud,
  UsersRound,
  WandSparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { RealEditor } from "@/components/RealEditor";
import { toProjectCreateInput, type ProjectTemplateId } from "@/lib/projectCreation";
import { useTheme } from "../contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type View = "projects" | "templates" | "leads" | "editor" | "sitemap" | "announcements" | "documents" | "directory";
type NavItem = { id: View; label: string; icon: typeof LayoutDashboard };
type ProjectFilter = "all" | "published" | "draft";
type TemplateFilter = "all" | "global" | "personal";
type TemplateId = ProjectTemplateId;
type PersistedProject = {
  id: number;
  name: string;
  status: "draft" | "published" | "archived";
  pageCount: number;
  primaryPageId?: number;
  tags: Array<{ id: number; name: string; color: string }>;
  updatedAt: Date;
};

type ProjectCard = {
  id: number;
  pageId?: number;
  name: string;
  description: string;
  status: string;
  date: string;
  tone: string;
  progress: number;
  tags: string[];
};

const navItems: NavItem[] = [
  { id: "projects", label: "Projetos", icon: LayoutDashboard },
  { id: "templates", label: "Templates", icon: Layers3 },
  { id: "leads", label: "Formulários", icon: ContactRound },
];

const templates: Array<{ id: TemplateId; name: string; type: "Global" | "Pessoal"; category: string; accent: string; tags: string[] }> = [
  { id: "editorial", name: "Editorial nº 01", type: "Global", category: "Estúdio / Portfólio", accent: "cobalt", tags: ["Editorial", "Portfólio"] },
  { id: "portfolio", name: "Portfolio Bruto", type: "Pessoal", category: "Arquitetura / Autoral", accent: "graphite", tags: ["Autoral", "Arquitetura"] },
  { id: "manifesto", name: "Manifesto", type: "Global", category: "Marca / Lançamento", accent: "paper", tags: ["Marca", "Lançamento"] },
];

const announcements = [
  { tag: "Operação", title: "Janela de manutenção do ambiente de publicação", body: "O ambiente ficará indisponível para atualização entre 22h e 23h30. Salve seus projetos antes desse horário.", date: "Hoje · 09:20", priority: "Alta" },
  { tag: "Processo", title: "Novo fluxo para revisão de landing pages", body: "A partir desta semana, toda revisão deve ser vinculada ao projeto correspondente antes do envio para aprovação.", date: "Ontem · 16:45", priority: "Informativo" },
  { tag: "Pessoas", title: "Integração de novos colaboradores", body: "O material de onboarding foi atualizado com os acessos e documentos necessários para a primeira semana.", date: "12 ago · 11:10", priority: "Informativo" },
];

const documents = [
  { name: "Manual de identidade interna", category: "Marca e comunicação", updated: "Atualizado há 3 dias", type: "PDF", size: "2,4 MB" },
  { name: "Política de publicação de sites", category: "Operação", updated: "Atualizado em 08 ago", type: "PDF", size: "840 KB" },
  { name: "Guia rápido do editor visual", category: "Ferramentas", updated: "Atualizado em 05 ago", type: "DOCX", size: "1,1 MB" },
  { name: "Checklist de revisão", category: "Qualidade", updated: "Atualizado em 01 ago", type: "XLSX", size: "320 KB" },
];

const directory = [
  { initials: "AS", name: "Alexandre Silva", role: "Direção de criação", team: "Criação", contact: "alexandre@vertexechad.intra", tone: "blue" },
  { initials: "MC", name: "Marina Costa", role: "Coordenação de projetos", team: "Operações", contact: "marina@vertexechad.intra", tone: "sand" },
  { initials: "RS", name: "Rafael Siqueira", role: "Desenvolvimento front-end", team: "Tecnologia", contact: "rafael@vertexechad.intra", tone: "graphite" },
  { initials: "LA", name: "Luiza Almeida", role: "People & Culture", team: "Pessoas", contact: "luiza@vertexechad.intra", tone: "green" },
];

const viewCopy: Record<View, { eyebrow: string; title: string; description: string }> = {
  projects: {
    eyebrow: "Workspace / Visão geral",
    title: "Trabalhe a partir do projeto certo.",
    description: "Acesse os projetos internos, continue uma edição e publique páginas de trabalho sem sair do ambiente da empresa.",
  },
  templates: {
    eyebrow: "Biblioteca / Templates",
    title: "Comece com uma boa estrutura.",
    description: "Modelos globais e pessoais para tirar a primeira decisão do caminho sem tirar sua autoria do projeto.",
  },
  leads: {
    eyebrow: "Portal interno / Formulários",
    title: "Respostas dos formulários.",
    description: "Acompanhe os envios recebidos pelos sites internos e encaminhe cada resposta para a equipe certa.",
  },
  editor: {
    eyebrow: "Vertex Editorial / Editor visual",
    title: "Edite sem perder o contexto.",
    description: "Um canvas limpo para ajustar estrutura, ritmo, tipografia e movimento com os materiais da equipe ao alcance.",
  },
  sitemap: {
    eyebrow: "Vertex Editorial / Mapa do site",
    title: "Veja a estrutura antes da superfície.",
    description: "Um mapa simples para manter páginas, caminhos e intenção editorial no mesmo lugar.",
  },
  announcements: {
    eyebrow: "Portal interno / Comunicados",
    title: "O que a equipe precisa saber.",
    description: "Avisos importantes, mudanças de processo e informações operacionais em um só lugar.",
  },
  documents: {
    eyebrow: "Portal interno / Documentos",
    title: "Documentos para o trabalho diário.",
    description: "Políticas, manuais e referências organizados para acesso rápido e uso interno.",
  },
  directory: {
    eyebrow: "Portal interno / Diretório",
    title: "Encontre a pessoa certa.",
    description: "Contatos da empresa por equipe, área e responsabilidade, sem procurar em várias ferramentas.",
  },
};

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "brand brand-compact" : "brand"} aria-label="Vertex Echad Studio">
      <BrandMark />
      {!compact && (
        <div className="brand-copy">
          <span>VERTEX ECHAD</span>
          <small>STUDIO</small>
        </div>
      )}
    </div>
  );
}

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><i /><i /></span>;
}

function VertexPreview({ variant = "dashboard" }: { variant?: "dashboard" | "editor" | "paper" }) {
  return <div className={`vertex-preview-art vertex-preview-${variant}`} aria-hidden="true">
    <div className="art-browser-bar"><span className="art-dots"><i /><i /><i /></span><span className="art-address" /></div>
    <div className="art-layout"><span className="art-rail"><i /><i /><i /><i /></span><div className="art-page"><span className="art-page-kicker" /><span className="art-page-title" /><span className="art-page-title short" /><span className="art-page-copy" /><span className="art-page-button" /><span className="art-page-frame" /></div><span className="art-side-panel"><i /><i /><i /></span></div>
  </div>;
}

function StatusPill({ status }: { status: string }) {
  const isPublished = status === "Publicado" || status === "Qualificado";
  const isNew = status === "Novo";
  return <span className={`status-pill ${isPublished ? "status-success" : isNew ? "status-blue" : "status-muted"}`}><span />{status}</span>;
}

function ViewHeading({ view, onNewProject }: { view: View; onNewProject: () => void }) {
  const copy = viewCopy[view];
  return (
    <div className={`view-heading ${view === "editor" ? "view-heading-editor" : ""}`}>
      <div>
        <div className="eyebrow"><span className="eyebrow-line" />{copy.eyebrow}</div>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </div>
      {view === "projects" && (
        <button className="button button-dark" onClick={onNewProject}><Plus size={16} strokeWidth={2.4} /> Novo projeto</button>
      )}
      {view === "templates" && (
        <button className="button button-dark" onClick={onNewProject}><Plus size={16} strokeWidth={2.4} /> Novo projeto</button>
      )}
    </div>
  );
}

function StatCard({ label, value, change, trend, icon: Icon }: { label: string; value: string; change: string; trend: "up" | "down"; icon: typeof Activity }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top"><span className="micro-label">{label}</span><Icon size={17} strokeWidth={1.7} /></div>
      <div className="stat-value">{value}</div>
      <div className={`stat-change ${trend === "up" ? "change-up" : "change-down"}`}><span>{trend === "up" ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}</span>{change}<em>vs. mês anterior</em></div>
    </div>
  );
}

function ProjectMiniCard({ project, tags, onEdit, onDuplicate, onDelete, onManageTags, isDuplicating, isDeleting }: { project: ProjectCard; tags: string[]; onEdit: () => void; onDuplicate: () => void; onDelete: () => void; onManageTags: () => void; isDuplicating: boolean; isDeleting: boolean }) {
  return (
    <article className="project-mini-card project-gallery-card">
      <button className={`project-thumb thumb-${project.tone}`} aria-label={`Editar ${project.name}`} onClick={onEdit}><span className="thumb-line thumb-line-a" /><span className="thumb-line thumb-line-b" /><span className="thumb-block" /></button>
      <div className="project-mini-info">
        <div className="project-mini-top"><div><span className="micro-label">Cliente</span><h3>{project.name}</h3><p>{project.description}</p></div><DropdownMenu><DropdownMenuTrigger asChild><button className="icon-button" aria-label={`Ações de ${project.name}`}><MoreHorizontal size={17} /></button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Ações do projeto</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onSelect={onEdit}><PenLine size={14} />Editar</DropdownMenuItem><DropdownMenuItem onSelect={onDuplicate} disabled={isDuplicating || isDeleting}>{isDuplicating ? <Loader2 size={14} className="spin" /> : <Copy size={14} />}Duplicar</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="project-delete-action" onSelect={onDelete} disabled={isDuplicating || isDeleting}>{isDeleting ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}Excluir</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
        <div className="project-mini-bottom"><StatusPill status={project.status} /><span>{project.date}</span><button className="text-button" onClick={onEdit}>Editar <ArrowUpRight size={13} /></button></div><TagChips tags={tags} onManage={onManageTags} />
      </div>
    </article>
  );
}

function CollectionToolbar({
  query,
  onQueryChange,
  placeholder,
  filter,
  onFilterChange,
  options,
  resultCount,
  tagFilter,
  onTagFilterChange,
  tagOptions = [],
}: {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder: string;
  filter: string;
  onFilterChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  resultCount: number;
  tagFilter?: string;
  onTagFilterChange?: (value: string) => void;
  tagOptions?: string[];
}) {
  return <div className="collection-toolbar"><label className="collection-search"><Search size={15} /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} /><kbd>/</kbd></label><div className="collection-filters"><span className="filter-caption"><SlidersHorizontal size={13} /> Filtrar</span><select value={filter} onChange={(event) => onFilterChange(event.target.value)} aria-label="Filtrar itens"><option value="all">Todos</option>{options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select>{onTagFilterChange && <select value={tagFilter} onChange={(event) => onTagFilterChange(event.target.value)} aria-label="Filtrar por tag"><option value="all">Todas as tags</option>{tagOptions.map((tag) => <option value={tag} key={tag}>{tag}</option>)}</select>}<span className="result-count">{resultCount} {resultCount === 1 ? "item" : "itens"}</span></div></div>;
}

function TagChips({ tags, onManage }: { tags: string[]; onManage?: () => void }) {
  return <div className="tag-chips">{tags.map((tag) => <span className="tag-chip" key={tag}><Tag size={10} />{tag}</span>)}{onManage && <button className="tag-manage-button" onClick={onManage} aria-label="Gerenciar tags"><Plus size={11} /> Tag</button>}</div>;
}

function TagManager({ itemName, tags, allTags, onToggle, onClose }: { itemName: string; tags: string[]; allTags: string[]; onToggle: (tag: string) => void; onClose: () => void }) {
  const [newTag, setNewTag] = useState("");
  const createTag = () => {
    const normalized = newTag.trim().replace(/\s+/g, " ");
    if (!normalized) return;
    onToggle(normalized);
    setNewTag("");
  };
  return <div className="tag-manager-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="tag-manager" role="dialog" aria-modal="true" aria-labelledby="tag-manager-title"><div className="tag-manager-head"><div><span className="micro-label">Organização</span><h2 id="tag-manager-title">Tags de {itemName}</h2></div><button className="icon-button" onClick={onClose} aria-label="Fechar gerenciador de tags"><X size={16} /></button></div><p>Crie uma tag ou selecione as existentes para organizar este item.</p><div className="tag-option-list">{allTags.length ? allTags.map((tag) => <button className={`tag-option ${tags.includes(tag) ? "selected" : ""}`} key={tag} onClick={() => onToggle(tag)}><Tag size={13} />{tag}{tags.includes(tag) && <Check size={13} />}</button>) : <span className="tag-manager-empty">Nenhuma tag criada ainda.</span>}</div><div className="tag-create-row"><input value={newTag} onChange={(event) => setNewTag(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") createTag(); }} placeholder="Nova tag personalizada" aria-label="Nova tag personalizada" /><button className="button button-dark" onClick={createTag}><Plus size={14} /> Criar</button></div></section></div>;
}

function ProjectsView({ query, onQueryChange, filter, onFilterChange, onNewProject, onEdit, onDuplicate, onDelete, persistedProjects, isLoading, isDuplicating, isDeleting }: { query: string; onQueryChange: (value: string) => void; filter: ProjectFilter; onFilterChange: (value: string) => void; onNewProject: () => void; onEdit: (pageId?: number) => void; onDuplicate: (project: PersistedProject) => void; onDelete: (project: PersistedProject) => void; persistedProjects: PersistedProject[]; isLoading: boolean; isDuplicating: boolean; isDeleting: boolean }) {
  const submissionsQuery = trpc.siteBuilder.listFormSubmissions.useQuery();
  const assetsQuery = trpc.siteBuilder.listAssets.useQuery();
  const [tagMap, setTagMap] = useState<Record<string, string[]>>(() => {
    try { return JSON.parse(localStorage.getItem("vertex-project-tags") || "{}") as Record<string, string[]>; } catch { return {}; }
  });
  const [tagFilter, setTagFilter] = useState("all");
  const [tagManager, setTagManager] = useState<string | null>(null);
  const cards = persistedProjects.map((project, index) => ({ id: project.id, pageId: project.primaryPageId, name: project.name, description: `Website · ${project.pageCount} ${project.pageCount === 1 ? "página" : "páginas"}`, status: project.status === "published" ? "Publicado" : project.status === "archived" ? "Arquivado" : "Rascunho", date: `Atualizado ${new Date(project.updatedAt).toLocaleDateString("pt-BR")}`, tone: (["ink", "sand", "blue"] as const)[index % 3], progress: project.status === "published" ? 100 : 52, tags: project.tags.map((tag) => tag.name) }));
  const getTags = (name: string) => tagMap[name] || cards.find((project) => project.name === name)?.tags || [];
  const toggleTag = (name: string, tag: string) => setTagMap((current) => {
    const currentTags = current[name] || getTags(name);
    const nextTags = currentTags.includes(tag) ? currentTags.filter((item) => item !== tag) : [...currentTags, tag];
    const nextMap = { ...current, [name]: nextTags };
    localStorage.setItem("vertex-project-tags", JSON.stringify(nextMap));
    return nextMap;
  });
  const tagOptions = Array.from(new Set([...cards.flatMap((project) => project.tags), ...Object.values(tagMap).flat()])).sort();
  const visibleProjects = cards.filter((project) => {
    const matchesQuery = `${project.name} ${project.description}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "published" && project.status === "Publicado") || (filter === "draft" && project.status === "Rascunho");
    const matchesTag = tagFilter === "all" || getTags(project.name).includes(tagFilter);
    return matchesQuery && matchesFilter && matchesTag;
  });
  return (
    <>
      <ViewHeading view="projects" onNewProject={onNewProject} />
      <CollectionToolbar query={query} onQueryChange={onQueryChange} placeholder="Buscar projetos por nome ou tipo" filter={filter} onFilterChange={onFilterChange} options={[{ value: "published", label: "Publicados" }, { value: "draft", label: "Rascunhos" }]} resultCount={visibleProjects.length} tagFilter={tagFilter} onTagFilterChange={setTagFilter} tagOptions={tagOptions} />
      <div className="stats-grid">
        <StatCard label="Projetos ativos" value={String(cards.length).padStart(2, "0")} change={cards.length ? "Sincronizado" : "Crie o primeiro"} trend="up" icon={FolderKanban} />
        <StatCard label="Páginas do site" value={String(persistedProjects.reduce((total, project) => total + project.pageCount, 0)).padStart(2, "0")} change={persistedProjects.length ? "Estrutura atual" : "Adicione uma página"} trend="up" icon={FileStack} />
        <StatCard label="Respostas recebidas" value={String(submissionsQuery.data?.length || 0).padStart(2, "0")} change={submissionsQuery.data?.length ? "Leads persistidos" : "Nenhum envio ainda"} trend="up" icon={ContactRound} />
        <div className="stat-card stat-card-blue"><div className="stat-card-top"><span className="micro-label">Mídias do workspace</span><Sparkles size={17} strokeWidth={1.7} /></div><div className="stat-value stat-value-small">{String(assetsQuery.data?.length || 0).padStart(2, "0")}</div><div className="plan-progress"><span style={{ width: assetsQuery.data?.length ? "100%" : "0%" }} /></div><div className="stat-foot">arquivos disponíveis para inserir <Images size={13} /></div></div>
      </div>

      <section className="panel projects-panel project-gallery-panel">
        <div className="panel-heading"><div><span className="micro-label">Seus projetos</span><h2>Galeria de sites</h2></div><span className="panel-count">{visibleProjects.length} {visibleProjects.length === 1 ? "projeto" : "projetos"}</span></div>
        <div className="project-list project-gallery">{isLoading ? <div className="collection-empty"><Loader2 size={17} className="spin" /><strong>Carregando projetos</strong><span>Conectando ao workspace.</span></div> : visibleProjects.length > 0 ? visibleProjects.map((project) => <ProjectMiniCard key={project.id} project={project} tags={getTags(project.name)} onEdit={() => onEdit(project.pageId)} onDuplicate={() => onDuplicate(persistedProjects.find((item) => item.id === project.id)!)} onDelete={() => onDelete(persistedProjects.find((item) => item.id === project.id)!)} onManageTags={() => setTagManager(project.name)} isDuplicating={isDuplicating} isDeleting={isDeleting} />) : <div className="collection-empty"><Search size={17} /><strong>Nenhum projeto encontrado</strong><span>Crie o primeiro projeto para começar a editar e salvar versões.</span></div>}</div>
      </section>

      {tagManager && <TagManager itemName={tagManager} tags={getTags(tagManager)} allTags={tagOptions} onToggle={(tag) => toggleTag(tagManager, tag)} onClose={() => setTagManager(null)} />}
    </>
  );
}

function TemplatesView({ query, onQueryChange, filter, onFilterChange, onNewProject, onUse }: { query: string; onQueryChange: (value: string) => void; filter: TemplateFilter; onFilterChange: (value: string) => void; onNewProject: () => void; onUse: (templateId: TemplateId) => void }) {
  const [tagMap, setTagMap] = useState<Record<string, string[]>>(() => {
    try { return JSON.parse(localStorage.getItem("vertex-template-tags") || "{}") as Record<string, string[]>; } catch { return {}; }
  });
  const [tagFilter, setTagFilter] = useState("all");
  const [tagManager, setTagManager] = useState<string | null>(null);
  const getTags = (name: string) => tagMap[name] || templates.find((template) => template.name === name)?.tags || [];
  const toggleTag = (name: string, tag: string) => setTagMap((current) => {
    const currentTags = current[name] || getTags(name);
    const nextTags = currentTags.includes(tag) ? currentTags.filter((item) => item !== tag) : [...currentTags, tag];
    const nextMap = { ...current, [name]: nextTags };
    localStorage.setItem("vertex-template-tags", JSON.stringify(nextMap));
    return nextMap;
  });
  const tagOptions = Array.from(new Set([...templates.flatMap((template) => template.tags), ...Object.values(tagMap).flat()])).sort();
  const visibleTemplates = templates.filter((template) => {
    const matchesQuery = `${template.name} ${template.category}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "global" && template.type === "Global") || (filter === "personal" && template.type === "Pessoal");
    const matchesTag = tagFilter === "all" || getTags(template.name).includes(tagFilter);
    return matchesQuery && matchesFilter && matchesTag;
  });
  return (
    <>
      <ViewHeading view="templates" onNewProject={onNewProject} />
      <CollectionToolbar query={query} onQueryChange={onQueryChange} placeholder="Buscar templates por nome ou categoria" filter={filter} onFilterChange={onFilterChange} options={[{ value: "global", label: "Globais" }, { value: "personal", label: "Pessoais" }]} resultCount={visibleTemplates.length} tagFilter={tagFilter} onTagFilterChange={setTagFilter} tagOptions={tagOptions} />
      <div className="template-grid">{visibleTemplates.length > 0 ? visibleTemplates.map((template, index) => <article className="template-card" key={template.id}><div className={`template-image template-accent-${template.accent}`}><VertexPreview variant={index === 0 ? "editor" : index === 1 ? "dashboard" : "paper"} /><span className="template-index">0{index + 1}</span><button className="template-action" onClick={() => onUse(template.id)}>Criar projeto <ArrowUpRight size={14} /></button></div><div className="template-card-meta"><div><h2>{template.name}</h2><p>{template.category}</p><TagChips tags={getTags(template.name)} onManage={() => setTagManager(template.name)} /></div><span className={`template-type ${template.type === "Global" ? "type-global" : "type-personal"}`}>{template.type}</span></div></article>) : <div className="collection-empty collection-empty-wide"><Search size={17} /><strong>Nenhum template encontrado</strong><span>Tente outra busca ou altere o tipo selecionado.</span></div>}</div>{tagManager && <TagManager itemName={tagManager} tags={getTags(tagManager)} allTags={tagOptions} onToggle={(tag) => toggleTag(tagManager, tag)} onClose={() => setTagManager(null)} />}
    </>
  );
}

function LeadsView() {
  const submissionsQuery = trpc.siteBuilder.listFormSubmissions.useQuery();
  const updateStatusMutation = trpc.siteBuilder.updateFormSubmissionStatus.useMutation();
  const trpcUtils = trpc.useUtils();
  const [statusFilter, setStatusFilter] = useState("all");
  const submissions = submissionsQuery.data || [];
  const visibleSubmissions = submissions.filter((submission) => statusFilter === "all" || submission.status === statusFilter);
  const statusLabel = (status: "new" | "in_review" | "qualified") => status === "new" ? "Novo" : status === "in_review" ? "Em análise" : "Qualificado";
  const exportCsv = () => {
    const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = [["Nome", "E-mail", "Telefone", "Mensagem", "Projeto", "Página", "Formulário", "Status", "Recebido"], ...visibleSubmissions.map((submission) => [submission.name, submission.email, submission.phone, submission.message, submission.projectName, submission.pageName, submission.formId, statusLabel(submission.status), new Date(submission.createdAt).toLocaleString("pt-BR")])];
    const blob = new Blob([rows.map((row) => row.map(escape).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const anchor = window.document.createElement("a"); anchor.href = url; anchor.download = "leads-vertex-echad.csv"; anchor.click(); URL.revokeObjectURL(url);
    toast.success("CSV de leads exportado.");
  };
  const changeStatus = async (submissionId: number, status: "new" | "in_review" | "qualified") => {
    try { await updateStatusMutation.mutateAsync({ submissionId, status }); await trpcUtils.siteBuilder.listFormSubmissions.invalidate(); toast.success("Status do lead atualizado."); }
    catch { toast.error("Não foi possível atualizar este lead."); }
  };
  return <>
    <ViewHeading view="leads" onNewProject={() => undefined} />
    <div className="leads-toolbar"><div className="leads-summary"><span className="summary-number">{String(submissions.length).padStart(2, "0")}</span><span><strong>leads recebidos</strong><small>Mensagens enviadas pelos sites publicados</small></span></div><div className="toolbar-actions"><label className="filter-button"><CalendarDays size={15} /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrar leads"><option value="all">Todos</option><option value="new">Novos</option><option value="in_review">Em análise</option><option value="qualified">Qualificados</option></select></label><button className="button button-outline" onClick={exportCsv} disabled={!visibleSubmissions.length}><Download size={15} /> Exportar CSV</button></div></div>
    <section className="panel leads-panel"><div className="table-heading"><span>Contato</span><span>Origem</span><span>Data de captura</span><span>Status</span><span /></div>{submissionsQuery.isLoading ? <div className="collection-empty"><Loader2 size={17} className="spin" /><strong>Carregando leads</strong><span>Buscando mensagens recebidas nos sites publicados.</span></div> : visibleSubmissions.length ? visibleSubmissions.map((lead) => <div className="lead-row" key={lead.id}><div className="lead-person"><span className="avatar">{(lead.name || lead.email || "?").slice(0, 2).toUpperCase()}</span><div><strong>{lead.name || "Contato sem nome"}</strong><small>{lead.email || lead.phone || "Sem contato informado"}</small></div></div><span className="lead-source">{lead.projectName} · {lead.pageName}</span><span className="lead-date">{new Date(lead.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span><select value={lead.status} onChange={(event) => void changeStatus(lead.id, event.target.value as "new" | "in_review" | "qualified")} disabled={updateStatusMutation.isPending} aria-label={`Status de ${lead.name || lead.email}`}><option value="new">Novo</option><option value="in_review">Em análise</option><option value="qualified">Qualificado</option></select><button className="icon-button" aria-label={`Copiar e-mail de ${lead.name || lead.email}`} onClick={() => lead.email ? navigator.clipboard.writeText(lead.email).then(() => toast.success("E-mail copiado.")).catch(() => toast.error("Não foi possível copiar o e-mail.")) : toast("Este lead não informou e-mail.")}><Copy size={17} /></button></div>) : <div className="collection-empty"><ContactRound size={17} /><strong>Nenhum lead encontrado</strong><span>Adicione um formulário de contato ao site, publique a página e as mensagens aparecerão aqui.</span></div>}</section>
    <div className="leads-foot"><span>Mostrando <strong>{visibleSubmissions.length}</strong> de {submissions.length} contatos</span></div>
  </>;
}

function AnnouncementsView() {
  const [readAnnouncements, setReadAnnouncements] = useState<string[]>(() => JSON.parse(localStorage.getItem("vertex-read-announcements") || "[]") as string[]);
  const markAllRead = () => {
    const next = announcements.map((item) => item.title);
    setReadAnnouncements(next);
    localStorage.setItem("vertex-read-announcements", JSON.stringify(next));
    toast.success("Comunicados marcados como lidos.");
  };
  return <>
    <ViewHeading view="announcements" onNewProject={() => undefined} />
    <div className="internal-summary-row"><div className="internal-summary"><span className="summary-number">03</span><span><strong>comunicados recentes</strong><small>{readAnnouncements.length} de 3 marcados como lidos</small></span></div><button className="button button-outline" onClick={markAllRead}><Check size={15} /> Marcar como lidos</button></div>
    <section className="announcement-list">{announcements.map((item, index) => <article className={`announcement-card ${index === 0 ? "announcement-featured" : ""} ${readAnnouncements.includes(item.title) ? "announcement-read" : ""}`} key={item.title}><div className="announcement-marker"><Megaphone size={17} /></div><div className="announcement-content"><div className="announcement-meta"><span className="internal-tag">{item.tag}</span><span>{item.date}</span><span className={item.priority === "Alta" ? "priority-high" : ""}>{item.priority}</span></div><h2>{item.title}</h2><p>{item.body}</p><button className="text-button" onClick={() => { if (!readAnnouncements.includes(item.title)) { const next = [...readAnnouncements, item.title]; setReadAnnouncements(next); localStorage.setItem("vertex-read-announcements", JSON.stringify(next)); } toast(`Comunicado “${item.title}” aberto.`); }}>Ler comunicado <ArrowUpRight size={13} /></button></div><button className="icon-button" onClick={() => toast("O arquivamento estará disponível quando os comunicados forem conectados ao servidor.")} aria-label="Mais ações do comunicado"><MoreHorizontal size={17} /></button></article>)}</section>
  </>;
}

function DocumentsView() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const visibleDocuments = documents.filter((document) => `${document.name} ${document.category}`.toLowerCase().includes(query.toLowerCase()) && (category === "all" || document.category === category));
  const categories = Array.from(new Set(documents.map((document) => document.category)));
  const downloadDocument = (document: typeof documents[number]) => {
    const contents = `VERTEX ECHAD · DOCUMENTO INTERNO\n\n${document.name}\nCategoria: ${document.category}\nÚltima atualização: ${document.updated}\nFormato: ${document.type}\nTamanho de referência: ${document.size}`;
    const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = `${document.name.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`Cópia de referência de “${document.name}” baixada.`);
  };
  return <>
    <ViewHeading view="documents" onNewProject={() => undefined} />
    <CollectionToolbar query={query} onQueryChange={setQuery} placeholder="Buscar documentos" filter={category} onFilterChange={setCategory} options={categories.map((value) => ({ value, label: value }))} resultCount={visibleDocuments.length} />
    <section className="document-list panel">{visibleDocuments.length > 0 ? visibleDocuments.map((document) => <div className="document-row" key={document.name}><span className="document-icon"><FileStack size={17} /></span><div className="document-info"><strong>{document.name}</strong><small>{document.category} · {document.updated}</small></div><span className="document-type">{document.type}</span><span className="document-size">{document.size}</span><button className="button button-outline document-download" onClick={() => downloadDocument(document)}><Download size={14} /> Baixar cópia</button><button className="icon-button" onClick={() => toast("O documento está disponível para download acima.")} aria-label={`Mais ações para ${document.name}`}><MoreHorizontal size={17} /></button></div>) : <div className="collection-empty"><BookOpenText size={17} /><strong>Nenhum documento encontrado</strong><span>Ajuste a busca ou escolha outra categoria.</span></div>}</section>
  </>;
}

function DirectoryView() {
  const [query, setQuery] = useState("");
  const visiblePeople = directory.filter((person) => `${person.name} ${person.role} ${person.team}`.toLowerCase().includes(query.toLowerCase()));
  const copyContact = async (person: typeof directory[number]) => {
    try {
      await navigator.clipboard.writeText(person.contact);
      toast.success(`Contato de ${person.name} copiado.`);
    } catch {
      toast("Selecione o e-mail no cartão para copiá-lo manualmente.");
    }
  };
  return <>
    <ViewHeading view="directory" onNewProject={() => undefined} />
    <div className="directory-toolbar"><label className="collection-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome, área ou função" aria-label="Buscar no diretório" /><kbd>/</kbd></label><span className="result-count">{visiblePeople.length} colaboradores</span></div>
    <div className="directory-grid">{visiblePeople.length > 0 ? visiblePeople.map((person) => <article className="directory-card" key={person.contact}><div className={`directory-avatar directory-avatar-${person.tone}`}>{person.initials}</div><div className="directory-person"><h2>{person.name}</h2><p>{person.role}</p><span>{person.team}</span></div><button className="icon-button" onClick={() => copyContact(person)} aria-label={`Copiar contato de ${person.name}`}><Copy size={16} /></button><a className="directory-contact" href={`mailto:${person.contact}`}><span>{person.contact}</span><ArrowUpRight size={13} /></a></article>) : <div className="collection-empty collection-empty-wide"><UsersRound size={17} /><strong>Nenhum colaborador encontrado</strong><span>Tente buscar por nome, equipe ou função.</span></div>}</div>
  </>;
}

/* Editor legado desativado: o fluxo ativo usa exclusivamente RealEditor.tsx.
function PreviewModal({ components, onClose, onExport, exporting }: { components: string[]; onClose: () => void; onExport: () => void; exporting: boolean }) {
  return <div className="preview-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="preview-modal" role="dialog" aria-modal="true" aria-labelledby="preview-title"><header className="preview-modal-header"><div><span className="micro-label">Visualização · Desktop</span><h2 id="preview-title">Vertex Editorial</h2></div><div className="preview-modal-actions"><button className="button button-outline" onClick={onClose}>Voltar ao editor</button><button className="button button-dark" onClick={onExport} disabled={exporting}>{exporting ? <Loader2 size={14} className="spin" /> : <Download size={14} />} {exporting ? "Exportando…" : "Exportar HTML"}</button></div></header><div className="preview-browser"><div className="preview-browser-bar"><span className="art-dots"><i /><i /><i /></span><span className="preview-browser-address">vertex-editorial.intra /</span><span className="preview-browser-status">Prévia local</span></div><div className="preview-page"><div className="preview-page-nav"><span className="site-logo">VE</span><span>Projetos</span><span>Sobre</span><span>Contato</span></div><div className="preview-page-hero"><span className="canvas-kicker">ESTÚDIO DE DESIGN · 2026</span><h1>Forma antes<br /><em>da superfície.</em></h1><p>Uma prática independente de direção, espaço e presença digital.</p><button>Ver projetos <ArrowUpRight size={14} /></button><div className="preview-page-art"><VertexPreview variant="editor" /></div></div><div className="preview-page-footer"><span>{components.length} componentes no canvas</span><span>Vertex Echad · Preview</span></div></div></div></section></div>;
}

function componentsFromDocument(schema: unknown) {
  if (!schema || typeof schema !== "object") return ["Seção principal"];
  const canvas = (schema as { canvas?: { components?: unknown } }).canvas;
  if (!Array.isArray(canvas?.components)) return ["Seção principal"];
  const components = canvas.components.filter((component): component is string => typeof component === "string");
  return components.length ? components : ["Seção principal"];
}

function EditorView({ onPublish, onPersist, isPersisting, activeProjectName, persistedSchema, isDocumentLoading, documentError, hasActivePage }: { onPublish: () => void; onPersist: (schema: unknown) => Promise<void>; isPersisting: boolean; activeProjectName: string; persistedSchema: unknown; isDocumentLoading: boolean; documentError: boolean; hasActivePage: boolean }) {
  const [editorTab, setEditorTab] = useState("Blocos");
  const [device, setDevice] = useState("desktop");
  const [openPanel, setOpenPanel] = useState("Tipografia");
  const [draggingBlock, setDraggingBlock] = useState<string | null>(null);
  const [placedBlocks, setPlacedBlocks] = useState<string[]>(["Seção principal"]);
  const [pastBlocks, setPastBlocks] = useState<string[][]>([]);
  const [futureBlocks, setFutureBlocks] = useState<string[][]>([]);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const blocks = [
    { label: "Seção", icon: BoxSelect },
    { label: "Título", icon: Type },
    { label: "Imagem", icon: Images },
    { label: "Botão", icon: Sparkles },
  ];
  useEffect(() => {
    if (!hasActivePage || isDocumentLoading) return;
    setPlacedBlocks(componentsFromDocument(persistedSchema));
    setPastBlocks([]);
    setFutureBlocks([]);
  }, [hasActivePage, isDocumentLoading, persistedSchema]);
  const addBlock = (label: string) => {
    setPastBlocks((current) => [...current, placedBlocks].slice(-20));
    setFutureBlocks([]);
    setPlacedBlocks((current) => [...current, label]);
    toast.success(`${label} adicionado ao canvas.`);
  };
  const handleBlockDragStart = (event: DragEvent<HTMLButtonElement>, label: string) => {
    event.dataTransfer.setData("text/plain", label);
    event.dataTransfer.effectAllowed = "copy";
    setDraggingBlock(label);
  };
  const handleCanvasDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    const label = event.dataTransfer.getData("text/plain") || draggingBlock;
    if (label) addBlock(label);
    setDraggingBlock(null);
  };
  const handleUndo = () => {
    if (!pastBlocks.length) {
      toast("Não há alterações para desfazer.");
      return;
    }
    const previous = pastBlocks[pastBlocks.length - 1];
    setFutureBlocks((current) => [...current, placedBlocks]);
    setPlacedBlocks(previous);
    setPastBlocks((current) => current.slice(0, -1));
    toast("Última alteração desfeita.");
  };
  const handleRedo = () => {
    if (!futureBlocks.length) {
      toast("Não há alterações para refazer.");
      return;
    }
    const next = futureBlocks[futureBlocks.length - 1];
    setPastBlocks((current) => [...current, placedBlocks]);
    setPlacedBlocks(next);
    setFutureBlocks((current) => current.slice(0, -1));
    toast("Alteração refeita.");
  };
  const handleSave = async () => {
    if (saving || isPersisting) return;
    setSaving(true);
    const toastId = toast.loading("Salvando projeto…");
    try {
      const baseDocument = persistedSchema && typeof persistedSchema === "object" ? persistedSchema as Record<string, unknown> : { kind: "vertex-document", schemaVersion: 1 };
      await onPersist({ ...baseDocument, canvas: { components: placedBlocks }, savedAt: new Date().toISOString() });
      const savedAt = new Date().toISOString();
      setLastSaved(savedAt);
      toast.success("Nova versão salva no workspace.", { id: toastId });
    } catch {
      toast.error("Não foi possível salvar a versão no servidor.", { id: toastId });
    } finally {
      setSaving(false);
    }
  };
  const handleExport = () => {
    if (exporting) return;
    setExporting(true);
    const toastId = toast.loading("Preparando o HTML…");
    window.setTimeout(() => {
      try {
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Vertex Editorial</title><style>body{font-family:Arial,sans-serif;margin:0;padding:8vw;background:#f5f5f7;color:#1d1d1f}h1{font-size:clamp(42px,8vw,110px);line-height:.95;max-width:720px}em{color:#2563eb;font-style:normal}p{max-width:360px;line-height:1.6}</style></head><body><small>VERTEX ECHAD · PROJETO INTERNO</small><h1>Forma antes<br><em>da superfície.</em></h1><p>Componentes inseridos no editor: ${placedBlocks.join(", ")}.</p></body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = "vertex-editorial.html";
    anchor.click();
    URL.revokeObjectURL(url);
        toast.success("Arquivo HTML exportado.", { id: toastId });
        onPublish();
      } catch {
        toast.error("Não foi possível exportar o HTML.", { id: toastId });
      } finally {
        setExporting(false);
      }
    }, 850);
  };
  if (!hasActivePage) return <div className="editor-shell"><ViewHeading view="editor" onNewProject={() => undefined} /><div className="collection-empty collection-empty-wide"><PenLine size={20} /><strong>Abra um projeto para editar</strong><span>Selecione um projeto na área Projetos para carregar sua página e criar versões persistentes.</span></div></div>;
  if (isDocumentLoading) return <div className="editor-shell"><ViewHeading view="editor" onNewProject={() => undefined} /><div className="collection-empty collection-empty-wide"><Loader2 size={20} className="spin" /><strong>Carregando documento</strong><span>Recuperando a última versão salva no workspace.</span></div></div>;
  if (documentError) return <div className="editor-shell"><ViewHeading view="editor" onNewProject={() => undefined} /><div className="collection-empty collection-empty-wide"><CircleHelp size={20} /><strong>Não foi possível abrir a página</strong><span>Volte aos projetos e tente abrir a página novamente.</span></div></div>;
  return (
    <div className="editor-shell">
      <ViewHeading view="editor" onNewProject={() => undefined} />
      <div className="editor-toolbar"><div className="editor-breadcrumb"><span>Projetos</span><ChevronRight size={13} /><strong>{activeProjectName}</strong><ChevronRight size={13} /><span>Página inicial</span></div><div className="device-switcher"><button className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")} aria-label="Desktop"><Monitor size={15} /></button><button className={device === "tablet" ? "active" : ""} onClick={() => setDevice("tablet")} aria-label="Tablet"><Tablet size={15} /></button><button className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")} aria-label="Mobile"><Smartphone size={15} /></button></div><div className="editor-actions"><button className="icon-button" aria-label="Desfazer" onClick={handleUndo}><Undo2 size={16} /></button><button className="icon-button" aria-label="Refazer" onClick={handleRedo}><Redo2 size={16} /></button><button className="button button-outline" onClick={() => setPreviewing(true)}><Eye size={15} /> Visualizar</button><button className="button button-outline editor-save-button" onClick={handleSave} disabled={saving || isPersisting}>{saving || isPersisting ? <Loader2 size={15} className="spin" /> : <Save size={15} />} {saving || isPersisting ? "Salvando…" : "Salvar"}</button><button className="button button-dark" onClick={handleExport} disabled={exporting}>{exporting ? <Loader2 size={15} className="spin" /> : <Download size={15} />} {exporting ? "Exportando…" : "Exportar"}</button></div></div>
      <div className="editor-workspace">
        <aside className="editor-sidebar editor-sidebar-left"><div className="editor-tabs">{["Blocos", "Mídia", "Motion"].map((tab) => <button key={tab} className={editorTab === tab ? "active" : ""} onClick={() => setEditorTab(tab)}>{tab}</button>)}</div>{editorTab === "Blocos" && <div className="block-list"><span className="block-helper"><Sparkles size={12} /> Arraste para o canvas ou clique para inserir</span>{blocks.map(({ label, icon: Icon }) => <button className={`block-item ${draggingBlock === label ? "is-dragging" : ""}`} key={label} draggable onDragStart={(event) => handleBlockDragStart(event, label)} onDragEnd={() => setDraggingBlock(null)} onClick={() => addBlock(label)}><span><Icon size={16} /></span><strong>{label}</strong><Plus size={14} /></button>)}</div>}{editorTab === "Mídia" && <div className="media-panel"><div className="media-upload"><UploadCloud size={18} /><strong>Arraste arquivos</strong><small>ou escolha do computador</small><button onClick={() => toast("Upload simulado pronto para conectar ao S3.")}>Selecionar mídia</button></div><div className="media-grid"><div className="media-tile media-tile-one" /><div className="media-tile media-tile-two" /><div className="media-tile media-tile-three" /><div className="media-tile media-tile-four" /></div></div>}{editorTab === "Motion" && <div className="motion-list"><button onClick={() => toast("Fade In aplicado.")}><span className="motion-preview fade" />Fade In <ChevronRight size={14} /></button><button onClick={() => toast("Zoom aplicado.")}><span className="motion-preview zoom" />Zoom <ChevronRight size={14} /></button><button onClick={() => toast("Slide aplicado.")}><span className="motion-preview slide" />Slide <ChevronRight size={14} /></button><button onClick={() => toast("Parallax aplicado.")}><span className="motion-preview parallax" />Parallax <ChevronRight size={14} /></button></div>}<div className="editor-sidebar-footer"><button onClick={() => toast("Mapa do site aberto.")}><Map size={15} /> Mapa do site</button><button onClick={() => toast("Importador pronto para receber uma URL.")}><ExternalLink size={15} /> Importar URL</button></div></aside>
        <main className={`canvas-area canvas-${device} ${draggingBlock ? "is-dragging" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={handleCanvasDrop}><div className="canvas-ruler canvas-ruler-top"><span>0</span><span>320</span><span>640</span><span>960</span><span>1280</span></div><div className="site-canvas"><div className="site-canvas-top"><span className="site-logo">VE</span><div className="site-links"><span>Projetos</span><span>Sobre</span><span>Contato</span></div><span className="site-menu"><Menu size={14} /></span></div><div className="site-canvas-hero"><div><span className="canvas-kicker">ESTÚDIO DE DESIGN · 2026</span><h2>Forma antes<br /><i>da superfície.</i></h2><p>Uma prática independente de direção, espaço e presença digital.</p><button onClick={() => toast("CTA selecionado no canvas.")}>Ver projetos <ArrowUpRight size={14} /></button></div><div className="canvas-visual"><VertexPreview variant="editor" /></div></div><div className="site-canvas-footer"><span>01 — Seleção recente</span><span>{lastSaved ? `Salvo às ${new Date(lastSaved).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : `${placedBlocks.length} ${placedBlocks.length === 1 ? "componente inserido" : "componentes inseridos"}`}</span></div></div><div className="canvas-drop-target"><Plus size={18} /><strong>Solte o bloco aqui</strong><span>ou clique em qualquer bloco para inserir</span></div><div className="canvas-selection"><span className="selection-label">Seção principal</span><span className="selection-handle handle-tl" /><span className="selection-handle handle-tr" /><span className="selection-handle handle-bl" /><span className="selection-handle handle-br" /></div></main>
        <aside className="editor-sidebar editor-sidebar-right"><div className="inspector-heading"><span className="micro-label">Elemento selecionado</span><button className="icon-button" onClick={() => toast("Seleção removida.")} aria-label="Fechar seleção"><X size={15} /></button><strong>Seção principal</strong></div>{["Tipografia", "Cores", "Espaçamento", "CSS personalizado"].map((panel) => <div className={`inspector-panel ${openPanel === panel ? "open" : ""}`} key={panel}><button onClick={() => setOpenPanel(openPanel === panel ? "" : panel)}><span>{panel}</span><ChevronDown size={14} /></button>{openPanel === panel && <div className="inspector-content">{panel === "Tipografia" && <><label>Família <span>Manrope</span></label><label>Tamanho <span>64 px</span></label><label>Peso <span>600</span></label><label>Alinhamento <span className="alignment-buttons"><i /><i className="center" /><i className="right" /></span></label></>}{panel === "Cores" && <><label>Fundo <span className="color-value"><i className="color-swatch paper" />#F5F5F7</span></label><label>Texto <span className="color-value"><i className="color-swatch graphite" />#1D1D1F</span></label></>}{panel === "Espaçamento" && <><label>Padding X <span>72 px</span></label><label>Padding Y <span>96 px</span></label></>}{panel === "CSS personalizado" && <div className="code-snippet">.hero {`{`}<br />&nbsp;&nbsp;min-height: 88vh;<br />&nbsp;&nbsp;color: #1D1D1F;<br />{`}`}</div>}</div>}</div>)}<div className="inspector-footer"><button onClick={() => toast("Histórico do elemento aberto.")}><Clock3 size={15} /> Histórico de alterações <ChevronRight size={14} /></button><button onClick={() => toast("Configurações avançadas abertas.")}><Settings2 size={15} /> Configurações avançadas <ChevronRight size={14} /></button></div></aside>
      </div>
      {previewing && <PreviewModal components={placedBlocks} onClose={() => setPreviewing(false)} onExport={handleExport} exporting={exporting} />}
    </div>
  );
}

*/
function SitemapView() {
  return (
    <>
      <ViewHeading view="sitemap" onNewProject={() => undefined} />
      <div className="sitemap-toolbar"><span className="sitemap-status"><span className="status-dot" />6 páginas conectadas</span><div className="toolbar-actions"><button className="filter-button" onClick={() => toast("Zoom ajustado.")}><Grid2X2 size={15} /> Ajustar mapa</button><button className="button button-outline" onClick={() => toast("Mapa exportado.")}><Download size={15} /> Exportar mapa</button></div></div>
      <section className="sitemap-board"><div className="map-grid" /><svg className="map-lines" viewBox="0 0 1000 470" preserveAspectRatio="none" aria-hidden="true"><path d="M500 165 C500 210 222 208 222 270" /><path d="M500 165 C500 210 500 218 500 270" /><path d="M500 165 C500 210 778 208 778 270" /><path d="M222 350 C222 390 130 390 130 415" /><path d="M222 350 C222 390 320 390 320 415" /></svg><div className="map-node map-node-home"><span className="map-node-type">HOME</span><strong>Página inicial</strong><small>/</small><span className="map-node-published"><span />Publicada</span></div><div className="map-node map-node-about"><span className="map-node-type">PÁGINA</span><strong>Sobre o estúdio</strong><small>/sobre</small></div><div className="map-node map-node-work"><span className="map-node-type">PÁGINA</span><strong>Projetos</strong><small>/projetos</small><span className="node-child-count">3 páginas</span></div><div className="map-node map-node-contact"><span className="map-node-type">PÁGINA</span><strong>Contato</strong><small>/contato</small></div><div className="map-node map-node-child map-node-child-a"><strong>Projeto A</strong><small>/projetos/a</small></div><div className="map-node map-node-child map-node-child-b"><strong>Projeto B</strong><small>/projetos/b</small></div><button className="map-add" onClick={() => toast("Nova página adicionada ao mapa.")}><Plus size={17} /> Adicionar página</button></section>
    </>
  );
}

function NewProjectModal({ onClose, onCreate, selectedTemplateId, isSubmitting }: { onClose: () => void; onCreate: (input: { name: string; templateId?: TemplateId }) => void; selectedTemplateId?: TemplateId; isSubmitting: boolean }) {
  const [name, setName] = useState("");
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSubmitting) onClose(); }}><div className="new-project-modal" role="dialog" aria-modal="true" aria-labelledby="new-project-title"><div className="modal-top"><div><span className="eyebrow"><span className="eyebrow-line" />Novo projeto</span><h2 id="new-project-title">Crie para um novo cliente.</h2></div><button className="icon-button" onClick={onClose} aria-label="Fechar" disabled={isSubmitting}><X size={18} /></button></div><label className="modal-label">Nome do cliente<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Acme Comércio" autoFocus disabled={isSubmitting} onKeyDown={(event) => { if (event.key === "Enter" && name.trim()) onCreate({ name, templateId: selectedTemplateId }); }} /></label>{selectedTemplate && <div className="template-callout"><span>Base escolhida</span><strong>{selectedTemplate.name}</strong><small>O conteúdo inicial será aplicado ao novo projeto.</small></div>}<div className="modal-footer"><span><LockKeyhole size={13} /> Seu workspace é privado</span><button className="button button-dark" disabled={!name.trim() || isSubmitting} onClick={() => onCreate({ name, templateId: selectedTemplateId })}>{isSubmitting ? <Loader2 size={14} className="spin" /> : "Criar projeto"}<ArrowUpRight size={14} /></button></div></div></div>;
}

export default function Home({ section = "projects", userName }: { section?: "projects" | "templates"; userName: string }) {
  const trpcUtils = trpc.useUtils();
  const overviewQuery = trpc.siteBuilder.overview.useQuery();
  const createProjectMutation = trpc.siteBuilder.createProject.useMutation();
  const cloneProjectMutation = trpc.siteBuilder.cloneProject.useMutation();
  const deleteProjectMutation = trpc.siteBuilder.deleteProject.useMutation();
  const saveDocumentMutation = trpc.siteBuilder.savePageDocument.useMutation();
  const publishPageMutation = trpc.siteBuilder.publishPage.useMutation();
  const [view, setView] = useState<View>(section);
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId | undefined>(undefined);
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("all");
  const [templateFilter, setTemplateFilter] = useState<TemplateFilter>("all");
  const [activePageId, setActivePageId] = useState<number | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [activeProjectName, setActiveProjectName] = useState("Projeto sem título");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pageDocumentQuery = trpc.siteBuilder.getPageDocument.useQuery({ pageId: activePageId ?? 1 }, { enabled: activePageId !== null, retry: false });
  const persistedProjects: PersistedProject[] = useMemo(() => overviewQuery.data?.projects ?? [], [overviewQuery.data]);
  const addProjectToGallery = (project: { id: number; workspaceId: number; name: string; slug: string; status: "draft" | "published" | "archived"; createdBy: number; pageId?: number | null }) => {
    trpcUtils.siteBuilder.overview.setData(undefined, (current) => current ? {
      ...current,
      projects: [{ id: project.id, workspaceId: project.workspaceId, name: project.name, slug: project.slug, status: project.status, createdBy: project.createdBy, pageCount: 1, primaryPageId: project.pageId ?? undefined, tags: [], createdAt: new Date(), updatedAt: new Date() }, ...current.projects.filter((item) => item.id !== project.id)],
    } : current);
  };

  useEffect(() => {
    toast.success(`Bem-vindo, ${userName.split(" ")[0]}.`, { description: "Seu workspace conectado está pronto para continuar." });
  }, [userName]);

  useEffect(() => {
    setView(section);
    setIsSidebarCollapsed(false);
  }, [section]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pageId = Number(params.get("page"));
    const requestedView = params.get("view") as View | null;
    if (requestedView && requestedView !== "editor" && (["projects", "templates", "leads"] as View[]).includes(requestedView)) {
      setView(requestedView);
      setIsSidebarCollapsed(false);
      return;
    }
    if (requestedView !== "editor" || !Number.isInteger(pageId) || pageId <= 0) return;
    const project = persistedProjects.find((item) => item.primaryPageId === pageId);
    setActivePageId(pageId);
    setActiveProjectId(project?.id || null);
    setActiveProjectName(project?.name || "Projeto selecionado");
    setView("editor");
    setIsSidebarCollapsed(true);
  }, [persistedProjects]);

  const switchView = (next: View) => { setView(next); setMobileNav(false); setIsSidebarCollapsed(next === "editor"); };
  const openNewProject = (templateId?: TemplateId) => { setSelectedTemplateId(templateId); setShowModal(true); };
  const createProject = async ({ name, templateId }: { name: string; templateId?: TemplateId }) => {
    const projectName = name.trim();
    if (projectName.length < 2) {
      toast.error("Informe um nome com ao menos 2 caracteres.");
      return;
    }
    const toastId = toast.loading("Criando projeto e primeira página…");
    try {
      const project = await createProjectMutation.mutateAsync(toProjectCreateInput(projectName, templateId));
      if (templateId && project.templateId !== templateId) throw new Error("O template selecionado não foi aplicado. Tente criar o projeto novamente.");
      addProjectToGallery(project);
      await trpcUtils.siteBuilder.overview.invalidate();
      setShowModal(false);
      setSelectedTemplateId(undefined);
      if (templateId) {
        setActivePageId(project.pageId);
        setActiveProjectId(project.id);
        setActiveProjectName(project.name);
        setView("editor");
        setIsSidebarCollapsed(true);
      } else {
        setView("projects");
        setIsSidebarCollapsed(false);
      }
      toast.success(`“${project.name}” criado no workspace${templateId ? "." : " e adicionado à galeria."}`, { id: toastId });
    } catch {
      toast.error("Não foi possível criar o projeto no workspace.", { id: toastId });
    }
  };
  const duplicateProject = async (project: PersistedProject) => {
    const toastId = toast.loading(`Duplicando “${project.name}”…`);
    try {
      const cloned = await cloneProjectMutation.mutateAsync({ projectId: project.id });
      addProjectToGallery(cloned);
      await trpcUtils.siteBuilder.overview.invalidate();
      toast.success(`“${cloned.name}” foi adicionado à galeria.`, { id: toastId });
    } catch {
      toast.error("Não foi possível duplicar o projeto.", { id: toastId });
    }
  };
  const removeProject = async (project: PersistedProject) => {
    if (!window.confirm(`Excluir “${project.name}”? Essa ação remove suas páginas e versões.`)) return;
    const toastId = toast.loading(`Excluindo “${project.name}”…`);
    try {
      await deleteProjectMutation.mutateAsync({ projectId: project.id });
      trpcUtils.siteBuilder.overview.setData(undefined, (current) => current ? { ...current, projects: current.projects.filter((item) => item.id !== project.id) } : current);
      await trpcUtils.siteBuilder.overview.invalidate();
      toast.success(`“${project.name}” foi excluído.`, { id: toastId });
    } catch {
      toast.error("Não foi possível excluir o projeto.", { id: toastId });
    }
  };
  const editProject = (pageId?: number) => {
    if (!pageId) {
      toast.error("Este projeto ainda não possui uma página disponível.");
      return;
    }
    const project = persistedProjects.find((item) => item.primaryPageId === pageId);
    setActivePageId(pageId);
    setActiveProjectId(project?.id || null);
    setActiveProjectName(project?.name || "Projeto selecionado");
    setView("editor");
    setIsSidebarCollapsed(true);
    toast("Editor visual conectado à página selecionada.");
  };
  const persistDocument = async (schema: unknown) => {
    if (!activePageId) throw new Error("Nenhuma página selecionada");
    await saveDocumentMutation.mutateAsync({ pageId: activePageId, schema });
    await trpcUtils.siteBuilder.getPageDocument.invalidate({ pageId: activePageId });
    await trpcUtils.siteBuilder.overview.invalidate();
  };
  const publishActivePage = () => {
    if (!activePageId) {
      toast.error("Abra uma página antes de publicar.");
      return;
    }
    const toastId = toast.loading("Publicando versão atual…");
    void publishPageMutation.mutateAsync({ pageId: activePageId }).then(async () => {
      await trpcUtils.siteBuilder.overview.invalidate();
      toast.success("Versão marcada como publicada.", { id: toastId });
    }).catch(() => toast.error("Não foi possível publicar esta versão.", { id: toastId }));
  };

  return <><div className={`page-content ${view === "editor" ? "page-content-editor" : ""}`}>{view === "projects" && <ProjectsView query={search} onQueryChange={setSearch} filter={projectFilter} onFilterChange={(value) => setProjectFilter(value as ProjectFilter)} onNewProject={() => openNewProject()} onEdit={editProject} onDuplicate={duplicateProject} onDelete={removeProject} persistedProjects={persistedProjects} isLoading={overviewQuery.isLoading} isDuplicating={cloneProjectMutation.isPending} isDeleting={deleteProjectMutation.isPending} />}{view === "templates" && <TemplatesView query={search} onQueryChange={setSearch} filter={templateFilter} onFilterChange={(value) => setTemplateFilter(value as TemplateFilter)} onNewProject={() => openNewProject()} onUse={openNewProject} />}{view === "leads" && <LeadsView />}{view === "editor" && <RealEditor pageId={activePageId} projectName={activeProjectName} />}</div>{showModal && <NewProjectModal onClose={() => { setShowModal(false); setSelectedTemplateId(undefined); }} onCreate={createProject} selectedTemplateId={selectedTemplateId} isSubmitting={createProjectMutation.isPending} />}</>;
}
