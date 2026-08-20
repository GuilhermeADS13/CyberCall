# Contrato realtime do CyberCall

## Objetivo

Sincronizar mensagens de canais, mensagens diretas e presença sem depender do polling como mecanismo primário. O banco continua sendo a fonte de verdade; o WebSocket apenas distribui eventos após uma operação persistida com autorização validada.

## Transporte e autenticação

O servidor Express usará `ws` sobre o mesmo HTTP server, no endpoint `/api/realtime`. O handshake reutilizará `sdk.authenticateRequest`, aceitando a sessão OAuth por cookie e o fallback Bearer usado pelo tRPC. Conexões não autenticadas serão encerradas com código WebSocket de política.

## Envelope de evento

```ts
type RealtimeEvent = {
  id: string;
  type:
    | "message.created"
    | "message.updated"
    | "message.deleted"
    | "dm.created"
    | "presence.updated";
  occurredAt: number;
  scope: { communityId?: number; channelId?: number; userIds?: number[] };
  payload: unknown;
};
```

O `id` será usado pelo cliente para deduplicação. `occurredAt` será um timestamp UTC em milissegundos. Eventos de canal só serão enviados a conexões que tenham inscrição autorizada naquele canal/comunidade; eventos de DM serão enviados somente aos dois participantes; presença será limitada às comunidades em que o usuário está membro.

## Inscrição do cliente

Depois do handshake, o cliente enviará uma mensagem de controle validada:

```ts
type SubscribeCommand = {
  type: "subscribe";
  communityId?: number;
  channelId?: number;
  dmUserId?: number;
};
```

O servidor confirmará somente os escopos permitidos. Comandos inválidos ou não autorizados não alteram inscrições e retornam um erro controlado.

## Publicação

As mutations existentes de envio, edição, exclusão e DM continuarão responsáveis pela validação e persistência. Após sucesso, publicarão o evento correspondente para as conexões elegíveis. A presença inicial será derivada do membro autenticado e as mudanças explícitas de status serão publicadas com escopo de comunidades compartilhadas.

## Reconexão e fallback

O cliente tentará reconectar com backoff limitado e jitter. Durante a reconexão, o tRPC continuará disponível para recuperar o histórico e corrigir lacunas. O polling poderá ser reduzido ou mantido apenas como fallback de consistência até o transporte ser validado em produção.

## Limitações conhecidas

Em Autoscale, estado de conexões não deve ser considerado fonte de verdade nem ficar apenas em memória entre instâncias. A primeira etapa usa um broker em memória por processo para o ambiente atual; uma etapa posterior poderá substituir o barramento por Redis/pub/sub se múltiplas instâncias forem necessárias. Para uma única instância persistente, Reserved Hosting é a opção mais previsível para conexões longas.
