/* Cyperpuck design: cyberpunk esportivo editorial, composição assimétrica, Space Grotesk + DM Sans, ciano plasma e âmbar de impacto. */
import { FormEvent, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Check, ChevronRight, CircleDot, Menu, Radio, ScanLine, X } from "lucide-react";
import { toast } from "sonner";

const heroImage = "/manus-storage/cyperpuck-hero_41913a1d.jpg";
const puckImage = "/manus-storage/cyperpuck-puck-detail_06c2a388.jpg";
const textureImage = "/manus-storage/cyperpuck-interface_38937bf1.jpg";
const markImage = "/manus-storage/cyperpuck-mark_1764a747.png";

const benefits = [
  { number: "01", title: "Jogo que responde", body: "Velocidade, precisão e leitura de espaço em uma arena desenhada para manter você em movimento." },
  { number: "02", title: "Tecnologia que aparece", body: "Cada impacto vira parte do espetáculo: luz, som e dados transformam a partida em transmissão." },
  { number: "03", title: "Comunidade em órbita", body: "Uma nova cultura esportiva para quem cria, compete e quer ocupar o primeiro capítulo do futuro." },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Insira um e-mail válido para entrar na lista.");
      return;
    }
    setSubmitted(true);
    toast.success("Você entrou na lista de lançamento.");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#080b10] text-[#f3f7f5] selection:bg-[#6fffe9] selection:text-[#080b10]">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.08]" style={{ backgroundImage: `url(${textureImage})`, backgroundSize: "cover" }} />
      <div className="relative z-10">
        <header className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
          <a href="#top" className="group flex items-center gap-3" aria-label="Cyperpuck, início">
            <span className="relative grid h-10 w-10 place-items-center border border-[#6fffe9]/60 bg-[#0d151a] transition-transform duration-200 group-hover:-rotate-6">
              <img src={markImage} alt="" className="h-7 w-7 object-contain" />
            </span>
            <span className="leading-none"><strong className="block font-display text-lg tracking-[0.14em]">CYPERPUCK</strong><small className="font-display text-[9px] tracking-[0.25em] text-[#6fffe9]">// FUTURE IN PLAY</small></span>
          </a>
          <nav className="hidden items-center gap-9 font-display text-[11px] uppercase tracking-[0.18em] text-[#a8b6b7] md:flex" aria-label="Navegação principal">
            <a className="transition-colors hover:text-[#6fffe9]" href="#system">O sistema</a>
            <a className="transition-colors hover:text-[#6fffe9]" href="#why">Por que agora</a>
            <a className="transition-colors hover:text-[#6fffe9]" href="#launch">Lançamento</a>
          </nav>
          <a href="#launch" className="hidden border border-[#6fffe9]/50 px-4 py-3 font-display text-[10px] uppercase tracking-[0.16em] text-[#6fffe9] transition hover:bg-[#6fffe9] hover:text-[#080b10] sm:block">Entrar na lista <ArrowUpRight className="ml-2 inline h-3 w-3" /></a>
          <button className="border border-[#6fffe9]/40 p-2 text-[#6fffe9] md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </header>
        {menuOpen && <nav className="mx-5 border-y border-[#26363a] bg-[#0d151a] px-5 py-5 md:hidden" aria-label="Menu móvel"><div className="flex flex-col gap-5 font-display text-xs uppercase tracking-[0.18em] text-[#a8b6b7]"><a href="#system" onClick={() => setMenuOpen(false)}>O sistema</a><a href="#why" onClick={() => setMenuOpen(false)}>Por que agora</a><a href="#launch" onClick={() => setMenuOpen(false)}>Lançamento</a></div></nav>}

        <section id="top" className="mx-auto grid max-w-[1440px] items-end gap-10 px-5 pb-20 pt-12 sm:px-8 md:pt-20 lg:grid-cols-[0.83fr_1.17fr] lg:px-12 lg:pb-28">
          <div className="relative order-2 max-w-xl lg:order-1 lg:pb-8">
            <div className="mb-10 flex items-center gap-3 font-display text-[10px] uppercase tracking-[0.24em] text-[#6fffe9]"><Radio className="h-3.5 w-3.5 animate-pulse" /> Sistema ativo <span className="h-px w-12 bg-[#6fffe9]/50" /> 01—04</div>
            <h1 className="font-display text-[clamp(3.7rem,8vw,8.4rem)] font-semibold leading-[0.87] tracking-[-0.075em]">O futuro<br /><span className="text-[#6fffe9]">entra</span> em<br />campo<span className="text-[#ffb547]">.</span></h1>
            <p className="mt-9 max-w-md border-l border-[#6fffe9]/60 pl-5 text-base leading-7 text-[#a8b6b7] sm:text-lg">Cyperpuck é a próxima arena: um esporte de alta velocidade, tecnologia visível e uma comunidade pronta para jogar diferente.</p>
            <div className="mt-10 flex flex-wrap items-center gap-5"><a href="#launch" className="group inline-flex items-center gap-3 bg-[#6fffe9] px-5 py-4 font-display text-xs font-bold uppercase tracking-[0.13em] text-[#080b10] transition duration-200 hover:-translate-y-1 hover:bg-[#f3f7f5] active:scale-[0.97]">Quero jogar primeiro <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></a><a href="#system" className="group inline-flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.16em] text-[#a8b6b7] hover:text-[#6fffe9]">Ver o sistema <ArrowDownRight className="h-4 w-4 transition-transform group-hover:translate-y-1" /></a></div>
          </div>
          <div className="relative order-1 min-h-[360px] overflow-hidden border border-[#26363a] lg:order-2 lg:min-h-[610px]">
            <img src={heroImage} alt="Puck futurista atravessando uma arena escura com rastro de luz ciano" className="absolute inset-0 h-full w-full object-cover object-center opacity-85" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#080b10] via-transparent to-transparent opacity-80" /><div className="absolute inset-0 bg-gradient-to-t from-[#080b10]/90 via-transparent to-[#080b10]/10" />
            <div className="absolute left-5 top-5 flex items-center gap-2 border border-[#6fffe9]/40 bg-[#080b10]/70 px-3 py-2 font-display text-[9px] uppercase tracking-[0.16em] text-[#6fffe9] backdrop-blur-sm"><CircleDot className="h-3 w-3" /> Live prototype</div>
            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between font-display text-[9px] uppercase tracking-[0.15em] text-[#a8b6b7]"><span>Velocity / 092</span><span className="text-right text-[#ffb547]">Signal locked<br /><span className="text-[#a8b6b7]">São Paulo · 2026</span></span></div>
          </div>
        </section>

        <div className="border-y border-[#26363a] bg-[#0d151a] py-4"><div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 overflow-hidden px-5 font-display text-[10px] uppercase tracking-[0.2em] text-[#718183] sm:px-8 lg:px-12"><span className="whitespace-nowrap">// FUTURE IN PLAY</span><span className="hidden h-px flex-1 bg-[#26363a] sm:block" /><span className="whitespace-nowrap text-[#6fffe9]">No spectators. Only players.</span><span className="hidden h-px flex-1 bg-[#26363a] md:block" /><span className="whitespace-nowrap">Signal 00.01</span></div></div>

        <section id="system" className="relative mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32"><div className="absolute right-0 top-20 hidden h-px w-28 bg-[#ffb547] lg:block" /><div className="grid gap-12 lg:grid-cols-[0.34fr_0.66fr] lg:gap-20"><div><div className="sticky top-8"><p className="mb-5 font-display text-[10px] uppercase tracking-[0.24em] text-[#ffb547]">01 / O sistema</p><h2 className="max-w-xs font-display text-4xl font-medium leading-[0.96] tracking-[-0.05em] sm:text-5xl">Não é só um jogo.<br /><span className="text-[#6fffe9]">É um novo sinal.</span></h2><div className="mt-10 hidden border-l border-[#ffb547] pl-4 font-display text-[9px] uppercase leading-5 tracking-[0.16em] text-[#718183] sm:block">Arena feed<br /><span className="text-[#ffb547]">Impact zone / 03</span><br />Telemetry online</div></div></div><div className="relative grid gap-0 border-t border-[#26363a] lg:translate-y-7">{benefits.map((benefit) => <article key={benefit.number} className="relative grid gap-6 border-b border-[#26363a] py-8 sm:grid-cols-[90px_0.7fr_1fr] sm:gap-8 sm:py-10"><span className="font-display text-xs text-[#ffb547]">{benefit.number}</span><h3 className="font-display text-2xl tracking-[-0.04em] text-[#f3f7f5]">{benefit.title}</h3><p className="max-w-xs text-sm leading-6 text-[#8c9c9e]">{benefit.body}</p><span className="absolute right-0 top-3 font-display text-[8px] uppercase tracking-[0.18em] text-[#526366]">CAM / 0{benefit.number}</span></article>)}</div></div></section>

        <section id="why" className="relative border-y border-[#26363a] bg-[#0d151a] py-24 sm:py-32"><div className="absolute left-0 top-1/2 hidden h-px w-24 bg-[#6fffe9]/60 lg:block" /><div className="mx-auto grid max-w-[1440px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_0.72fr] lg:px-12"><div className="relative mx-auto w-full max-w-[520px] -rotate-1 lg:mx-0"><div className="absolute -left-5 -top-5 h-16 w-16 border-l border-t border-[#6fffe9]" /><div className="absolute -right-8 bottom-10 hidden font-display text-[9px] uppercase tracking-[0.18em] text-[#ffb547] lg:block">Trajectory / 46.2m</div><img src={puckImage} alt="Detalhe de um puck de competição Cyperpuck" className="aspect-square w-full object-cover grayscale-[0.2]" /><div className="absolute bottom-4 left-4 bg-[#080b10]/85 px-3 py-2 font-display text-[9px] uppercase tracking-[0.16em] text-[#6fffe9] backdrop-blur-sm">CP / Hardware 001</div></div><div className="max-w-lg lg:translate-x-8"><p className="mb-5 font-display text-[10px] uppercase tracking-[0.24em] text-[#ffb547]">02 / Por que agora</p><h2 className="font-display text-4xl font-medium leading-[0.95] tracking-[-0.05em] sm:text-6xl">A próxima geração não espera permissão<span className="text-[#6fffe9]">.</span></h2><p className="mt-7 text-base leading-7 text-[#a8b6b7]">Criamos o Cyperpuck para uma geração que cresceu entre o físico e o digital. Aqui, o corpo ainda é o controle — mas a arena finalmente acompanha a imaginação.</p><div className="mt-8 flex items-center gap-3 font-display text-[10px] uppercase tracking-[0.17em] text-[#6fffe9]"><ScanLine className="h-4 w-4" /> Primeiro sinal emitido <span className="ml-2 h-px w-16 bg-[#6fffe9]/50" /></div></div></div></section>

        <section id="launch" className="relative mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32"><div className="grid gap-14 lg:grid-cols-[1fr_0.8fr] lg:items-end"><div><p className="mb-5 font-display text-[10px] uppercase tracking-[0.24em] text-[#ffb547]">03 / Lançamento</p><h2 className="max-w-3xl font-display text-5xl font-medium leading-[0.9] tracking-[-0.06em] sm:text-7xl">Receba o primeiro<br /><span className="text-[#6fffe9]">pulso.</span></h2><p className="mt-7 max-w-md text-base leading-7 text-[#a8b6b7]">Entre na lista para acompanhar os testes, descobrir quando a arena abre e garantir seu lugar na primeira partida.</p></div><div className="border-t border-[#6fffe9]/50 pt-5"><div className="mb-7 flex items-center justify-between font-display text-[10px] uppercase tracking-[0.18em] text-[#718183]"><span>Access request</span><span className="text-[#6fffe9]">Open / 2026</span></div>{submitted ? <div className="flex items-center gap-3 border border-[#6fffe9]/50 bg-[#0d151a] p-5 text-sm text-[#f3f7f5]"><span className="grid h-7 w-7 place-items-center bg-[#6fffe9] text-[#080b10]"><Check size={16} /></span> Sinal recebido. A próxima atualização chega no seu e-mail.</div> : <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="email">Seu melhor e-mail</label><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="seu@email.com" className="min-h-14 flex-1 border border-[#26363a] bg-[#0d151a] px-4 font-display text-sm text-[#f3f7f5] outline-none transition placeholder:text-[#526366] focus:border-[#6fffe9]" /><button type="submit" className="group inline-flex min-h-14 items-center justify-center gap-3 bg-[#ffb547] px-5 font-display text-xs font-bold uppercase tracking-[0.12em] text-[#080b10] transition hover:-translate-y-1 hover:bg-[#ffd18a] active:scale-[0.97]">Entrar na lista <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button></form>}<p className="mt-4 text-xs leading-5 text-[#718183]">Sem spam. Apenas sinais importantes sobre a próxima partida.</p></div></div></section>

        <footer className="relative border-t border-[#26363a]"><div className="absolute left-0 top-0 h-px w-1/3 bg-[#ffb547]" /><div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-5 py-7 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center border border-[#6fffe9]/60 bg-[#0d151a]"><img src={markImage} alt="" className="h-6 w-6 object-contain" /></span><span className="font-display text-xs tracking-[0.18em]">CYPERPUCK</span></div><p className="font-display text-[9px] uppercase tracking-[0.17em] text-[#718183]">Construindo o esporte do próximo ciclo · © 2026</p><a href="#top" className="font-display text-[10px] uppercase tracking-[0.15em] text-[#6fffe9] hover:text-[#f3f7f5]">Voltar ao topo ↑</a></div></footer>
      </div>
    </main>
  );
}
