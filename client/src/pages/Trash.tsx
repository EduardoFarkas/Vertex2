import { Trash2 } from "lucide-react";

export default function Trash() {
  return <section className="mx-auto flex min-h-[45vh] max-w-5xl flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center dark:border-slate-600 dark:bg-slate-900"><span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><Trash2 size={22} /></span><h2 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">Lixeira vazia</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-700 dark:text-slate-200">Projetos removidos aparecerão aqui antes da exclusão definitiva.</p></section>;
}
