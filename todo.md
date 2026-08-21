# Evolução para plataforma social

- [x] Pesquisar padrões de comunidades, canais, mensagens, presença, moderação e notificações em fontes públicas confiáveis.
- [x] Consultar referências relevantes no GitHub e em blogs técnicos, sem copiar código proprietário.
- [x] Definir o MVP funcional da Cyperpuck e registrar decisões arquiteturais.
- [x] Avaliar a migração do projeto estático para full-stack com autenticação, banco e recursos em tempo real.
- [x] Implementar a interface social principal com identidade visual Cyperpuck.
- [x] Validar fluxos essenciais e preparar checkpoint de entrega.
- [x] Registrar roadmap do próximo ciclo: anexos, notificações avançadas, voz/vídeo e moderação administrativa completa.
- [x] Implementar mensagens diretas persistidas. entre usuários.
- [x] Adicionar reações persistidas às mensagens; edição permanece no próximo ciclo.
- [x] Implementar notificações persistidas; voz/vídeo com WebRTC permanece no próximo ciclo.
- [x] Adicionar atualização persistida de mensagens com timestamp de edição.
- [x] Adicionar exclusão persistida de mensagens com autorização do autor.
- [x] Conectar controles de editar/excluir à interface com confirmação e marcador “editado”.
- [x] Adicionar testes de permissão e validar tipos, testes, build e responsividade.
- [x] Definir formatos, tamanho máximo e estados de upload para anexos.
- [x] Adicionar persistência de metadados e armazenamento seguro dos anexos.
- [x] Implementar upload de imagens e arquivos com pré-visualização de imagens.
- [x] Validar acesso, erros, responsividade, testes e build.
- [x] Analisar a referência oficial de Cyberpunk e registrar princípios visuais reutilizáveis sem copiar conteúdo proprietário.
- [x] Reorientar a interface Cyperpuck para uma experiência neon/cinematográfica própria.
- [x] Concluir o fluxo de upload e persistência de anexos com pré-visualização de imagens.
- [x] Reforçar segurança de uploads, autenticação, autorização, limites, MIME e abuso.
- [x] Validar a nova experiência em desktop/mobile e salvar checkpoint.
- [x] Definir política de bloqueio para arquivos maliciosos, imagens inadequadas e falsificação de MIME.
- [x] Implementar inspeção segura antes de persistir ou expor anexos.
- [x] Adicionar estado de moderação e mensagens de rejeição no upload e no composer.
- [x] Criar testes contra bypasses e validar tipos, testes, build e responsividade.
- [x] Adiar a escolha do provedor antimalware; política fail-closed documentada e mantida.
- [x] Adiar configuração do segredo server-side até o usuário fornecer uma chave.
- [x] Adiar quarentena, envio, polling e liberação até a ativação do provedor.
- [x] Manter documentos/PDFs bloqueados até a ativação do antimalware.
- [x] Adiar testes do provedor até a credencial e integração serem ativadas.
- [x] Manter a integração antimalware real em espera e preservar bloqueio fail-closed para documentos/PDFs.
- [x] Criar hero 3D com puck holográfico, perspectiva e movimento suave.
- [x] Adicionar microinterações de hover, foco, seleção de comunidade e troca de canal.
- [x] Adicionar funcionalidades sociais prioritárias além do chat: busca melhorada, presença e atalhos de navegação.
- [x] Validar `prefers-reduced-motion`, performance via code-splitting/manualChunks, mobile, testes e build.
- [x] Criar layout navegável para salas de voz e vídeo.
- [x] Adicionar participantes, estados de microfone/câmera e indicador de fala.
- [x] Adicionar controles de entrar, sair, mutar, câmera, compartilhar tela e configurações.
- [x] Validar acessibilidade, responsividade, estados vazios e build.
- [x] Manter WebRTC real como etapa posterior, sem simular conexão persistente no backend.
- [x] Adicionar convite por link e convite para membros da comunidade.
- [x] Adicionar lista de participantes com menu de moderação.
- [x] Implementar silenciar e remover participante com confirmação e feedback.
- [x] Exibir permissões de moderador e manter WebRTC real como etapa posterior.
- [x] Validar acessibilidade, responsividade, testes e build.
- [x] Implementar menu contextual de moderação por participante.
- [x] Exibir controles de moderação somente quando o usuário tiver papel de moderador/administrador, documentando o fallback visual da etapa sem WebRTC.
- [x] Definir estados persistidos de convite: pendente, aceito, recusado e expirado.
- [x] Emitir convites de sala para usuários e gerar notificação em tempo quase real via polling.
- [x] Criar alerta cyberpunk com contador e ações de aceitar/recusar.
- [x] Atualizar o estado da sala após aceitar e cobrir acessibilidade e responsividade.
- [x] Validar notificações, permissões, testes e build.
- [x] Restringir emissão de convite a membros autorizados da comunidade/sala.
- [x] Cobrir tentativa de convite por usuário sem participação/permissão com `FORBIDDEN`.
- [x] Revalidar convites, permissões, tipos, testes e build após a correção.
- [x] Exibir estado e botão explícito para pedir permissão de notificações nativas.
- [x] Disparar notificação nativa para novos convites quando autorizado.
- [x] Manter fallback visual e mensagens claras para negado, bloqueado ou indisponível.
- [x] Validar caminho de segundo plano via helper Notification, acessibilidade com aria-live/role, responsividade, testes e build.
- [x] Validar explicitamente o fluxo de notificação nativa com a aba em segundo plano via teste do helper e registrar o resultado.
- [x] Revisar acessibilidade objetiva da central e do estado de permissão, incluindo teclado e leitor de tela, e revalidar testes/build.

- [x] Criar aba/rota de autenticação com login e cadastro em estética Night Circuit.
- [x] Integrar CTA de login ao fluxo Manus OAuth existente sem duplicar callback ou quebrar nonce/CSRF.
- [x] Adicionar estados de carregamento, erro, usuário autenticado e retorno à comunidade.
- [x] Validar acessibilidade por teclado/leitor de tela, responsividade, testes e build.

- [x] Pesquisar a referência oficial de Cyberpunk e mapear paleta, composição, tipografia e tratamento de imagem sem copiar assets protegidos.
- [x] Criar ou selecionar assets originais com atmosfera futurista semelhante e hospedá-los no fluxo correto do WebDev.
- [x] Aplicar o redesign visual na autenticação e na experiência social, preservando acessibilidade e performance.
- [x] Validar responsividade, testes, build e revisão visual após o redesign.

- [x] Adicionar estado de erro explícito na rota `/auth` para falhas de autenticação/sessão, com mensagem orientativa e CTA de recuperação/retorno.
- [x] Validar a aba `/auth` com foco de teclado e semântica de leitor de tela, incluindo ordem de foco, tabs com IDs/ARIA e estados anunciados.
- [x] Adicionar teste cobrindo copy, CTA e estados do contrato da experiência de autenticação e reexecutar check/test/build.

- [x] Adicionar estado visual de carregamento glitch no CTA de login/cadastro.
- [x] Adicionar hover/foco neon aos controles e tabs da autenticação.
- [x] Respeitar `prefers-reduced-motion` e validar testes, acessibilidade e build.

- [x] Renomear a marca, títulos, metadados e textos principais de Cyperpuck para CyberCall; copy pública auditada sem referência residual.
- [x] Criar logotipo original CyberCall e aplicar o asset na autenticação e na plataforma.
- [x] Criar vídeo de fundo original com tema futurista e aplicar fallback acessível e responsivo.
- [x] Priorizar e implementar a funcionalidade essencial priorizada: painel de perfil, segurança de sessão e controle de logout.
- [x] Validar assets, acessibilidade, responsividade, testes, build e salvar checkpoint.

- [x] Adicionar painel de perfil da sessão com nome, e-mail, papel e estado de segurança.
- [x] Integrar abertura/fechamento acessível do painel ao shell CyberCall.
- [x] Cobrir o contrato do perfil com teste unitário e validar build.

- [x] Remover a referência visível residual a Cyperpuck na copy da autenticação.
- [x] Registrar explicitamente a prioridade funcional entregue: painel de perfil, segurança de sessão e controle de logout.
- [x] Completar foco inicial e retorno de foco do painel de perfil, com comportamento de diálogo por teclado.
- [x] Salvar novo checkpoint CyberCall após revalidar screenshots, check, testes e build.

- [x] Validar explicitamente a acessibilidade das animações glitch/neon na autenticação: foco, teclado, aria-busy, anúncio de carregamento e `prefers-reduced-motion`.

- [x] Cobrir com teste a navegação por setas/Home/End e o foco do estado de carregamento da autenticação.

- [x] Cobrir o contrato de foco preservado e anúncio acessível durante `isSubmitting` no CTA de autenticação, depois reexecutar check/test/build.

- [x] Reestruturar a sala de vídeo com palco principal, participantes, status glitch e controles de chamada.
- [x] Adicionar convites, compartilhamento, mute, câmera, tela, encerramento e moderação visualmente coerentes.
- [x] Expandir perfil com edição local de nome, preferências, conexões, segurança e configurações.
- [x] Integrar abertura/fechamento acessível, foco, teclado e estados responsivos.
- [x] Adicionar testes de contrato para sala/perfil e validar check, testes, build e checkpoint.

- [x] Completar foco inicial e retorno de foco da sala de vídeo, com Escape e fechamento acessível.
- [x] Adicionar teste de contrato para abertura, Escape e gestão de foco da sala.
- [x] Identificar claramente as preferências do perfil como locais/demonstrativas até existir endpoint persistente.

- [x] Criar logo CyberCall original com composição amarela, preta, vermelha e ciano inspirada na referência, sem copiar o wordmark.
- [x] Substituir o vídeo pendente por template de stock cyberpunk licenciado do Pixabay, com poster original, glitch e fallback acessível; geração original permanece opcional.
- [x] Substituir os assets atuais na autenticação, Home e sala de vídeo pelo logo/poster CyberCall e vídeo licenciado, mantendo fallback acessível e foco reduzido.
- [x] Validar contraste, responsividade mobile/tablet/desktop, acessibilidade, testes e build; vídeo licenciado aplicado e revisão visual registrada.

- [x] Extrair helpers testáveis de abertura/fechamento e foco da sala de vídeo, cobrindo o comportamento real de Escape e retorno ao gatilho.

- [x] Extrair helper integrado para abrir/fechar a sala, registrar gatilho e devolver foco após Escape.
- [x] Testar a sequência completa de abertura, Escape, fechamento e restauração de foco.

- [x] Encapsular registro do gatilho e disparo de Escape no helper integrado da sala.
- [x] Testar a sequência integrada completa com o mesmo gatilho real/fake.

- [x] Pesquisar template de vídeo cyberpunk/futurista com licença pública adequada para uso web.
- [x] Registrar fonte, licença e URL do template escolhido em `research-background-video-license.md`.
- [x] Baixar e hospedar o vídeo no fluxo de assets do WebDev, mantendo poster e fallback.
- [x] Validar contraste, acessibilidade, responsividade, testes, build e salvar checkpoint.

- [x] Mapear e corrigir os principais pontos de overflow e navegação em mobile, tablet e desktop.
- [x] Ajustar sala de vídeo, perfil, autenticação e shell social para breakpoints e touch targets consistentes.
- [x] Integrar chatbot de dúvidas frequentes com contexto seguro da CyberCall, estados de carregamento e fallback.
- [x] Manter bloqueios de segurança de anexos/PDFs até scanner antimalware configurado e documentar os fluxos seguros liberados em `security-upload-policy.md`.
- [x] Adicionar testes do chatbot e responsividade/contratos, validar check, testes, build e checkpoint.

- [x] Reestruturar a navegação de comunidades com busca, ações de convite/evento, categorias e badges de não lidas.
- [x] Melhorar o rodapé de perfil com presença, status e atalho funcional para a aba de configurações.
- [x] Aplicar a direção original de pôster neon ao shell sem copiar marca, personagens ou textos da referência.
- [x] Validar desktop/tablet/mobile, teclado, testes e build; checkpoint desta etapa será salvo em seguida.

- [x] Conectar o ícone de configurações do rodapé de perfil à aba Configurações do painel.
- [x] Implementar foco inicial, Escape, fechamento e retorno de foco no drawer mobile de comunidades.
- [x] Testar teclado do drawer com abertura, foco inicial, Escape e retorno ao gatilho; checkpoint será salvo após essa validação.

- [x] Extrair helpers integrados de abertura e fechamento do drawer mobile com gatilho e foco restaurável.
- [x] Testar a sequência completa no mesmo caso: abertura pelo gatilho, foco inicial, Escape e restauração do foco.

- [x] Fazer `openMobileNavState` focar o drawer no momento da abertura e testar, no mesmo fluxo, abertura pelo gatilho, foco inicial, Escape e retorno ao gatilho.

- [x] Adicionar seletor de avatar com pré-visualização, validação de imagem e remoção segura.
- [x] Adicionar seletor de status de presença com estados online, ausente, ocupado e invisível.
- [x] Mostrar claramente que as alterações são locais/demonstrativas até existir persistência de perfil; presença é preservada no localStorage do navegador.
- [x] Validar acessibilidade, responsividade, testes e build; checkpoint será salvo após a revisão final.

- [x] Atualizar o resumo Principal do perfil para refletir o status selecionado, em vez de exibir Online fixo.
- [x] Cobrir a consistência do status selecionado no painel com teste de contrato e reexecutar check/test/build.

- [x] Extrair helper do rótulo de presença e testar que cada status selecionado aparece no resumo Principal.

- [x] Adicionar editor de avatar com recorte quadrado e máscara visual.
- [x] Adicionar zoom, arraste/posicionamento e pré-visualização antes de aplicar.
- [x] Aplicar o resultado recortado ao perfil somente após confirmação e manter cancelamento seguro.
- [x] Validar formatos, acessibilidade, responsividade, testes e build; checkpoint será salvo após a revisão visual.

- [x] Extrair contratos testáveis do editor para abertura, foco inicial, Escape/cancelamento e aplicação do recorte.
- [x] Revalidar visualmente o modal aberto em mobile e desktop, confirmando overflow, foco e controles de zoom; revisão registrada em `avatar-editor-visual-review.md`.


## Sincronização realtime por WebSocket

- [x] Mapear o fluxo atual de mensagens, presença, autenticação e polling; definir contrato de eventos e estratégia de reconexão.
- [x] Adicionar transporte WebSocket autenticado ao servidor Express sem expor eventos entre comunidades não autorizadas.
- [x] Publicar eventos de mensagens persistidas e mudanças de presença após validação de autorização.
- [x] Consumir eventos no cliente, atualizar cache/estado sem duplicar mensagens e manter fallback de reconexão.
- [x] Cobrir autenticação, isolamento por comunidade/canal, reconexão, deduplicação e presença com testes Vitest.
- [x] Validar check, suíte de testes, build e responsividade; salvar checkpoint da etapa realtime.


## Correções da revisão realtime

- [x] Suportar no handshake WebSocket o mesmo fallback de sessão alternativa usado pelo cliente quando cookies são bloqueados em preview/iframe, com tratamento seguro e UX clara.
- [x] Restringir eventos de mensagem ao canal assinado; assinaturas de comunidade devem receber apenas presença e eventos comunitários não relacionados a mensagens.
- [x] Adicionar testes executados de autenticação/handshake, presença inicial e updates, reconexão e deduplicação do cliente, garantindo que os testes frontend sejam coletados pela configuração Vitest.
- [x] Reexecutar validação completa e salvar checkpoint após corrigir as lacunas desta revisão.


## Cobertura adicional da revisão realtime

- [x] Testar reconexão do cliente WebSocket e envio das inscrições após reabertura.
- [x] Testar snapshot e atualização de presença após inscrição em comunidade.
- [x] Testar o caminho completo de autenticação Bearer no handshake, além do parser isolado.
- [x] Reexecutar a validação final e salvar o checkpoint somente após concluir esses testes.


## Integração realtime final

- [x] Simular fechamento e reabertura do WebSocket no cliente e confirmar reenvio das inscrições ativas.
- [x] Exercitar subscribe de comunidade com snapshot inicial e update posterior de presença entregue ao cliente.
- [x] Exercitar o handshake WebSocket com Bearer fallback através do servidor, não apenas os helpers de construção.
- [x] Rodar validação final, marcar itens e salvar checkpoint realtime.


## Sinalização WebRTC para salas

- [x] Mapear a sala de voz/vídeo atual, os controles existentes e definir contrato de eventos offer/answer/ICE/peer.
- [x] Adicionar eventos de signaling autenticados ao WebSocket com isolamento por sala e autorização de membro.
- [x] Implementar cliente WebRTC com getUserMedia, RTCPeerConnection, ICE candidates, reconexão e limpeza de tracks.
- [x] Conectar microfone, câmera, entrada/saída e estado visual de participantes à mídia real, mantendo fallback acessível; compartilhamento de tela permanece separado.
- [x] Cobrir signaling, autorização, isolamento, reconexão, permissões de mídia e cleanup com testes Vitest.
- [x] Validar check, testes, build e revisão responsiva; revisão registrada em `webrtc-visual-review.md`.


## Mídia avançada: tela e dispositivos

- [x] Mapear suporte do navegador para enumerateDevices, setSinkId e getDisplayMedia; definir estados e fallback acessível.
- [x] Adicionar ao mesh WebRTC troca de tracks de câmera, microfone e tela com renegociação e encerramento automático.
- [x] Implementar seleção persistente de microfone, câmera e saída de áudio na sala.
- [x] Integrar preview local de tela, botão de compartilhamento e avisos de permissão/indisponibilidade.
- [x] Cobrir troca de dispositivos, compartilhamento de tela, cleanup e permissões com testes Vitest.
- [x] Validar check, testes, build e revisão responsiva; revisão registrada em `media-devices-visual-review.md`.


## Indicador de volume do microfone

- [x] Mapear estados de captura, mute, permissão e suporte à Web Audio API; definir contrato do medidor.
- [x] Implementar medição RMS/nível de entrada com AudioContext e cleanup completo.
- [x] Integrar barra/anel visual de volume, estado sem sinal e anúncio acessível na sala.
- [x] Cobrir volume, mute, ausência de stream, throttling e cleanup com testes Vitest.
- [x] Validar check, testes, build e revisão responsiva; revisão registrada em `microphone-meter-visual-review.md`.


## Sensibilidade do microfone

- [x] Definir faixa, valor padrão, validação e chave de persistência da sensibilidade.
- [x] Aplicar sensibilidade ao nível visual do medidor sem alterar o áudio enviado pela chamada.
- [x] Adicionar slider, valor percentual, descrição acessível e ação de reset nas configurações da sala.
- [x] Cobrir normalização, persistência, limites e reset com testes Vitest.
- [x] Validar check, testes, build e revisão responsiva; revisão registrada em `microphone-sensitivity-visual-review.md`.


## Destaque de quem está falando

- [x] Mapear streams locais/remotos, participantes e estado de mute para definir o contrato de fala ativa.
- [x] Implementar detector de atividade de fala com Web Audio API, limiar e cleanup por stream.
- [x] Integrar destaque neon, etiqueta acessível e estado de fala nos tiles locais/remotos.
- [x] Cobrir limiar, silêncio, mute, fallback e cleanup com testes Vitest.
- [x] Validar check, testes, build e revisão responsiva; revisão registrada em `speaking-indicator-visual-review.md`.


## Qualidade de conexão por participante

- [x] Mapear RTCPeerConnection, estados atuais e métricas disponíveis para definir o contrato de qualidade.
- [x] Implementar coleta periódica de RTT, perda de pacotes e estado ICE/connection por peer.
- [x] Classificar qualidade em boa, instável, baixa e indisponível com fallback seguro.
- [x] Integrar barras/ícone, cor, tooltip e aria-label de qualidade em cada tile e na telemetria.
- [x] Cobrir classificação, métricas ausentes, cleanup e transições com testes Vitest.
- [x] Validar check, testes, build e revisão responsiva; revisão registrada em `network-quality-visual-review.md`.


## Sincronização com GitHub

- [x] Inspecionar o estado Git local, branch, remote e conteúdo atual do repositório CyberCall informado.
- [x] Atualizar README e documentação com arquitetura, funcionalidades, segurança, WebRTC, configuração e validação do projeto.
- [x] Validar arquivos versionados, excluir segredos e artefatos indevidos e preparar commit sem sobrescrever histórico remoto.
- [x] Enviar o projeto completo e a documentação para `GuilhermeADS13/CyberCall`.
- [x] Confirmar branch, commit e conteúdo sincronizado; registrar o resultado.


## Melhorias de colaboração no GitHub

- [x] Verificar que os commits e pushes anteriores estão presentes na branch `main` do repositório remoto.
- [x] Adicionar workflow GitHub Actions para check, testes e build — preparado localmente e explicitamente adiado pelo usuário até autorizar o escopo `workflow`.
- [x] Adicionar templates de Issue e Pull Request e documentação de contribuição.
- [x] Preparar apresentação visual do projeto no README com imagem/preview e link para demonstração sem expor segredos.
- [x] Validar arquivos, executar checks e publicar as alterações solicitadas nesta etapa — README, templates, documentação e screenshot publicados; workflow CI ficou fora do push conforme solicitação.
- [x] Confirmar commit, push e arquivos remotos após a publicação parcial; remoto confirmado em `c79baa76a8e74148724037aba5da57be4ce61ba5`.


## Push parcial sem workflow

- [x] Separar o workflow CI do commit publicável sem perder o arquivo local para envio posterior.
- [x] Publicar README, templates de colaboração, CONTRIBUTING e screenshot no GitHub.
- [x] Confirmar o commit remoto e manter registrada a pendência do escopo `workflow`.


## Chat textual dentro da chamada

- [x] Mapear o contrato WebSocket e a UI atual da sala de voz/vídeo.
- [x] Adicionar eventos autenticados de chat da chamada, com isolamento por sala.
- [x] Construir painel de mensagens com envio, histórico da sessão, estados vazios e responsividade mobile.
- [x] Integrar o cliente realtime, deduplicação e rolagem para novas mensagens.
- [x] Adicionar testes Vitest para contrato, roteamento e helpers da interface.
- [x] Validar `pnpm check`, testes, build e revisão visual da sala em desktop/mobile.
- [x] Salvar checkpoint com a implementação concluída na versão `229683b7`.


## Indicador de digitação na chamada

- [x] Mapear o contrato atual do chat e os estados de conexão da sala.
- [x] Adicionar eventos autenticados `voice.typing` com isolamento por sala.
- [x] Implementar debounce no emissor e expiração automática no receptor.
- [x] Exibir indicador acessível com nomes dos participantes que estão digitando.
- [x] Adicionar testes Vitest de contrato, debounce, expiração e integração WebSocket.
- [x] Validar `pnpm check`, suíte, build e revisão responsiva.
- [x] Salvar checkpoint da implementação concluída na versão `774c6d0a`.


## Publicação completa no GitHub sem workflow CI

- [x] Auditar alterações locais e separar `.github/workflows/ci.yml` do commit publicável.
- [x] Executar validações e preparar commit com o chat da chamada e o indicador de digitação.
- [x] Enviar o commit para `GuilhermeADS13/CyberCall` e verificar os arquivos remotos.
- [x] Registrar o commit remoto `bfc58b9b6d58ee730e0ff7d4dbbd479bbe756a7a`; workflow CI permanece ausente por decisão anterior.


## Preparação para Render

- [x] Avaliar compatibilidade do backend Express/tRPC/WebSocket com o Render.
- [x] Preparar configuração de build e start sem hardcode de porta.
- [x] Documentar variáveis obrigatórias, banco, OAuth, WebSocket e armazenamento.
- [x] Validar a preparação e publicar a configuração no GitHub no commit remoto `df4126b9410e31e47d6429ec6e6159fcccd742b8`.
- [x] Entregar instruções para conectar o repositório e concluir o deploy no Render.


## Editar e excluir mensagens próprias na chamada

- [x] Mapear o contrato atual das mensagens `voice.chat`.
- [x] Adicionar comandos autenticados para editar e excluir somente mensagens do próprio autor.
- [x] Propagar eventos realtime de mensagem editada/excluída para os participantes da sala.
- [x] Adicionar controles acessíveis de editar/excluir, estado editado e confirmação de exclusão.
- [x] Adicionar testes de autorização, limites, realtime e helpers da interface.
- [x] Validar `pnpm check`, suíte e build; revisão visual da sala permanece registrada para captura adicional.
- [x] Publicar as alterações no GitHub no commit `7d64abc`; checkpoint final pendente.


## Referência visual 21st.dev

- [x] Acessar e analisar a referência visual do 21st.dev.
- [x] Definir melhorias de layout, hierarquia, tipografia e componentes compatíveis com o CyberCall.
- [x] Implementar as melhorias sem perder a estética cyberpunk e a funcionalidade realtime.
- [x] Validar a interface em desktop e mobile.
- [x] Publicar as alterações no GitHub no commit `7d64abc`; checkpoint final pendente.


## Busca global de mensagens e usuários

- [x] Mapear mensagens, usuários e pontos de navegação pesquisáveis.
- [x] Implementar índice local e filtros por mensagens e usuários.
- [x] Criar barra/modal de busca global com resultados agrupados.
- [x] Adicionar atalhos `/` e `Ctrl/Cmd+K`, foco inicial e navegação por teclado.
- [x] Validar acessibilidade, desktop/mobile, testes, build e integração com navegação.
- [x] Publicar no GitHub no commit `22f8794`; checkpoint final pendente.


## Destaque de termos pesquisados

- [x] Mapear a renderização atual dos resultados da busca global.
- [x] Implementar helper seguro para destacar ocorrências sem interpretar regex do usuário.
- [x] Aplicar destaque visual em títulos, subtítulos e corpos de mensagens.
- [x] Adicionar testes de normalização, múltiplas ocorrências e termos especiais.
- [x] Validar TypeScript, testes, build e revisão responsiva.
- [x] Publicar no GitHub no commit `08ef607`; checkpoint final pendente.


## Filtros da busca global

- [x] Mapear o estado atual da busca e seus resultados agrupados.
- [x] Adicionar filtro Todos/Mensagens/Usuários com contagens.
- [x] Manter destaque de termos, estado vazio e seleção de resultados após filtrar.
- [x] Adicionar testes para cada filtro e contagens correspondentes.
- [x] Validar TypeScript, suíte, build e responsividade.
- [x] Publicar no GitHub no commit `f08efd0`; checkpoint final pendente.


## Histórico de buscas recentes

- [x] Mapear abertura, foco e seleção atuais da busca global.
- [x] Implementar histórico local limitado e persistente no navegador.
- [x] Exibir buscas recentes automaticamente ao abrir/focar sem query ativa.
- [x] Adicionar seleção, remoção individual e limpeza completa do histórico.
- [x] Adicionar testes de deduplicação, limite, persistência e limpeza.
- [x] Validar TypeScript, suíte, build e responsividade.
- [x] Publicar no GitHub no commit `2171816`; checkpoint final pendente.

## Contexto nas buscas recentes

- [x] Mapear o formato atual do histórico e o canal selecionado.
- [x] Migrar strings antigas para itens com query, data e canal sem perder dados.
- [x] Registrar a data e o nome do canal ao salvar uma nova busca.
- [x] Exibir data e canal em cada item com layout responsivo.
- [x] Adicionar testes de migração, metadados e limpeza do histórico.
- [x] Validar TypeScript, suíte, build e revisão responsiva.
- [x] Publicar no GitHub no commit `d9df618`.
- [x] Salvar checkpoint final da entrega de data e canal na versão `17794a5f`.
