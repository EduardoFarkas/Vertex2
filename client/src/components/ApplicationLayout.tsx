import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { Sidebar } from "./Sidebar";

export function ApplicationLayout({ userName, onLogout }: { userName: string; onLogout: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="min-h-screen bg-[#F8FAFC] text-slate-900 dark:bg-slate-950 dark:text-slate-100"><Sidebar userName={userName} open={menuOpen} onClose={() => setMenuOpen(false)} onLogout={onLogout} /><div className="min-h-screen lg:pl-72"><AppHeader userName={userName} onOpenMenu={() => setMenuOpen(true)} /><main className="min-h-[calc(100vh-5rem)] bg-[#F8FAFC] p-4 sm:p-6 lg:p-8 dark:bg-slate-950"><Outlet /></main></div></div>;
}
