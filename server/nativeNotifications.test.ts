import { describe, expect, it, vi } from "vitest";
import {
  emitRoomInviteNotification,
  nativeNotificationsAvailable,
} from "../client/src/lib/nativeNotifications";

describe("native room invite notifications", () => {
  it("detects browser notification support and wires the background click path", () => {
    expect(
      nativeNotificationsAvailable({
        Notification: class {},
      } as typeof globalThis)
    ).toBe(true);

    let clicked = false;
    let closed = false;
    let created: FakeNotification | undefined;
    class FakeNotification {
      onclick: ((event: Event) => void) | null = null;
      close = vi.fn(() => {
        closed = true;
      });
      constructor(
        public title: string,
        public options?: NotificationOptions
      ) {
        created = this;
      }
    }

    const result = emitRoomInviteNotification(
      { id: 7, roomName: "Lobby", senderName: "Maya" },
      FakeNotification,
      () => {
        clicked = true;
      }
    );
    created?.onclick?.(new Event("click"));

    expect(result.title).toBe("Convite recebido: Lobby");
    expect(result.body).toContain("Maya");
    expect(created?.options?.tag).toBe("cybercall-room-invite-7");
    expect(clicked).toBe(true);
    expect(closed).toBe(true);
  });
});
