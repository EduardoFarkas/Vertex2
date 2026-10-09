import { AlertTriangle, FolderKanban, Layers3, LogOut, Trash2, X } from "lucide-react";
import { NavLink } from "react-router-dom";

type SidebarProps = {
  userName: string;
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
};

const navigation = [
  { to: "/dashboard/projects", label: "Meus Projetos", icon: FolderKanban },
  { to: "/dashboard/templates", label: "Templates", icon: Layers3 },
  { to: "/dashboard/trash", label: "Lixeira", icon: Trash2 },
  { to: "/dashboard/errors", label: "Registros de erro", icon: AlertTriangle },
];

export function Sidebar({ userName, open, onClose, onLogout }: SidebarProps) {
  const initials = userName.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "VE";
  return <>
    {open && <button className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden" aria-label="Fechar navegação" onClick={onClose} />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 -translate-x-full flex-col border-r border-slate-200 bg-white p-5 text-slate-900 transition-transform duration-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 lg:translate-x-0 ${open ? "translate-x-0" : ""}`}>
      <div className="flex items-center justify-between border-b border-slate-200 pb-5 dark:border-slate-700">
        <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-950 text-sm font-black text-white dark:bg-blue-500">VE</span><div><strong className="block text-sm tracking-tight text-slate-950 dark:text-white">VERTEX ECHAD</strong><span className="text-[10px] font-semibold tracking-[0.16em] text-slate-600 dark:text-slate-300">STUDIO INTERNO</span></div></div>
        <button className="rounded-md p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden" onClick={onClose} aria-label="Fechar menu"><X size={18} /></button>
      </div>
      <nav className="mt-7 space-y-1" aria-label="Navegação principal">
        <span className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Workspace</span>
        {navigation.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={onClose} className={({ isActive }) => `mt-1 flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-colors ${isActive ? "bg-slate-950 text-white dark:bg-blue-600" : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"}`}><Icon size={18} />{label}</NavLink>)}
      </nav>
      <div className="mt-auto border-t border-slate-200 pt-5 dark:border-slate-700">
        <div className="flex items-center gap-3 px-2"><span className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">{initials}</span><div className="min-w-0"><strong className="block truncate text-sm text-slate-950 dark:text-white">{userName}</strong><span className="block text-xs text-slate-600 dark:text-slate-300">Conta corporativa</span></div></div>
        <button className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-slate-200 dark:hover:bg-red-950/40 dark:hover:text-red-200" onClick={onLogout}><LogOut size={18} />Sair</button>
      </div>
    </aside>
  </>;
}
