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
    <div className="auth-page grid min-h-screen grid-cols-[minmax(430px,.92fr)_minmax(430px,1.08fr)] bg-[#fbfafc] max-[860px]:min-h-dvh max-[860px]:grid-cols-1">
      <section className="auth-showcase relative flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_78%_18%,rgba(139,104,255,.2),transparent_26%),linear-gradient(145deg,#181420,#24202f_60%,#191520)] px-[clamp(35px,5vw,72px)] py-[35px] text-white max-[860px]:hidden">
        <div className="auth-brand z-[1] flex items-center gap-[11px]"><div className="brand-mark brand-mark-light grid size-[39px] shrink-0 -rotate-3 place-items-center rounded-xl bg-gradient-to-br from-[#9678ff] to-[#6540de] text-white shadow-[0_9px_28px_rgba(110,70,222,0.4)]"><span className="rotate-3 text-xl font-extrabold">M</span></div><strong className="text-xl">MFlow</strong></div>
        <div className="auth-showcase-content z-[1] my-auto max-w-[515px]">
          <div className="auth-pill flex w-max items-center gap-[7px] rounded-full border border-violet-300/20 bg-violet-500/10 px-[11px] py-[7px] text-[9px] font-bold text-[#c6b7ff]"><Sparkles size={15} /> Simples, claro e sob controle</div>
          <h1 className="mb-[18px] mt-[23px] text-[clamp(40px,5vw,68px)] leading-[.98] tracking-[-3.2px]">Seu dinheiro.<br /><em className="not-italic text-[#987df4]">Seu ritmo.</em></h1>
          <p className="m-0 max-w-[470px] text-[13px] leading-[1.7] text-[#aaa4b3]">Organize clientes, contratos e cobranças em um só lugar — com a visão que você precisa para decidir melhor.</p>
          <div className="auth-benefits mt-7 flex flex-col gap-[11px]">
            <span className="flex items-center gap-2 text-[10.5px] text-[#d0cad7] [&>svg]:rounded-full [&>svg]:bg-violet-400/15 [&>svg]:p-[3px] [&>svg]:text-[#c3b1ff]"><Check size={16} /> Agenda de cobranças inteligente</span>
            <span className="flex items-center gap-2 text-[10.5px] text-[#d0cad7] [&>svg]:rounded-full [&>svg]:bg-violet-400/15 [&>svg]:p-[3px] [&>svg]:text-[#c3b1ff]"><Check size={16} /> Controle de capital e rentabilidade</span>
            <span className="flex items-center gap-2 text-[10.5px] text-[#d0cad7] [&>svg]:rounded-full [&>svg]:bg-violet-400/15 [&>svg]:p-[3px] [&>svg]:text-[#c3b1ff]"><Check size={16} /> Histórico completo por cliente</span>
          </div>
        </div>
        <div className="auth-quote z-[1] flex items-center gap-[9px] border-t border-white/10 pt-5 text-[8.5px] text-[#85808d] [&>svg]:text-[#8e75e8]"><ShieldCheck size={19} /><span>Seus dados financeiros protegidos e acessíveis apenas por você.</span></div>
        <div className="orb orb-one absolute right-[-190px] top-[35%] size-[330px] rounded-full border border-violet-300/10 shadow-[inset_0_0_100px_rgba(120,80,240,.06)]" /><div className="orb orb-two absolute bottom-[8%] left-[-120px] size-[190px] rounded-full border border-violet-300/10" />
      </section>

      <section className="auth-form-side relative flex min-w-0 flex-col items-center justify-center p-[45px] max-[860px]:w-full max-[860px]:px-5 max-[860px]:py-[35px]">
        <AuthBrand mobile />
        <div className="auth-form-wrap w-[min(360px,100%)] min-w-0">
          <div className="auth-intro">
            <span className="eyebrow mb-2.5 block text-[9.5px] font-extrabold uppercase tracking-[1.2px] text-violet-600">{activeMode === "login" ? "Bem-vindo de volta" : "Primeiro acesso"}</span>
            <h2 className="m-0 text-[27px] tracking-[-0.85px] text-[#26222e]">{activeMode === "login" ? "Acesse sua conta" : "Crie sua conta"}</h2>
            <p className="mb-[26px] mt-2 text-[10.5px] text-[#8c8795]">{activeMode === "login" ? "Entre para acompanhar sua operação financeira." : "Configure o administrador inicial do sistema."}</p>
          </div>
          <form onSubmit={submit} className="auth-form flex flex-col gap-[15px] [&>label]:flex [&>label]:flex-col [&>label]:gap-[7px] [&>label>span]:text-xs [&>label>span]:font-bold [&>label>span]:text-[#4c4754]">
            {activeMode === "register" ? (
              <label><span>Seu nome</span><div className="auth-input flex h-11 items-center gap-2.5 rounded-[9px] border border-[#dfdce5] bg-white px-3 text-[#9c97a3] transition focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-100"><ShieldCheck className="shrink-0" size={18} /><input className="min-w-0 flex-1 border-0 bg-transparent text-[16px] text-[#302c37] outline-none placeholder:text-[#b1adb6] min-[641px]:text-[10.5px]" name="name" required minLength={2} placeholder="Como podemos chamar você?" /></div></label>
            ) : null}
            <label><span>E-mail</span><div className="auth-input flex h-11 items-center gap-2.5 rounded-[9px] border border-[#dfdce5] bg-white px-3 text-[#9c97a3] transition focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-100"><Mail className="shrink-0" size={18} /><input className="min-w-0 flex-1 border-0 bg-transparent text-[16px] text-[#302c37] outline-none placeholder:text-[#b1adb6] min-[641px]:text-[10.5px]" name="email" type="email" required placeholder="voce@exemplo.com" autoComplete="email" /></div></label>
            <label>
              <span>Senha</span>
              <div className="auth-input flex h-11 items-center gap-2.5 rounded-[9px] border border-[#dfdce5] bg-white px-3 text-[#9c97a3] transition focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-100"><LockKeyhole className="shrink-0" size={18} /><input className="min-w-0 flex-1 border-0 bg-transparent text-[16px] text-[#302c37] outline-none placeholder:text-[#b1adb6] min-[641px]:text-[10.5px]" name="password" type={showPassword ? "text" : "password"} required minLength={6} placeholder="Mínimo de 6 caracteres" autoComplete={activeMode === "login" ? "current-password" : "new-password"} /><button className="grid shrink-0 place-items-center border-0 bg-transparent p-0 text-[#9995a0]" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
            </label>
            {error ? <div className="auth-error rounded-lg border border-rose-200 bg-rose-50 px-[11px] py-[9px] text-[11px] leading-relaxed text-rose-700">{error}</div> : null}
            <Button loading={loading} className="auth-submit mt-[5px] min-h-11 w-full" type="submit">{activeMode === "login" ? "Entrar no sistema" : "Criar conta"}<ArrowRight size={18} /></Button>
          </form>
          {needsSetup || mode === "register" ? <p className="auth-switch mb-0 mt-[22px] text-center text-[9.5px] text-[#928d99]">
            {activeMode === "login" ? "Configurando o sistema pela primeira vez?" : "Já possui uma conta?"}{" "}
            <button className="border-0 bg-transparent p-0 text-[inherit] font-bold text-violet-700" onClick={() => changeMode(activeMode === "login" ? "register" : "login")}>{activeMode === "login" ? "Criar acesso" : "Fazer login"}</button>
          </p> : null}
        </div>
        <p className="auth-footer absolute bottom-[22px] m-0 text-[7.5px] text-[#aaa6ae]">© {new Date().getFullYear()} Gestão financeira sem complicação.</p>
      </section>
    </div>
  );
}
