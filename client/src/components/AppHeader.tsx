import { Menu } from "lucide-react";

export function AppHeader({ userName, onOpenMenu }: { userName: string; onOpenMenu: () => void }) {
  const firstName = userName.split(" ")[0] || "colaborador";
  return <header className="sticky top-0 z-30 flex h-20 items-center border-b border-slate-200 bg-white/95 px-5 text-slate-900 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100 lg:px-8"><button className="mr-4 rounded-md p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden" onClick={onOpenMenu} aria-label="Abrir menu"><Menu size={20} /></button><div><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300">Vertex Echad Studio</span><h1 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">Olá, {firstName}.</h1></div></header>;
}
