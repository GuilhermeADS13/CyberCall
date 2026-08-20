# Contrato de sinalização WebRTC do CyberCall

## Objetivo

A sala usará WebRTC mesh para áudio e vídeo entre os participantes, enquanto o WebSocket existente será usado apenas como plano de sinalização. O servidor não retransmitirá mídia: ele autenticará o participante, validará a associação ao canal de voz e encaminhará eventos de negociação somente entre membros da mesma sala.

## Escopo e autorização

Cada sala é vinculada a um canal de voz persistido por `channelId` e a um `roomKey` efêmero. Para entrar, o usuário deve estar autenticado e ser membro da comunidade do canal. O servidor rejeitará join, leave, offer, answer e ICE quando o participante não estiver associado ao mesmo `roomKey` ou quando o alvo não pertencer à sala.

## Eventos de sinalização

| Direção | Evento | Conteúdo essencial |
|---|---|---|
| Cliente → servidor | `voice.join` | `channelId`, `roomKey` |
| Servidor → cliente | `voice.members` | lista dos peers já presentes |
| Servidor → sala | `voice.peer.joined` | `userId`, nome público |
| Cliente → servidor | `voice.offer` | `targetUserId`, SDP offer |
| Cliente → servidor | `voice.answer` | `targetUserId`, SDP answer |
| Cliente → servidor | `voice.ice` | `targetUserId`, ICE candidate |
| Cliente → servidor | `voice.leave` | `roomKey` |
| Servidor → sala | `voice.peer.left` | `userId` |

Cada evento usa o envelope realtime existente, com `scope.channelId` e `payload`. O servidor encaminha offers, answers e candidates apenas ao alvo indicado, sem permitir broadcast acidental de SDP ou ICE para outros canais.

## Cliente WebRTC

O cliente solicitará `getUserMedia` somente após uma ação explícita de entrada na sala. Cada peer remoto terá uma `RTCPeerConnection` com configuração STUN pública mínima e sem credenciais secretas no frontend. Tracks locais serão adicionadas à conexão, eventos `ontrack` alimentarão elementos de áudio/vídeo remotos e `onicecandidate` publicará candidates pelo WebSocket. Ao sair, o cliente fechará as conexões, parará tracks e limpará elementos remotos.

## Reconexão e permissões

Se o WebSocket cair, o cliente manterá a intenção de estar na sala, fechará peer connections obsoletas e repetirá `voice.join` após a reconexão. A mídia local continuará desligada até que a conexão seja restabelecida com segurança. Negação de microfone/câmera exibirá fallback acessível e não bloqueará a sala somente de áudio se o usuário aceitar uma permissão parcial.

## Limitações

A topologia mesh é apropriada para a primeira etapa e para salas pequenas. Para grupos maiores, será necessário migrar para SFU/TURN gerenciado. O modo Autoscale mantém a sinalização compatível enquanto o estado de sala permanecer efêmero por processo; produção multi-instância exigirá broker compartilhado ou hospedagem Reserved para garantir que todos os peers vejam o mesmo estado de sinalização.
