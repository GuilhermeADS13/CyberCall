# Revisão visual do destaque de fala

As capturas em 1280×720 e 390×844 mostram o shell CyberCall sem regressões de layout, contraste ou navegação. O destaque neon de quem fala é aplicado exclusivamente aos tiles do overlay de voz e não altera o modo visitante.

Com uma sessão autenticada e streams ativos, o detector aplica borda âmbar, brilho, contorno pulsante, ponto de áudio e a etiqueta `falando agora` ao participante acima do limiar. O painel lateral também identifica o nome do participante ativo. Em navegadores sem Web Audio API, os tiles permanecem funcionais com o estado de conexão, sem anunciar fala incorretamente.
