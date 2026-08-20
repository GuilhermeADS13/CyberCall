# Revisão visual de dispositivos e tela

As capturas em 1280×720 e 390×844 mostram o shell CyberCall sem regressão visual após a adição dos estados de dispositivos e compartilhamento. O header permanece compacto, a hero conserva contraste e a navegação mobile mantém drawer e coluna de conteúdo sem overflow horizontal.

A revisão do overlay de voz deve ser feita com uma sessão autenticada e permissão de mídia concedida para observar os selects enumerados, o preview de tela e os labels reais dos dispositivos. O fallback atual permanece seguro: navegadores sem `getDisplayMedia`, `enumerateDevices` ou `setSinkId` recebem mensagens de indisponibilidade e continuam com a interface de prévia.
