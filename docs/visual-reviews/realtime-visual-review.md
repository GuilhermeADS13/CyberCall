# Revisão visual da etapa realtime

A interface foi revisada em 1280x720 e 390x844 após a integração do cliente WebSocket.

No desktop, o indicador `reconectando` aparece no topo sem deslocar o shell, o painel lateral de membros permanece legível e o layout mantém a composição Night Circuit. No mobile, a navegação compacta, o cabeçalho, o hero e o feed de mensagens continuam dentro da viewport, sem overflow horizontal causado pelo novo estado de conexão.

A captura mostra `reconectando` no ambiente de preview quando não existe sessão autenticada disponível no iframe; isso é esperado porque o endpoint exige o cookie OAuth. Em uma sessão autenticada, o indicador alterna para `realtime` após o handshake.
