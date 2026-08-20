# Revisão visual do módulo WebRTC

As capturas em viewport desktop de 1280×720 e mobile de 390×844 foram revisadas após a integração. O shell CyberCall manteve a hierarquia Night Circuit, o indicador de conexão realtime permaneceu legível no header e o layout principal não apresentou overflow horizontal. Em mobile, a navegação continua compacta com drawer, a hero permanece dentro da coluna central e os cards de mensagem preservam espaçamento e leitura.

A sala de voz mantém o overlay acessível, os tiles existentes e os controles com touch targets mínimos. Quando a mídia é autorizada, os tiles podem receber o stream local/remoto; quando não há permissão ou peer conectado, o avatar e a copy de fallback permanecem como estado visual seguro. A etapa de compartilhamento de tela continua separada e explicitamente não ativada nesta entrega.
