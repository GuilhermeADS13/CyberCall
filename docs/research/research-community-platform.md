# Pesquisa de produto — Cyperpuck como plataforma social

## Síntese

A pesquisa indica que uma plataforma de comunidade forte não deve começar tentando replicar toda a superfície de um produto maduro. O núcleo útil é uma combinação de espaços organizados, conversa em tempo real, descoberta guiada, identidade por papéis e ferramentas de moderação. A própria documentação do Discord recomenda começar com canais essenciais e adicionar outros somente quando a comunidade demonstrar necessidade, porque uma parede de canais vazios aumenta a sobrecarga para novos membros [1].

O modelo mais coerente para a Cyperpuck é uma plataforma centralizada com autenticação, persistência de mensagens e uma camada de eventos em tempo real. Arquiteturas de chat modernas separam mensagens, presença, notificações e armazenamento, e usam conexões persistentes como WebSocket para reduzir atraso e permitir que o servidor entregue eventos assim que acontecem [3].

## Funcionalidades priorizadas

| Camada              | Decisão para o MVP                                          | Motivo                                                                                                                                              |
| ------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identidade          | Login, perfil, avatar, nome e status                        | Sem identidade não há comunidade persistente.                                                                                                       |
| Comunidades         | Espaços/servidores com ícone, descrição e membros           | É a unidade principal de pertencimento.                                                                                                             |
| Organização         | Categorias e canais de texto com ordenação                  | Evita que a conversa vire um feed sem contexto.                                                                                                     |
| Conversa            | Mensagens, respostas, edição, exclusão e reações            | É o ciclo de valor mais frequente.                                                                                                                  |
| Presença            | Online, ausente e offline                                   | Cria contexto social imediato.                                                                                                                      |
| Moderação           | Papéis, permissões, silenciar, expulsar e registro de ações | Mantém o espaço seguro e governável.                                                                                                                |
| Onboarding          | Regras, seleção de interesses e canais recomendados         | Reduz abandono e dá uma primeira ação clara ao membro [1].                                                                                          |
| Comunicação ao vivo | Canal de voz/Stage como próxima etapa                       | O formato Stage separa moderadores, speakers e audiência; é melhor tratá-lo como módulo posterior porque exige WebRTC e política de permissões [2]. |
| Notificações        | Menções, respostas e mensagens diretas                      | Reengaja membros sem depender de presença constante.                                                                                                |

## Decisões arquiteturais

A primeira versão funcional deve migrar do projeto estático para o template full-stack com autenticação Manus, banco relacional e contratos tRPC. O banco deve separar usuários, comunidades, membros, papéis, categorias, canais, mensagens, reações e eventos de moderação. A interface pode começar com dados persistidos reais e atualizações otimistas; a entrega em tempo real pode ser introduzida inicialmente por invalidação rápida e, na sequência, por WebSocket/serviço de eventos quando a base de dados estiver estável.

A experiência visual não deve copiar a interface do Discord. A Cyperpuck manterá o Circuito Noturno: rail vertical, retículas, status de transmissão, ciano plasma e âmbar de alerta. A inspiração será funcional, não visual ou textual. Também não serão copiados código, marcas, textos proprietários ou ativos de terceiros.

## MVP recomendado

O MVP deve entregar login, criação e entrada em comunidades, layout de três painéis, lista de canais, histórico persistido, envio de mensagens, reações, respostas, busca básica, perfil e status, além de um painel mínimo de moderação. Mensagens diretas, anexos, notificações avançadas, canais de voz, vídeo, eventos e bots ficam na sequência, porque dependem de requisitos adicionais de armazenamento, realtime, WebRTC, segurança e observabilidade.

## Referências

[1]: https://docs.discord.com/developers/game-development/how-to-create-a-community-for-your-game "Discord Developer Documentation — How to Create a Community for Your Game"
[2]: https://support.discord.com/hc/en-us/articles/1500005513722-Stage-Channels-FAQ "Discord Support — Stage Channels FAQ"
[3]: https://trueconf.com/blog/reviews-comparisons/chat-app-system-design "TrueConf — Chat App System Design: Messaging Architecture"
[4]: https://github.com/Hemeka/Discord-Alternatives "Hemeka — Discord Alternatives"
