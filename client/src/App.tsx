import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { startLogin } from "./const";
import ErrorBoundary from "./components/ErrorBoundary";
import { ApplicationLayout } from "./components/ApplicationLayout";
import { AuthProvider, useSession } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { logoutAndNavigate } from "./lib/authNavigation";
import { getAuthRouteTarget } from "./lib/authRoutePolicy";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Trash from "./pages/Trash";
import ErrorLogs from "./pages/ErrorLogs";

function SessionLoading() { return <Login onLogin={startLogin} isLoading />; }

function LoginRoute() {
  const { loading, isAuthenticated } = useSession();
  const location = useLocation();
  const target = getAuthRouteTarget({ loading, isAuthenticated, pathname: location.pathname });
  if (target) return <Navigate to={target} replace />;
  return <Login onLogin={startLogin} isLoading={loading} />;
}

function ProtectedLayout() {
  const { user, loading, isAuthenticated, logout } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    setIsEntering(true);
    const timer = window.setTimeout(() => setIsEntering(false), 700);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated]);

  if (loading) return <SessionLoading />;
  const target = getAuthRouteTarget({ loading, isAuthenticated, pathname: location.pathname });
  if (target || !user) return <Navigate to={target || "/login"} replace />;
  return <ApplicationLayout userName={user.name || "Colaborador"} onLogout={() => { void logoutAndNavigate(logout, navigate); }} />;
}

function WorkspacePage({ section }: { section: "projects" | "templates" }) {
  const { user } = useSession();
  return <Home section={section} userName={user?.name || "Colaborador"} />;
}

function AppRoutes() {
  return <Routes>
    <Route path="/login" element={<LoginRoute />} />
    <Route path="/dashboard" element={<ProtectedLayout />}>
      <Route index element={<Navigate to="projects" replace />} />
      <Route path="projects" element={<WorkspacePage section="projects" />} />
      <Route path="templates" element={<WorkspacePage section="templates" />} />
      <Route path="trash" element={<Trash />} />
      <Route path="errors" element={<ErrorLogs />} />
    </Route>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>;
}

export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light" switchable><TooltipProvider><Toaster position="bottom-right" toastOptions={{ className: "vertex-toast" }} /><AuthProvider><AppRoutes /></AuthProvider></TooltipProvider></ThemeProvider></ErrorBoundary>; }
