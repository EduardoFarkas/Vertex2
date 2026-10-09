import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";
import { getErrorAuthHeaders } from "@/lib/errorAuth";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  requestId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, requestId: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, requestId: null };
  }

  componentDidCatch() {
    void fetch("/api/client-errors", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...getErrorAuthHeaders() }, body: JSON.stringify({ action: "render_interface", route: window.location.pathname, code: "CLIENT_RENDER_ERROR" }) })
      .then((response) => response.ok ? response.json() : null)
      .then((result: { requestId?: string } | null) => { if (result?.requestId) this.setState({ requestId: result.requestId }); })
      .catch(() => undefined);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-2">Esta tela encontrou um problema.</h2>
            <p className="mb-5 max-w-lg text-center text-sm text-muted-foreground">O conteúdo não foi carregado corretamente. Tente recarregar a tela; se o problema continuar, informe o ID de suporte abaixo.</p>
            {this.state.requestId && <p className="mb-5 font-mono text-xs text-muted-foreground">ID de suporte: {this.state.requestId}</p>}

            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
              Recarregar tela
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
