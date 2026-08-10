import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { api } from "../lib/api";
import type { AuthSession } from "../types";
import { Button } from "../components/UI";

export function AuthPage({ onAuthenticated }: { onAuthenticated: (session: AuthSession) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    api<{ needsSetup: boolean }>("/auth/setup-status")
      .then((result) => {
        setNeedsSetup(result.needsSetup);
        if (result.needsSetup) setMode("register");
      })
      .catch(() => undefined);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const session = await api<AuthSession>(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({
          ...(mode === "register" ? { name: data.get("name") } : {}),
          email: data.get("email"),
          password: data.get("password"),
        }),
      });
      onAuthenticated(session);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  function changeMode(next: "login" | "register") {
    setMode(next);
    setError("");
  }

  return (
    <div className="auth-page">
      <section className="auth-showcase">
        <div className="auth-brand"><div className="brand-mark brand-mark-light"><span>M</span></div><strong>MFlow</strong></div>
        <div className="auth-showcase-content">
          <div className="auth-pill"><Sparkles size={15} /> Simples, claro e sob controle</div>
          <h1>Seu dinheiro.<br /><em>Seu ritmo.</em></h1>
          <p>Organize clientes, contratos e cobranças em um só lugar — com a visão que você precisa para decidir melhor.</p>
          <div className="auth-benefits">
            <span><Check size={16} /> Agenda de cobranças inteligente</span>
            <span><Check size={16} /> Controle de capital e rentabilidade</span>
            <span><Check size={16} /> Histórico completo por cliente</span>
          </div>
        </div>
        <div className="auth-quote"><ShieldCheck size={19} /><span>Seus dados financeiros protegidos e acessíveis apenas por você.</span></div>
        <div className="orb orb-one" /><div className="orb orb-two" />
      </section>

      <section className="auth-form-side">
        <div className="auth-mobile-brand"><div className="brand-mark"><span>M</span></div><strong>MFlow</strong></div>
        <div className="auth-form-wrap">
          <div className="auth-intro">
            <span className="eyebrow">{mode === "login" ? "Bem-vindo de volta" : "Primeiro acesso"}</span>
            <h2>{mode === "login" ? "Acesse sua conta" : "Crie sua conta"}</h2>
            <p>{mode === "login" ? "Entre para acompanhar sua operação financeira." : "Configure o administrador inicial do sistema."}</p>
          </div>
          <form onSubmit={submit} className="auth-form">
            {mode === "register" ? (
              <label><span>Seu nome</span><div className="auth-input"><ShieldCheck size={18} /><input name="name" required minLength={2} placeholder="Como podemos chamar você?" /></div></label>
            ) : null}
            <label><span>E-mail</span><div className="auth-input"><Mail size={18} /><input name="email" type="email" required placeholder="voce@exemplo.com" autoComplete="email" /></div></label>
            <label>
              <span>Senha</span>
              <div className="auth-input"><LockKeyhole size={18} /><input name="password" type={showPassword ? "text" : "password"} required minLength={6} placeholder="Mínimo de 6 caracteres" autoComplete={mode === "login" ? "current-password" : "new-password"} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
            </label>
            {error ? <div className="auth-error">{error}</div> : null}
            <Button loading={loading} className="auth-submit" type="submit">{mode === "login" ? "Entrar no sistema" : "Criar conta"}<ArrowRight size={18} /></Button>
          </form>
          {needsSetup || mode === "register" ? <p className="auth-switch">
            {mode === "login" ? "Configurando o sistema pela primeira vez?" : "Já possui uma conta?"}{" "}
            <button onClick={() => changeMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Criar acesso" : "Fazer login"}</button>
          </p> : null}
        </div>
        <p className="auth-footer">© {new Date().getFullYear()} Gestão financeira sem complicação.</p>
      </section>
    </div>
  );
}
