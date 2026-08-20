export type RoomInviteNotification = {
  id: number;
  roomName: string;
  senderName?: string | null;
};

export type NativeNotificationConstructor = new (
  title: string,
  options?: NotificationOptions
) => { onclick: ((event: Event) => void) | null; close: () => void };

export function nativeNotificationsAvailable(
  scope: typeof globalThis = globalThis
) {
  return "Notification" in scope;
}

export function emitRoomInviteNotification(
  invite: RoomInviteNotification,
  NotificationCtor: NativeNotificationConstructor,
  onOpen: () => void
) {
  const title = `Convite recebido: ${invite.roomName}`;
  const body = `${invite.senderName || "Um piloto"} convidou você para uma sala.`;
  const nativeNotification = new NotificationCtor(title, {
    body,
    tag: `cybercall-room-invite-${invite.id}`,
    silent: false,
  });
  nativeNotification.onclick = () => {
    onOpen();
    nativeNotification.close();
  };
  return { title, body };
}
