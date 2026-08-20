# Revisão visual do editor de avatar

A revisão foi feita com o modal aberto via preview de desenvolvimento `?avatarEditorPreview=1` em duas dimensões: 390x844 e 1280x720.

Em mobile, o modal permanece dentro da viewport, mantém a máscara quadrada, slider de zoom, instrução de arraste e os botões Cancelar/Aplicar recorte sem overflow horizontal. Em desktop, o painel fica centralizado, com largura contida, contraste ciano/âmbar, fundo desfocado e controles alinhados. O botão de cancelar, o botão de aplicar e o fechamento no canto superior permanecem visualmente distinguíveis.

O preview é temporário e será removido do código antes do checkpoint; a funcionalidade final continuará sendo aberta pelo seletor real de imagem do perfil.
