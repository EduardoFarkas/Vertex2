import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { getErrorAuthHeaders } from "@/lib/errorAuth";

type ErrorLog = { requestId: string; action: string; route: string; code: string; message: string; createdAt: string };

export default function ErrorLogs() {
  const [items, setItems] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/client-errors", { credentials: "include", headers: getErrorAuthHeaders() });
      if (response.status === 401) throw new Error("Sua sessão expirou. Entre novamente para consultar os registros.");
      if (!response.ok) throw new Error("O serviço de registros não respondeu. Tente novamente em instantes.");
      const result = await response.json() as { items: ErrorLog[] };
      setItems(result.items);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível carregar os registros."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  return <main className="mx-auto w-full max-w-5xl px-5 py-8 text-slate-900 dark:text-slate-100">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Conta / Diagnóstico</p><h1 className="mt-2 text-2xl font-bold">Registros de erro</h1><p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Apenas os registros da sua conta aparecem aqui. Os detalhes técnicos e dados pessoais não são exibidos.</p></div><button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-60 dark:border-slate-600 dark:hover:bg-slate-800"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Atualizar</button></div>
    {loading ? <div className="flex items-center gap-2 rounded-xl border border-slate-200 p-6 text-sm dark:border-slate-700"><Loader2 size={16} className="animate-spin" /> Carregando registros…</div> : error ? <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"><p>{error}</p><button className="mt-3 font-semibold underline" onClick={() => void load()}>Tentar novamente</button></div> : items.length === 0 ? <div className="rounded-xl border border-slate-200 p-6 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">Nenhum erro registrado recentemente.</div> : <ul className="space-y-3">{items.map((item) => <li key={item.requestId} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"><div className="flex items-start gap-3"><AlertTriangle size={17} className="mt-0.5 text-amber-600" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-3 gap-y-1"><strong className="text-sm">{item.action}</strong><span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs dark:bg-slate-800">{item.code}</span><time className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("pt-BR")}</time></div><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.message}</p><p className="mt-1 truncate text-xs text-slate-500">Rota: {item.route}</p><p className="mt-2 font-mono text-xs text-slate-500">ID de suporte: {item.requestId}</p></div></div></li>)}</ul>}
  </main>;
}
