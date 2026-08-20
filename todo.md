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
