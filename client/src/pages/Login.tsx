import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, User as UserIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";

type LoginProps = { onLogin?: () => void; isLoading?: boolean };

type Mode = "signin" | "signup";

export default function Login({ onLogin, isLoading = false }: LoginProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      void utils.auth.me.invalidate();
      navigate("/dashboard", { replace: true });
    },
    onError: err => setError(err.message),
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      void utils.auth.me.invalidate();
      navigate("/dashboard", { replace: true });
    },
    onError: err => setError(err.message),
  });

  const pending = loginMutation.isPending || registerMutation.isPending || isLoading;
  const isSignup = mode === "signup";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (isSignup) {
      registerMutation.mutate({ name, email, password });
    } else {
      loginMutation.mutate({ email, password });
    }
  };

  const switchMode = () => {
    setMode(isSignup ? "signin" : "signup");
    setError(null);
  };

  return (
    <main className={`login-shell ${pending ? "is-submitting" : ""}`}>
      <div className="login-aside">
        <div className="login-mark" aria-hidden="true"><i /><i /></div>
        <span className="login-overline">VERTEX ECHAD · ACESSO INTERNO</span>
        <h1>O trabalho da equipe, em um só lugar.</h1>
        <p>Projetos, ferramentas e documentos para continuar criando sem sair do ambiente da empresa.</p>
        <div className="login-aside-foot">
          <span><ShieldCheck size={14} /> Ambiente restrito a colaboradores</span>
          <span>v2.0 · Workspace conectado</span>
        </div>
      </div>
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-card-brand">
          <div className="login-mini-mark"><i /><i /></div>
          <span>VERTEX ECHAD</span>
        </div>
        <div className="login-heading">
          <span className="eyebrow"><span className="eyebrow-line" />Portal interno</span>
          <h2 id="login-title">{isSignup ? "Criar sua conta." : "Entrar no workspace."}</h2>
          <p>{isSignup ? "Cadastre-se com e-mail e senha para acessar o ambiente interno." : "Use seu e-mail e senha para abrir projetos, salvar versões e colaborar com segurança."}</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {isSignup && (
            <label>
              Nome
              <span className="login-input-wrap">
                <UserIcon size={15} />
                <input
                  type="text"
                  value={name}
                  autoComplete="name"
                  placeholder="Seu nome"
                  onChange={e => setName(e.target.value)}
                  required
                />
              </span>
            </label>
          )}
          <label>
            E-mail
            <span className="login-input-wrap">
              <Mail size={15} />
              <input
                type="email"
                value={email}
                autoComplete="email"
                placeholder="voce@empresa.com"
                onChange={e => setEmail(e.target.value)}
                required
              />
            </span>
          </label>
          <label>
            Senha
            <span className="login-input-wrap">
              <LockKeyhole size={15} />
              <input
                type="password"
                value={password}
                autoComplete={isSignup ? "new-password" : "current-password"}
                placeholder={isSignup ? "Mínimo de 8 caracteres" : "Sua senha"}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </span>
          </label>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button className="button button-dark login-submit" type="submit" disabled={pending}>
            {pending ? "Verificando…" : isSignup ? "Criar conta e entrar" : "Entrar"}
            <ArrowRight size={15} />
          </button>
        </form>
        <div className="login-note">
          <LockKeyhole size={13} />
          <button type="button" className="login-switch" onClick={switchMode}>
            {isSignup ? "Já tenho conta. Entrar" : "Primeiro acesso? Criar conta"}
          </button>
        </div>
      </section>
    </main>
  );
}
