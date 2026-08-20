# CyberCall

[![CyberCall CI](https://github.com/GuilhermeADS13/CyberCall/actions/workflows/ci.yml/badge.svg)](https://github.com/GuilhermeADS13/CyberCall/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

CyberCall é uma plataforma social full-stack inspirada em comunidades em tempo real, com estética **Night Circuit** e foco em comunicação, moderação e chamadas de áudio/vídeo. O produto combina comunidades, canais, mensagens persistentes, DMs, convites de sala, sinalização WebSocket, WebRTC mesh e controles de mídia em uma interface responsiva cyberpunk.

> **Estado atual:** aplicação funcional em desenvolvimento, com autenticação Manus OAuth, persistência Drizzle/MySQL/TiDB, sincronização realtime e chamadas WebRTC em malha. O projeto ainda exige infraestrutura TURN para melhorar conectividade em redes restritivas e um scanner antimalware para liberar documentos e PDFs.

## Prévia visual

![Interface principal do CyberCall](docs/screenshots/cybercall-home-desktop.png)

A imagem acima apresenta o shell Night Circuit em desktop. A experiência de voz/vídeo, medidor de microfone, destaque de fala e indicadores de rede aparecem dentro do overlay de chamada após autenticação e entrada em um canal de voz. Para acompanhar o código e os testes, consulte o [workflow CyberCall CI](.github/workflows/ci.yml).

## Funcionalidades

| Área           | Implementação                                                                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Comunidades    | Rail filtrável, comunidades, categorias recolhíveis, canais de texto e voz, busca, convites e estados de descoberta.                                                  |
| Mensagens      | Histórico persistente, envio, edição e exclusão pelo autor, marcação de mensagem editada, reações, DMs e anexos de imagem.                                            |
| Realtime       | WebSocket autenticado em `/api/realtime`, inscrições isoladas por comunidade/canal/DM, reconexão, heartbeat, deduplicação e presença.                                 |
| Voz e vídeo    | Salas acessíveis, convites persistidos, sinalização WebRTC por offer/answer/ICE, captura de microfone/câmera, peers remotos e cleanup.                                |
| Mídia avançada | Compartilhamento de tela, troca de microfone/câmera, seleção de saída de áudio com `setSinkId` quando disponível e renegociação de tracks.                            |
| Indicadores    | Medidor RMS do microfone, sensibilidade visual configurável, detecção de fala e destaque do participante ativo, qualidade de rede por peer.                           |
| Perfil         | Avatar com recorte e zoom, presença Online/Ausente/Ocupado/Invisível, configurações acessíveis e persistência local das preferências.                                 |
| Segurança      | Autorização por autoria e comunidade, isolamento de signaling, allowlist de anexos, validação de assinatura, moderação visual e política fail-closed para documentos. |
| Assistente     | CyberCall Assist com FAQ server-side para dúvidas sobre a plataforma.                                                                                                 |
| Acessibilidade | Foco inicial em modais, Escape, ARIA, `aria-live`, labels de mídia, fallback sem Web Audio API e suporte a `prefers-reduced-motion`.                                  |

## Stack

A aplicação usa React 19, Vite, Tailwind CSS 4, Express, tRPC 11, Drizzle ORM, MySQL/TiDB, Manus OAuth, Vitest, WebSocket (`ws`), WebRTC e AI SDK para o assistente. Arquivos enviados devem usar o fluxo de armazenamento S3 disponibilizado pelo template full-stack.

## Arquitetura

O frontend principal está em `client/src/pages/Home.tsx`, que compõe o shell da comunidade, chat, perfil, avatar editor e sala de voz/vídeo. O módulo `client/src/lib/realtime.ts` mantém a conexão WebSocket do navegador; `client/src/lib/webrtc.ts` gerencia peers, signaling, renegociação, métricas e streams; `client/src/lib/microphoneMeter.ts` mede volume RMS; e `client/src/lib/speechDetector.ts` identifica atividade de fala.

No servidor, `server/realtime.ts` implementa o hub WebSocket autenticado e roteia presença, mensagens e signaling somente para escopos autorizados. `server/routers.ts` contém os contratos tRPC e mutations persistentes. `server/db.ts` concentra helpers de dados e autorização. O endpoint HTTP de realtime é registrado no mesmo servidor que atende OAuth, tRPC, uploads e Vite.

## Execução local

Pré-requisitos: Node.js 22 ou compatível, pnpm 10 e uma instância MySQL/TiDB para os recursos persistentes. Copie `.env.example` para `.env` e preencha as credenciais antes do primeiro `pnpm dev`.

```bash
pnpm install
pnpm check
pnpm test --run
pnpm build
pnpm dev
```

Em desenvolvimento o servidor procura uma porta livre a partir de `PORT`. Em produção ele usa exatamente a porta injetada pelo ambiente: subir em outra porta transformaria o health check em falha silenciosa. Todas as variáveis estão documentadas em `.env.example`. Não versione `.env`, tokens ou credenciais.

## Realtime e WebRTC

O canal WebSocket usa autenticação por cookie de sessão e fallback Bearer para previews em que cookies podem não estar disponíveis. Eventos de mensagem são entregues somente ao canal assinado; eventos de comunidade carregam presença, e eventos de voz são direcionados por `roomKey` e `targetUserId`.

A chamada atual utiliza topologia mesh: cada participante cria conexões peer-to-peer com os demais. A qualidade é estimada periodicamente com `RTCPeerConnection.getStats()`, considerando RTT, perda de pacotes e estado da conexão.

Os servidores ICE são lidos do ambiente por `buildRtcConfiguration` em `client/src/lib/webrtc.ts`. Sem `VITE_TURN_URLS` a aplicação cai apenas no STUN público, e a chamada falha em NAT simétrico, rede corporativa e parte das operadoras móveis. Para grupos maiores que ~5 participantes o mesh satura o upload de cada cliente e a topologia precisa migrar para SFU.

## Segurança

O cookie de sessão usa `SameSite=None` para continuar funcionando dentro de previews em iframe, o que significa que o navegador o envia também em requisições cross-site. Por isso:

- Toda requisição não idempotente em `/api` precisa vir de uma origem confiável (`server/origin.ts`). A própria origem do serviço é sempre aceita; domínios extras entram em `ALLOWED_ORIGINS`.
- O upgrade do WebSocket em `/api/realtime` valida `Origin` antes do handshake. Sem isso, qualquer página conseguiria abrir um socket autenticado com o cookie da vítima.
- `/api` tem rate limit por IP, os comandos realtime têm limite por usuário e o chat da sala tem um limite próprio mais estrito.
- Leitura de canais, histórico e membros exige sessão autenticada **e** membership na comunidade, tanto no tRPC quanto no WebSocket.
- Em produção o servidor envia CSP, HSTS, `Permissions-Policy`, `X-Content-Type-Options`, `X-Frame-Options` e `Referrer-Policy`.

## Política de uploads

Imagens passam por allowlist de MIME/extensão, limite de tamanho, sanitização de nome, validação de assinatura e moderação visual antes de serem exibidas. Documentos e PDFs continuam bloqueados por política fail-closed até que um scanner antimalware seja configurado. A integração futura prevista usa `CLOUDMERSIVE_API_KEY`; a credencial não deve ser colocada no código nem no repositório.

As permissões de mensagens são author-only para edição e exclusão. O signaling verifica autenticação, membership e escopo de sala antes de encaminhar offers, answers e ICE. Qualquer expansão de permissões administrativas deve preservar o papel de moderador/admin e os registros de auditoria planejados.

## Testes e validação

A suíte Vitest cobre autorização do router, origem confiável, rate limiting, comunidades, mensagens, anexos, moderação, presença, WebSocket, signaling, WebRTC, medidor de microfone, detector de fala e notificações. A validação mais recente registrou **88 testes passando**, 1 teste antimalware ignorado, `pnpm check` sem erros e build de produção concluído.

Duas limitações conhecidas da suíte: parte dos testes de interface ainda verifica o texto do código-fonte em vez do comportamento renderizado (não há jsdom nem testing-library configurados), e não existe cobertura end-to-end. O build mantém um aviso de chunk grande — o assistente arrasta mermaid, cytoscape e shiki através do `streamdown`, cerca de 2,8 MB carregados sob demanda ao abrir o bot.

As revisões visuais estão em `docs/visual-reviews/`, os contratos de realtime e upload em `docs/contracts/` e as notas de pesquisa em `docs/research/`. Esses arquivos apoiam a validação, mas não substituem o teste de uma chamada real com dois navegadores e permissões de câmera/microfone.

## Próximos passos

Em ordem de impacto:

1. **Provisionar TURN** e preencher `VITE_TURN_URLS` — a configuração já existe, falta a infraestrutura. É o que separa a chamada de funcionar só na mesma rede.
2. **Aplicar `docs/optional-foreign-keys.sql`** depois de verificar órfãos, fechando a integridade referencial que os índices já suportam.
3. **Persistir avatar, presença e nome de exibição** no banco: hoje ficam só no `localStorage` e não são vistos pelos outros participantes.
4. **Persistir o chat da sala de voz**, que hoje vive apenas na memória do processo e some a cada restart.
5. **Paginação de histórico** — `listMessages` está fixo nas últimas 100 mensagens, sem cursor.
6. **Estado realtime compartilhado** (Redis ou equivalente) para permitir mais de uma instância; hoje presença, salas e chat são locais ao processo.
7. **Testes de componente com jsdom/testing-library** e um fluxo E2E de chamada.
8. **Moderação com papéis aplicados** (kick, ban, mute) e auditoria persistente.
9. **Observabilidade**: log estruturado, métricas de RTT/perda e error tracking.
10. **Scanner antimalware** para liberar PDFs e documentos, hoje bloqueados fail-closed.

## Licença

O repositório mantém a licença MIT existente. Consulte `LICENSE` para os termos completos.
