import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import type { AuthSession } from "@/shared/types";
import { Button } from "@/shared/ui";
import { authService } from "../services/auth.service";
import { AuthBrand } from "../components/AuthBrand";
import { useAuthSetup } from "../hooks/useAuthSetup";

export function AuthPage({ onAuthenticated }: { onAuthenticated: (session: AuthSession) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { needsSetup } = useAuthSetup();
  const activeMode = needsSetup ? "register" : mode;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const session = await authService.authenticate(activeMode, {
        ...(activeMode === "register" ? { name: String(data.get("name") || "") } : {}),
        email: String(data.get("email") || ""),
        password: String(data.get("password") || ""),
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
        <AuthBrand mobile />
        <div className="auth-form-wrap">
          <div className="auth-intro">
            <span className="eyebrow">{activeMode === "login" ? "Bem-vindo de volta" : "Primeiro acesso"}</span>
            <h2>{activeMode === "login" ? "Acesse sua conta" : "Crie sua conta"}</h2>
            <p>{activeMode === "login" ? "Entre para acompanhar sua operação financeira." : "Configure o administrador inicial do sistema."}</p>
          </div>
          <form onSubmit={submit} className="auth-form">
            {activeMode === "register" ? (
              <label><span>Seu nome</span><div className="auth-input"><ShieldCheck size={18} /><input name="name" required minLength={2} placeholder="Como podemos chamar você?" /></div></label>
            ) : null}
            <label><span>E-mail</span><div className="auth-input"><Mail size={18} /><input name="email" type="email" required placeholder="voce@exemplo.com" autoComplete="email" /></div></label>
            <label>
              <span>Senha</span>
              <div className="auth-input"><LockKeyhole size={18} /><input name="password" type={showPassword ? "text" : "password"} required minLength={6} placeholder="Mínimo de 6 caracteres" autoComplete={activeMode === "login" ? "current-password" : "new-password"} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
            </label>
            {error ? <div className="auth-error">{error}</div> : null}
            <Button loading={loading} className="auth-submit" type="submit">{activeMode === "login" ? "Entrar no sistema" : "Criar conta"}<ArrowRight size={18} /></Button>
          </form>
          {needsSetup || mode === "register" ? <p className="auth-switch">
            {activeMode === "login" ? "Configurando o sistema pela primeira vez?" : "Já possui uma conta?"}{" "}
            <button onClick={() => changeMode(activeMode === "login" ? "register" : "login")}>{activeMode === "login" ? "Criar acesso" : "Fazer login"}</button>
          </p> : null}
        </div>
        <p className="auth-footer">© {new Date().getFullYear()} Gestão financeira sem complicação.</p>
      </section>
    </div>
  );
}
