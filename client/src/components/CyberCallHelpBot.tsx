import { AIChatBox, type Message } from "@/components/AIChatBox";
import { trpc } from "@/lib/trpc";
import { HelpCircle, X } from "lucide-react";
import { useState } from "react";

const welcome: Message = {
  role: "assistant",
  content: "Olá, piloto. Posso explicar login, comunidades, mensagens, salas, convites, perfil, notificações e segurança da CyberCall.",
};

export const cyberCallHelpPrompts = [
  "Como entro ou crio uma conta?",
  "Como crio uma comunidade e um canal?",
  "Como entro em uma sala de vídeo?",
  "Por que um anexo pode ser bloqueado?",
];

export function CyberCallHelpBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const helpMutation = trpc.helpBot.ask.useMutation({
    onSuccess: (result) => setMessages((current) => [...current, { role: "assistant", content: result.content }]),
    onError: (error) => setMessages((current) => [...current, { role: "assistant", content: error.message || "O assistente perdeu o sinal. Tente novamente." }]),
  });

  function handleSend(content: string) {
    const nextMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    const helpMessages: Array<{ role: "user" | "assistant"; content: string }> = nextMessages.filter((item) => item.role !== "system").map((item) => ({ role: item.role as "user" | "assistant", content: item.content }));
    helpMutation.mutate({ messages: helpMessages });
  }

  return <>
    {open && <section className="cybercall-help-panel fixed bottom-20 right-4 z-50 flex w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden border border-[#6fffe9]/40 bg-[#080b10]/95 shadow-[0_0_40px_rgba(111,255,233,.16)] backdrop-blur-md" role="dialog" aria-modal="false" aria-labelledby="cybercall-help-title">
      <header className="flex items-center justify-between border-b border-[#26363a] px-4 py-3"><div><p className="font-display text-[9px] uppercase tracking-[0.18em] text-[#ffb547]">Support signal / FAQ</p><h2 id="cybercall-help-title" className="mt-1 font-display text-sm tracking-[0.08em] text-[#f3f7f5]">CYBERCALL ASSIST</h2></div><button type="button" onClick={() => setOpen(false)} className="p-2 text-[#718183] transition hover:text-[#6fffe9]" aria-label="Fechar assistente"><X size={16} /></button></header>
      <AIChatBox messages={messages} onSendMessage={handleSend} isLoading={helpMutation.isPending} height="min(520px,calc(100vh - 9rem))" placeholder="Pergunte sobre a CyberCall..." emptyStateMessage="Escolha uma dúvida para iniciar." suggestedPrompts={cyberCallHelpPrompts} className="rounded-none border-0 bg-transparent shadow-none [&_textarea]:border-[#26363a] [&_textarea]:bg-[#111a1f] [&_textarea]:text-[#f3f7f5] [&_button]:bg-[#6fffe9] [&_button]:text-[#080b10]" />
      <p className="border-t border-[#26363a] px-4 py-2 font-display text-[8px] uppercase tracking-[0.12em] text-[#526366]">Não compartilhe senhas, tokens ou dados sensíveis.</p>
    </section>}
    <button type="button" onClick={() => setOpen((value) => !value)} className="cybercall-help-trigger fixed bottom-4 right-4 z-50 flex items-center gap-2 border border-[#6fffe9]/60 bg-[#0b1115]/95 px-3 py-3 font-display text-[9px] uppercase tracking-[0.14em] text-[#6fffe9] shadow-[0_0_20px_rgba(111,255,233,.12)] transition hover:bg-[#6fffe9] hover:text-[#080b10]" aria-expanded={open} aria-controls="cybercall-help-title"><HelpCircle size={16} /> <span className="hidden sm:inline">Ajuda CyberCall</span></button>
  </>;
}
