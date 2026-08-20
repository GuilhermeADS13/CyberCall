import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { ArrowLeft, ArrowUpRight, Check, LockKeyhole, Radio, ShieldCheck, UserRound } from "lucide-react";
import { KeyboardEvent, MouseEvent, useRef, useState } from "react";
import { Link } from "wouter";

export const authModes = ["login", "signup"] as const;
type AuthMode = (typeof authModes)[number];

export const authLoadingLabel = "ABRINDO GATEWAY...";

export function focusAuthSubmitButton(button: Pick<HTMLButtonElement, "focus">) {
  button.focus();
}

export function getAuthSubmitA11yState(isSubmitting: boolean) {
  return {
    ariaBusy: isSubmitting,
    disabled: isSubmitting,
    announcement: isSubmitting ? "Redirecionando para autenticação segura" : "",
    preserveFocus: true,
  } as const;
}

export function getNextAuthTabIndex(key: string, index: number) {
  if (key === "Home") return 0;
  if (key === "End") return authModes.length - 1;
  if (key === "ArrowRight") return (index + 1) % authModes.length;
  if (key === "ArrowLeft") return (index - 1 + authModes.length) % authModes.length;
  return index;
}

export const authCopy = {
  login: { eyebrow: "Retomar conexão", title: "Entre no seu circuito.", cta: "Continuar com Manus" },
  signup: { eyebrow: "Primeiro acesso", title: "Abra seu próprio circuito.", cta: "Criar identidade segura" },
} as const;

const heroImage = "/manus-storage/cybercall-poster-background_febc1986.jpg";
const cyberCallLogo = "/manus-storage/cybercall-poster-logo_d5171e8f.png";
const cyberCallVideo = "/manus-storage/cybercall-background.mp4";

const benefits = [
  "Entre em comunidades com canais de texto, voz e vídeo.",
  "Mantenha suas mensagens, reações e convites sincronizados.",
  "Tenha uma camada de segurança pensada para cada sinal.",
];

export default function Auth() {
  const { user, loading, isAuthenticated, error } = useAuth();
  const [mode, setMode] = useState<AuthMode>(authModes[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleAuthSubmit(event: MouseEvent<HTMLButtonElement>) {
    focusAuthSubmitButton(event.currentTarget);
    if (isSubmitting) return;
    setIsSubmitting(true);
    window.setTimeout(() => startLogin(), 120);
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = getNextAuthTabIndex(event.key, index);
    const nextMode = authModes[nextIndex];
    setMode(nextMode);
    tabRefs.current[nextIndex]?.focus();
  }

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-[#080b10] font-display text-xs uppercase tracking-[0.2em] text-[#6fffe9]" role="status" aria-live="polite"><span className="cypher-glitch" data-text="VALIDANDO IDENTIDADE...">VALIDANDO IDENTIDADE...</span></div>;
  }

  if (error && !isAuthenticated) {
    return <main className="grid min-h-screen place-items-center bg-[#080b10] px-5 text-[#f3f7f5]"><section className="w-full max-w-md border border-[#ffb547]/60 bg-[#211a0f] p-6" role="alert" aria-live="assertive"><p className="font-display text-[9px] uppercase tracking-[0.18em] text-[#ffb547]">Sinal interrompido</p><h1 className="mt-3 font-display text-2xl">Não foi possível validar sua identidade.</h1><p className="mt-3 text-sm leading-6 text-[#b8c4c4]">O gateway não respondeu corretamente. Tente novamente ou retorne à arena; nenhuma senha local foi solicitada.</p><div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={() => window.location.reload()} className="cypher-neon-button bg-[#ffb547] px-4 py-3 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-[#080b10]">Tentar novamente</button><Link href="/" className="border border-[#26363a] px-4 py-3 font-display text-[10px] uppercase tracking-[0.14em] text-[#f3f7f5]">Voltar à arena</Link></div></section></main>;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080b10] text-[#f3f7f5] selection:bg-[#6fffe9] selection:text-[#080b10]">
      <video className="cybercall-video pointer-events-none absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline poster={heroImage} aria-hidden="true"><source src={cyberCallVideo} type="video/mp4" /></video>
      <div className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25 mix-blend-screen" style={{ backgroundImage: `url(${heroImage})` }} />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#080b10_0%,rgba(8,11,16,.88)_40%,rgba(8,11,16,.48)_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(rgba(111,255,233,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(111,255,233,.05) 1px, transparent 1px)", backgroundSize: "42px 42px" }} />
      <div className="pointer-events-none absolute -left-24 top-[-10%] h-[520px] w-[520px] rounded-full bg-[#6fffe9]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-[-10%] h-[520px] w-[520px] rounded-full bg-[#ffb547]/[0.06] blur-3xl" />

      <header className="relative flex items-center justify-between border-b border-[#26363a] px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-3 text-[#f3f7f5] transition hover:text-[#6fffe9]">
          <span className="grid h-9 w-9 place-items-center border border-[#6fffe9]/60 bg-[#080b10]/70 p-1 text-[#6fffe9]"><img src={cyberCallLogo} alt="" className="h-full w-full object-contain" /></span>
          <span><strong className="block font-display text-sm tracking-[0.16em]">CYBERCALL</strong><span className="font-display text-[8px] uppercase tracking-[0.2em] text-[#718183]">Future in communication / 01</span></span>
        </Link>
        <Link href="/" className="flex items-center gap-2 font-display text-[9px] uppercase tracking-[0.14em] text-[#718183] transition hover:text-[#6fffe9]"><ArrowLeft size={14} /> Voltar à arena</Link>
      </header>

      <div className="relative mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_460px] lg:gap-20 lg:py-16">
        <section className="max-w-xl">
          <div className="mb-6 flex items-center gap-2 font-display text-[9px] uppercase tracking-[0.22em] text-[#ffb547]"><span className="h-1.5 w-1.5 bg-[#ffb547] shadow-[0_0_12px_#ffb547]" /> Night circuit / acesso autorizado</div>
          <h1 className="max-w-lg font-display text-4xl leading-[0.95] tracking-[-0.06em] text-[#f3f7f5] sm:text-6xl">Sua próxima comunidade começa com um <span className="text-[#6fffe9]">sinal.</span></h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-[#8c9c9e]">Uma identidade para conversar, criar e organizar esquadrões no universo CyberCall. Entre com segurança e retome sua arena de onde parou.</p>
          <div className="mt-8 space-y-4">{benefits.map((benefit) => <div key={benefit} className="flex items-start gap-3 text-sm leading-6 text-[#b8c4c4]"><span className="mt-1 grid h-4 w-4 shrink-0 place-items-center border border-[#6fffe9]/50 text-[#6fffe9]"><Check size={11} /></span>{benefit}</div>)}</div>
          <div className="mt-10 grid max-w-md grid-cols-3 gap-2 border-t border-[#26363a] pt-5"><div><p className="font-display text-lg text-[#6fffe9]">01</p><p className="mt-1 font-display text-[8px] uppercase tracking-[0.14em] text-[#718183]">Identidade</p></div><div><p className="font-display text-lg text-[#ffb547]">24/7</p><p className="mt-1 font-display text-[8px] uppercase tracking-[0.14em] text-[#718183]">Sinal ativo</p></div><div><p className="font-display text-lg text-[#6fffe9]">0</p><p className="mt-1 font-display text-[8px] uppercase tracking-[0.14em] text-[#718183]">Senhas expostas</p></div></div>
        </section>

        <section className="cypher-auth-card border border-[#26363a] bg-[linear-gradient(145deg,rgba(17,26,31,.98),rgba(8,11,16,.98))] p-1 shadow-[0_0_45px_rgba(111,255,233,.06)]" aria-labelledby="auth-title">
          <div className="border border-[#26363a]/70 p-5 sm:p-7">
            {isAuthenticated ? <div className="py-8 text-center"><div className="mx-auto grid h-14 w-14 place-items-center border border-[#6fffe9] bg-[#6fffe9]/10 text-[#6fffe9]"><UserRound size={24} /></div><p className="mt-5 font-display text-[10px] uppercase tracking-[0.2em] text-[#6fffe9]">Identidade reconhecida</p><h1 id="auth-title" className="mt-2 font-display text-2xl tracking-[-0.04em]">Olá, {user?.name || "piloto"}.</h1><p className="mt-3 text-sm leading-6 text-[#8c9c9e]">Sua sessão já está ativa. Volte à arena para continuar.</p><Link href="/" className="mt-7 inline-flex items-center gap-2 bg-[#6fffe9] px-4 py-3 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-[#080b10] transition hover:bg-[#f3f7f5]">Abrir arena <ArrowUpRight size={14} /></Link></div> : <>
              <div className="flex items-center gap-2 font-display text-[9px] uppercase tracking-[0.16em] text-[#718183]"><Radio size={13} className="text-[#6fffe9]" /> Gateway de identidade</div>
              <div className="mt-6 grid grid-cols-2 border-b border-[#26363a]" role="tablist" aria-label="Modo de autenticação">
                {authModes.map((tabMode, index) => <button key={tabMode} ref={(element) => { tabRefs.current[index] = element; }} id={`auth-tab-${tabMode}`} type="button" role="tab" aria-selected={mode === tabMode} aria-controls="auth-panel" tabIndex={mode === tabMode ? 0 : -1} onKeyDown={(event) => handleTabKeyDown(event, index)} onClick={() => setMode(tabMode)} className={`cypher-auth-tab border-b-2 px-3 py-3 text-left font-display text-[10px] uppercase tracking-[0.16em] transition ${mode === tabMode ? (tabMode === "login" ? "border-[#6fffe9] text-[#6fffe9]" : "border-[#ffb547] text-[#ffb547]") : "border-transparent text-[#718183] hover:text-[#f3f7f5]"}`}>{tabMode === "login" ? "Entrar" : "Criar conta"}</button>)}
              </div>
              <div id="auth-panel" className="mt-7" role="tabpanel" aria-labelledby={`auth-tab-${mode}`} aria-live="polite">
                <p className="font-display text-[9px] uppercase tracking-[0.18em] text-[#ffb547]">{authCopy[mode].eyebrow}</p>
                <h1 id="auth-title" className="mt-2 font-display text-3xl tracking-[-0.05em]">{authCopy[mode].title}</h1>
                <p className="mt-3 text-sm leading-6 text-[#8c9c9e]">{mode === "login" ? "Use sua identidade Manus para voltar às comunidades, DMs e salas." : "Crie sua identidade com o acesso seguro Manus. Você poderá personalizar seu perfil depois."}</p>
                <button type="button" onClick={handleAuthSubmit} disabled={getAuthSubmitA11yState(isSubmitting).disabled} aria-busy={getAuthSubmitA11yState(isSubmitting).ariaBusy} className="cypher-neon-button mt-7 flex w-full items-center justify-center gap-3 bg-[#6fffe9] px-4 py-4 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-[#080b10] transition hover:bg-[#f3f7f5] active:scale-[0.98] disabled:cursor-wait disabled:opacity-80">{isSubmitting ? <><span className="cypher-glitch" data-text={authLoadingLabel}>{authLoadingLabel}</span><span className="sr-only">{getAuthSubmitA11yState(isSubmitting).announcement}</span></> : <><LockKeyhole size={16} /> {authCopy[mode].cta}<ArrowUpRight size={15} /></>}</button>
                <div className="mt-5 flex items-start gap-3 border-l border-[#6fffe9] bg-[#101c20] p-3"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#6fffe9]" /><p className="text-xs leading-5 text-[#8c9c9e]">Sem senha local para vazar. O gateway autentica sua sessão e protege o retorno para o CyberCall.</p></div>
                <p className="mt-6 text-center font-display text-[8px] uppercase tracking-[0.14em] text-[#526366]">Ao continuar, você aceita os termos da arena e a política de sinal.</p>
              </div>
            </>}
          </div>
        </section>
      </div>
    </main>
  );
}
