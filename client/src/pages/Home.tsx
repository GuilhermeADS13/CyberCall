import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { lazy, Suspense } from "react";
const CyberCallHelpBot = lazy(() =>
  import("@/components/CyberCallHelpBot").then(
    ({ CyberCallHelpBot: Component }) => ({ default: Component })
  )
);
import { emitRoomInviteNotification } from "@/lib/nativeNotifications";
import { createRealtimeClient, type RealtimeEvent } from "@/lib/realtime";
import {
  createMicrophoneMeter,
  normalizeMicrophoneSensitivity,
} from "@/lib/microphoneMeter";
import { createSpeechDetector } from "@/lib/speechDetector";
import {
  createWebRtcMesh,
  getMediaConstraints,
  type NetworkQuality,
  type VoiceSignalEvent,
} from "@/lib/webrtc";
import {
  Bell,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  Copy,
  Crop,
  FileText,
  Hash,
  Headphones,
  LogOut,
  Menu,
  MessageSquarePlus,
  Mic,
  MonitorUp,
  Paperclip,
  PhoneOff,
  Plus,
  Radio,
  Search,
  Settings,
  Shield,
  Sparkles,
  UserPlus,
  UserX,
  Users,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  FormEvent,
  MouseEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

const heroImage = "/manus-storage/cybercall-poster-background_febc1986.jpg";
const cyberCallLogo = "/manus-storage/cybercall-poster-logo_d5171e8f.png";
const cyberCallVideo = "/manus-storage/cybercall-pixabay-neon_b0920fd2.mp4";
export const cyberCallProfilePanelCopy = {
  title: "Perfil da sessão",
  session: "Protegida",
  presence: "Online",
  mainTab: "Principal",
  settingsTab: "Configurações",
} as const;
export const cyberCallVoiceRoomCopy = {
  eyebrow: "Live room",
  title: "CYBERCALL //",
  subtitle: "Sala de transmissão",
  status: "Sinal conectado",
  preview: "Prévia da sala",
} as const;
export const presenceOptions = [
  { value: "online", label: "Online", detail: "Disponível para sinais" },
  { value: "away", label: "Ausente", detail: "Retorno em breve" },
  { value: "busy", label: "Ocupado", detail: "Não interromper" },
  { value: "invisible", label: "Invisível", detail: "Aparecer offline" },
] as const;
type PresenceStatus = (typeof presenceOptions)[number]["value"];
export function getPresenceLabel(status: PresenceStatus) {
  return (
    presenceOptions.find(option => option.value === status)?.label || "Online"
  );
}
export function isAvatarEditorEscapeKey(key: string) {
  return key === "Escape";
}
export function canApplyAvatarCrop(sourceUrl: string | null) {
  return Boolean(sourceUrl);
}
export function getAvatarEditorA11yContract() {
  return { role: "dialog", ariaModal: true, requiresInitialFocus: true };
}
export function getAvatarCropTransform(
  width: number,
  height: number,
  zoom: number,
  offsetX: number,
  offsetY: number,
  size = 256
) {
  const scale = Math.max(size / width, size / height) * zoom;
  return {
    scale,
    x: (size - width * scale) / 2 + offsetX,
    y: (size - height * scale) / 2 + offsetY,
  };
}
export async function cropAvatarImage(
  sourceUrl: string,
  zoom: number,
  offsetX: number,
  offsetY: number
) {
  const image = new Image();
  image.src = sourceUrl;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Não foi possível ler a imagem."));
  });
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas indisponível.");
  const transform = getAvatarCropTransform(
    image.naturalWidth,
    image.naturalHeight,
    zoom,
    offsetX,
    offsetY,
    size
  );
  context.drawImage(
    image,
    transform.x,
    transform.y,
    image.naturalWidth * transform.scale,
    image.naturalHeight * transform.scale
  );
  return canvas.toDataURL("image/jpeg", 0.9);
}
export function validateProfileAvatarFile(file: Pick<File, "type" | "size">) {
  if (!file.type.startsWith("image/"))
    return "Escolha uma imagem PNG, JPG ou WebP.";
  if (file.size > 5 * 1024 * 1024) return "O avatar deve ter no máximo 5 MB.";
  return null;
}
export function focusVoiceRoom(dialog: Pick<HTMLElement, "focus">) {
  dialog.focus();
}
export function restoreVoiceRoomFocus(
  trigger: Pick<HTMLButtonElement, "focus"> | null
) {
  trigger?.focus();
}
export function isVoiceEscapeKey(key: string) {
  return key === "Escape";
}
export function openVoiceRoomState(
  channelName: string,
  setChannel: (value: string) => void,
  setJoined: (value: boolean) => void,
  triggerRef: { current: Pick<HTMLButtonElement, "focus"> | null },
  trigger: Pick<HTMLButtonElement, "focus"> | null
) {
  triggerRef.current = trigger;
  setChannel(channelName);
  setJoined(false);
}
export function closeVoiceRoomState(
  setChannel: (value: string | null) => void,
  setJoined: (value: boolean) => void,
  triggerRef: { current: Pick<HTMLButtonElement, "focus"> | null }
) {
  setChannel(null);
  setJoined(false);
  restoreVoiceRoomFocus(triggerRef.current);
}
export function handleVoiceRoomKey(key: string, close: () => void) {
  if (isVoiceEscapeKey(key)) close();
}
export function openMobileNavState(
  setOpen: (value: boolean) => void,
  triggerRef: { current: Pick<HTMLButtonElement, "focus"> | null },
  trigger: Pick<HTMLButtonElement, "focus">,
  drawerRef: { current: Pick<HTMLElement, "focus"> | null }
) {
  triggerRef.current = trigger;
  setOpen(true);
  drawerRef.current?.focus();
}
export function closeMobileNavState(
  setOpen: (value: boolean) => void,
  triggerRef: { current: Pick<HTMLButtonElement, "focus"> | null }
) {
  setOpen(false);
  triggerRef.current?.focus();
}
export function handleMobileNavEscape(key: string, close: () => void) {
  if (key === "Escape") {
    close();
    return true;
  }
  return false;
}
export type VoiceChatMessage = {
  id: string;
  userId: number;
  authorName: string;
  body: string;
  occurredAt: number;
  editedAt?: number;
};
export function updateVoiceChatMessage(
  current: VoiceChatMessage[],
  messageId: string,
  body: string,
  editedAt: number
) {
  return current.map(item =>
    item.id === messageId
      ? { ...item, body: normalizeVoiceChatBody(body), editedAt }
      : item
  );
}
export function removeVoiceChatMessage(
  current: VoiceChatMessage[],
  messageId: string
) {
  return current.filter(item => item.id !== messageId);
}
export type VoiceTypingParticipant = {
  userId: number;
  authorName: string;
  expiresAt: number;
};
export function normalizeVoiceChatBody(body: string) {
  return body.trim().slice(0, 2000);
}
export function formatVoiceTypingLabel(participants: VoiceTypingParticipant[]) {
  const names = participants.map(participant => participant.authorName);
  if (names.length === 0) return "";
  if (names.length === 1) return `${names[0]} está digitando...`;
  if (names.length === 2) return `${names[0]} e ${names[1]} estão digitando...`;
  return `${names.slice(0, 2).join(", ")} e mais ${names.length - 2} estão digitando...`;
}
export function pruneVoiceTypingParticipants(
  current: Record<number, VoiceTypingParticipant>,
  now = Date.now()
) {
  return Object.fromEntries(
    Object.entries(current)
      .filter(([, participant]) => participant.expiresAt > now)
      .map(([userId, participant]) => [userId, participant])
  );
}
export function appendVoiceChatMessage(
  current: VoiceChatMessage[],
  incoming: VoiceChatMessage,
  limit = 100
) {
  if (!incoming.body.trim() || current.some(item => item.id === incoming.id))
    return current;
  return [
    ...current,
    { ...incoming, body: normalizeVoiceChatBody(incoming.body) },
  ].slice(-limit);
}
export type GlobalSearchResult = {
  kind: "message" | "user";
  id: string;
  title: string;
  subtitle: string;
  body?: string;
};
export type GlobalSearchFilter = "all" | "message" | "user";
export function filterGlobalSearchResults(
  results: GlobalSearchResult[],
  filter: GlobalSearchFilter
) {
  return filter === "all"
    ? results
    : results.filter(result => result.kind === filter);
}
export const recentSearchStorageKey = "cybercall-recent-searches";
export function normalizeRecentSearches(value: unknown, limit = 6) {
  if (!Array.isArray(value)) return [] as string[];
  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map(item => item.trim())
        .filter(Boolean)
    )
  ).slice(0, limit);
}
export function addRecentSearch(current: string[], query: string, limit = 6) {
  const normalized = query.trim();
  if (!normalized) return normalizeRecentSearches(current, limit);
  return normalizeRecentSearches([normalized, ...current], limit);
}
export type SearchHighlightPart = { text: string; matched: boolean };
export function highlightSearchMatches(
  value: string,
  query: string
): SearchHighlightPart[] {
  const normalized = query.trim();
  if (!normalized) return [{ text: value, matched: false }];
  const lowerValue = value.toLocaleLowerCase();
  const lowerQuery = normalized.toLocaleLowerCase();
  const parts: SearchHighlightPart[] = [];
  let cursor = 0;
  let matchIndex = lowerValue.indexOf(lowerQuery, cursor);
  while (matchIndex >= 0) {
    if (matchIndex > cursor)
      parts.push({ text: value.slice(cursor, matchIndex), matched: false });
    parts.push({
      text: value.slice(matchIndex, matchIndex + normalized.length),
      matched: true,
    });
    cursor = matchIndex + normalized.length;
    matchIndex = lowerValue.indexOf(lowerQuery, cursor);
  }
  if (cursor < value.length)
    parts.push({ text: value.slice(cursor), matched: false });
  return parts.length ? parts : [{ text: value, matched: false }];
}
export function renderSearchHighlight(value: string, query: string): ReactNode {
  return highlightSearchMatches(value, query).map((part, index) =>
    part.matched ? (
      <mark key={`${part.text}-${index}`} className="search-term-highlight">
        {part.text}
      </mark>
    ) : (
      <span key={`${part.text}-${index}`}>{part.text}</span>
    )
  );
}
export function searchGlobalContent(
  query: string,
  messages: Array<{
    id: string | number;
    authorName?: string | null;
    body?: string;
  }>,
  members: Array<{
    userId?: number;
    name?: string | null;
    email?: string | null;
    memberRole?: string | null;
  }>
) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [] as GlobalSearchResult[];
  const messageResults = messages
    .filter(item =>
      `${item.authorName || "Piloto"} ${item.body || ""}`
        .toLowerCase()
        .includes(normalized)
    )
    .slice(0, 8)
    .map(item => ({
      kind: "message" as const,
      id: `message-${item.id}`,
      title: item.authorName || "Piloto",
      subtitle: "Mensagem no canal atual",
      body: item.body || "",
    }));
  const userResults = members
    .filter(item =>
      `${item.name || ""} ${item.email || ""} ${item.memberRole || ""}`
        .toLowerCase()
        .includes(normalized)
    )
    .slice(0, 8)
    .map(item => ({
      kind: "user" as const,
      id: `user-${item.userId || item.name || item.email}`,
      title: item.name || item.email || "Piloto",
      subtitle: item.memberRole
        ? `Membro · ${item.memberRole}`
        : "Membro da comunidade",
    }));
  return [...messageResults, ...userResults].slice(0, 12);
}

const demoChannels = [
  { id: 0, name: "rules", channelType: "announcement" },
  { id: 0, name: "general", channelType: "text" },
  { id: 0, name: "feedback", channelType: "text" },
  { id: 0, name: "lobby", channelType: "voice" },
];
const demoMessages = [
  {
    id: "a",
    authorName: "CYBERCALL SYSTEM",
    body: "O primeiro sinal foi emitido. Este é o espaço para testar ideias, montar esquadrões e acompanhar o próximo ciclo.",
    createdAt: new Date(Date.now() - 1000 * 60 * 42),
  },
  {
    id: "b",
    authorName: "Maya // MOD",
    body: "Bem-vindos à arena. Apresentem-se, escolham seu perfil e mantenham o sinal limpo.",
    createdAt: new Date(Date.now() - 1000 * 60 * 31),
  },
];

function Avatar({
  name,
  imageUrl,
  accent = "#6fffe9",
  presence,
}: {
  name?: string | null;
  imageUrl?: string | null;
  accent?: string;
  presence?: PresenceStatus;
}) {
  return (
    <span
      className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden border border-[#26363a] bg-[#131d22] font-display text-xs font-bold text-[#6fffe9]"
      style={{ boxShadow: `inset 0 -2px 0 ${accent}` }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        (name || "?").slice(0, 1).toUpperCase()
      )}
      {presence && (
        <span
          className={`absolute bottom-0 right-0 h-2.5 w-2.5 border-2 border-[#131d22] ${presence === "online" ? "bg-[#6fffe9]" : presence === "away" ? "bg-[#ffb547]" : presence === "busy" ? "bg-[#ff435d]" : "bg-[#718183]"}`}
          aria-label={`Presença: ${presenceOptions.find(option => option.value === presence)?.label}`}
        />
      )}
    </span>
  );
}

function networkQualityLabel(level?: NetworkQuality["level"]) {
  return level === "good"
    ? "conexão boa"
    : level === "unstable"
      ? "conexão instável"
      : level === "poor"
        ? "conexão baixa"
        : "qualidade indisponível";
}

function networkQualityClass(level?: NetworkQuality["level"]) {
  return level === "good"
    ? "text-[#6fffe9]"
    : level === "unstable"
      ? "text-[#ffb547]"
      : level === "poor"
        ? "text-[#ff435d]"
        : "text-[#718183]";
}

function MediaPreview({
  stream,
  label,
  muted = false,
  outputDeviceId = "",
}: {
  stream: MediaStream | null;
  label: string;
  muted?: boolean;
  outputDeviceId?: string;
}) {
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  useEffect(() => {
    if (mediaRef.current) mediaRef.current.srcObject = stream;
    return () => {
      if (mediaRef.current) mediaRef.current.srcObject = null;
    };
  }, [stream]);
  useEffect(() => {
    const media = mediaRef.current as
      | (HTMLMediaElement & { setSinkId?: (deviceId: string) => Promise<void> })
      | null;
    if (media && outputDeviceId && typeof media.setSinkId === "function")
      void media.setSinkId(outputDeviceId).catch(() => undefined);
  }, [outputDeviceId]);
  if (!stream) return null;
  if (stream.getVideoTracks().length > 0)
    return (
      <video
        ref={mediaRef as RefObject<HTMLVideoElement>}
        autoPlay
        muted={muted}
        playsInline
        aria-label={label}
        className="absolute inset-0 h-full w-full object-cover opacity-80"
      />
    );
  return (
    <audio
      ref={mediaRef as RefObject<HTMLAudioElement>}
      autoPlay
      muted={muted}
      aria-label={label}
    />
  );
}

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [selectedCommunityId, setSelectedCommunityId] = useState<number | null>(
    null
  );
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(
    null
  );
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [globalSearchFilter, setGlobalSearchFilter] =
    useState<GlobalSearchFilter>("all");
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return normalizeRecentSearches(
        JSON.parse(window.localStorage.getItem(recentSearchStorageKey) || "[]")
      );
    } catch {
      return [];
    }
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const globalSearchInputRef = useRef<HTMLInputElement>(null);
  const [activeDmUserId, setActiveDmUserId] = useState<number | null>(null);
  const [activeVoiceChannel, setActiveVoiceChannel] = useState<string | null>(
    null
  );
  const [activeVoiceChannelId, setActiveVoiceChannelId] = useState<
    number | null
  >(null);
  const [voiceJoined, setVoiceJoined] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [microphoneLevel, setMicrophoneLevel] = useState(0);
  const [microphoneMeterSupported, setMicrophoneMeterSupported] =
    useState(true);
  const [microphoneSensitivity, setMicrophoneSensitivity] = useState(() =>
    typeof window !== "undefined"
      ? normalizeMicrophoneSensitivity(
          Number(
            window.localStorage.getItem("cybercall-microphone-sensitivity") ||
              100
          )
        )
      : 100
  );
  const [speakingParticipants, setSpeakingParticipants] = useState<
    Record<number, boolean>
  >({});
  const [speechDetectionSupported, setSpeechDetectionSupported] =
    useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [localMediaStream, setLocalMediaStream] = useState<MediaStream | null>(
    null
  );
  const [remoteMediaStreams, setRemoteMediaStreams] = useState<
    Record<number, MediaStream>
  >({});
  const [voicePeerStates, setVoicePeerStates] = useState<
    Record<number, "connecting" | "connected" | "disconnected">
  >({});
  const [networkQualities, setNetworkQualities] = useState<
    Record<number, NetworkQuality>
  >({});
  const [voiceChatMessages, setVoiceChatMessages] = useState<
    VoiceChatMessage[]
  >([]);
  const [voiceChatDraft, setVoiceChatDraft] = useState("");
  const [editingVoiceChatId, setEditingVoiceChatId] = useState<string | null>(
    null
  );
  const [editingVoiceChatDraft, setEditingVoiceChatDraft] = useState("");
  const [voiceChatOpen, setVoiceChatOpen] = useState(false);
  const [voiceTypingParticipants, setVoiceTypingParticipants] = useState<
    Record<number, VoiceTypingParticipant>
  >({});
  const voiceChatTypingTimerRef = useRef<number | undefined>(undefined);
  const voiceChatMessagesRef = useRef<HTMLDivElement | null>(null);
  const [screenSharing, setScreenSharing] = useState(false);
  const [screenMediaStream, setScreenMediaStream] =
    useState<MediaStream | null>(null);
  const [mediaDevices, setMediaDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioInputId, setSelectedAudioInputId] = useState(() =>
    typeof window !== "undefined"
      ? window.localStorage.getItem("cybercall-audio-input") || ""
      : ""
  );
  const [selectedVideoInputId, setSelectedVideoInputId] = useState(() =>
    typeof window !== "undefined"
      ? window.localStorage.getItem("cybercall-video-input") || ""
      : ""
  );
  const [selectedAudioOutputId, setSelectedAudioOutputId] = useState(() =>
    typeof window !== "undefined"
      ? window.localStorage.getItem("cybercall-audio-output") || ""
      : ""
  );
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [mutedParticipantIds, setMutedParticipantIds] = useState<string[]>([]);
  const [removedParticipantIds, setRemovedParticipantIds] = useState<string[]>(
    []
  );
  const [moderationMenuId, setModerationMenuId] = useState<string | null>(null);
  const [dmDraft, setDmDraft] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<"main" | "settings">("main");
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileDisplayName, setProfileDisplayName] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [avatarEditorSource, setAvatarEditorSource] = useState<string | null>(
    null
  );
  const [avatarEditorZoom, setAvatarEditorZoom] = useState(1);
  const [avatarEditorOffset, setAvatarEditorOffset] = useState({ x: 0, y: 0 });
  const [avatarEditorDragging, setAvatarEditorDragging] = useState(false);
  const avatarEditorPointerRef = useRef({ x: 0, y: 0 });
  const avatarEditorRef = useRef<HTMLElement | null>(null);
  const [profilePresence, setProfilePresence] = useState<PresenceStatus>(() => {
    if (typeof window === "undefined") return "online";
    const saved = window.localStorage.getItem("cybercall-presence");
    return presenceOptions.some(option => option.value === saved)
      ? (saved as PresenceStatus)
      : "online";
  });
  const [realtimeStatus, setRealtimeStatus] = useState<
    "connecting" | "connected" | "reconnecting" | "closed"
  >("closed");
  const [realtimePresence, setRealtimePresence] = useState<
    Record<number, PresenceStatus>
  >({});
  const [communitySearch, setCommunitySearch] = useState("");
  const [channelGroupsOpen, setChannelGroupsOpen] = useState({
    info: true,
    text: true,
    voice: true,
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileNavRef = useRef<HTMLElement | null>(null);
  const mobileNavTriggerRef = useRef<HTMLButtonElement | null>(null);
  const profileTriggerRef = useRef<HTMLButtonElement | null>(null);
  const profilePanelRef = useRef<HTMLElement | null>(null);
  const globalSearchPanelRef = useRef<HTMLDivElement | null>(null);
  const realtimeClientRef = useRef<ReturnType<
    typeof createRealtimeClient
  > | null>(null);
  const voiceMeshRef = useRef<ReturnType<typeof createWebRtcMesh> | null>(null);
  const microphoneMeterRef = useRef<ReturnType<
    typeof createMicrophoneMeter
  > | null>(null);
  const speechDetectorsRef = useRef<
    Map<number, ReturnType<typeof createSpeechDetector>>
  >(new Map());
  const voiceRoomRef = useRef<HTMLDivElement | null>(null);
  const voiceTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >(() =>
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported"
  );
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDmFile, setSelectedDmFile] = useState<File | null>(null);
  const [moderationStatus, setModerationStatus] = useState<
    "idle" | "analyzing" | "blocked"
  >("idle");
  const [moderationMessage, setModerationMessage] = useState("");
  const seenInviteIdsRef = useRef<Set<number>>(new Set());
  const communitiesQuery = trpc.community.list.useQuery();
  const overviewQuery = trpc.community.overview.useQuery(
    { communityId: selectedCommunityId ?? 0 },
    { enabled: isAuthenticated && Boolean(selectedCommunityId), retry: false }
  );
  const messagesQuery = trpc.community.messages.useQuery(
    { channelId: selectedChannelId ?? 0 },
    { enabled: isAuthenticated && Boolean(selectedChannelId), retry: false }
  );
  const dmMessagesQuery = trpc.directMessage.list.useQuery(
    { otherUserId: activeDmUserId ?? 0 },
    { enabled: Boolean(activeDmUserId) }
  );
  const trpcUtils = trpc.useUtils();
  const notificationsQuery = trpc.notification.list.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });
  const roomInvitesQuery = trpc.roomInvite.list.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 5000,
  });
  const markNotificationRead = trpc.notification.markRead.useMutation({
    onSuccess: () => notificationsQuery.refetch(),
  });
  const createRoomInvite = trpc.roomInvite.create.useMutation({
    onSuccess: () => {
      toast.success(
        "Convite emitido. O piloto receberá um alerta no próximo pulso."
      );
    },
    onError: error =>
      toast.error(error.message || "Não foi possível emitir o convite."),
  });
  const respondRoomInvite = trpc.roomInvite.respond.useMutation({
    onSuccess: result => {
      roomInvitesQuery.refetch();
      toast.success(
        result.status === "accepted"
          ? "Convite aceito. Abrindo a sala."
          : "Convite recusado."
      );
      if (result.status === "accepted") {
        setActiveVoiceChannel(result.roomKey);
        setVoiceJoined(true);
      }
    },
    onError: error =>
      toast.error(error.message || "Este convite não está mais disponível."),
  });
  const sendDirectMessage = trpc.directMessage.send.useMutation({
    onSuccess: () => {
      setDmDraft("");
      if (activeDmUserId) dmMessagesQuery.refetch();
    },
    onError: error =>
      toast.error(
        error.message || "Não foi possível enviar a mensagem direta."
      ),
  });
  const updateMessage = trpc.message.update.useMutation({
    onSuccess: () => {
      setEditingMessageId(null);
      setEditingBody("");
      messagesQuery.refetch();
      toast.success("Mensagem editada.");
    },
    onError: error =>
      toast.error(error.message || "Não foi possível editar a mensagem."),
  });
  const deleteMessage = trpc.message.delete.useMutation({
    onSuccess: () => {
      messagesQuery.refetch();
      toast.success("Mensagem excluída.");
    },
    onError: error =>
      toast.error(error.message || "Não foi possível excluir a mensagem."),
  });
  const toggleReaction = trpc.message.toggleReaction.useMutation({
    onSuccess: result => {
      toast.success(result.active ? "Reação adicionada." : "Reação removida.");
      messagesQuery.refetch();
    },
    onError: error =>
      toast.error(error.message || "Entre para reagir às mensagens."),
  });
  const createCommunity = trpc.community.create.useMutation({
    onSuccess: async community => {
      toast.success("Comunidade criada.");
      await communitiesQuery.refetch();
      if (community?.id) setSelectedCommunityId(community.id);
    },
    onError: error =>
      toast.error(error.message || "Não foi possível criar a comunidade."),
  });
  const sendMessage = trpc.community.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      if (selectedChannelId) messagesQuery.refetch();
    },
    onError: error =>
      toast.error(error.message || "Não foi possível enviar a mensagem."),
  });
  const communities = communitiesQuery.data ?? [];
  const filteredCommunities = useMemo(
    () =>
      communities.filter(community =>
        community.name
          .toLowerCase()
          .includes(communitySearch.trim().toLowerCase())
      ),
    [communities, communitySearch]
  );
  const dataIssue =
    communitiesQuery.error ||
    overviewQuery.error ||
    messagesQuery.error ||
    notificationsQuery.error ||
    roomInvitesQuery.error;
  const pendingRoomInvites = roomInvitesQuery.data ?? [];
  const pendingRoomInviteCount = pendingRoomInvites.length;
  const channels = overviewQuery.data?.channels?.length
    ? overviewQuery.data.channels
    : demoChannels;
  const realtimeVoiceChannel = channels.find(
    channel =>
      channel.name === activeVoiceChannel && channel.channelType === "voice"
  );
  const resolvedVoiceChannelId =
    activeVoiceChannelId || realtimeVoiceChannel?.id || null;
  const voiceRoomKey = activeVoiceChannel || "lobby";

  function handleRealtimeEvent(event: RealtimeEvent) {
    if (event.type === "voice.typing") {
      if (
        resolvedVoiceChannelId &&
        event.scope.channelId === resolvedVoiceChannelId &&
        event.scope.roomKey === voiceRoomKey
      ) {
        const payload = event.payload as Partial<VoiceTypingParticipant> & {
          typing?: boolean;
        };
        if (
          typeof payload.userId === "number" &&
          typeof payload.authorName === "string"
        ) {
          setVoiceTypingParticipants(current => {
            const next = { ...current };
            if (payload.typing)
              next[payload.userId as number] = {
                userId: payload.userId as number,
                authorName: payload.authorName as string,
                expiresAt: event.occurredAt + 2500,
              };
            else delete next[payload.userId as number];
            return next;
          });
        }
      }
      return;
    }
    if (event.type === "voice.chat.updated") {
      if (
        resolvedVoiceChannelId &&
        event.scope.channelId === resolvedVoiceChannelId &&
        event.scope.roomKey === voiceRoomKey
      ) {
        const payload = event.payload as Partial<VoiceChatMessage>;
        if (
          typeof payload.id === "string" &&
          typeof payload.body === "string" &&
          typeof payload.editedAt === "number"
        )
          setVoiceChatMessages(current =>
            updateVoiceChatMessage(
              current,
              payload.id as string,
              payload.body as string,
              payload.editedAt as number
            )
          );
      }
      return;
    }
    if (event.type === "voice.chat.deleted") {
      if (
        resolvedVoiceChannelId &&
        event.scope.channelId === resolvedVoiceChannelId &&
        event.scope.roomKey === voiceRoomKey
      ) {
        const payload = event.payload as { messageId?: string };
        if (typeof payload.messageId === "string")
          setVoiceChatMessages(current =>
            removeVoiceChatMessage(current, payload.messageId as string)
          );
      }
      return;
    }
    if (event.type === "voice.chat") {
      if (
        resolvedVoiceChannelId &&
        event.scope.channelId === resolvedVoiceChannelId &&
        event.scope.roomKey === voiceRoomKey
      ) {
        const payload = event.payload as Partial<VoiceChatMessage>;
        if (
          typeof payload.id === "string" &&
          typeof payload.userId === "number" &&
          typeof payload.body === "string"
        ) {
          setVoiceChatMessages(current =>
            appendVoiceChatMessage(current, {
              id: payload.id as string,
              userId: payload.userId as number,
              authorName:
                typeof payload.authorName === "string"
                  ? payload.authorName
                  : "Piloto",
              body: payload.body as string,
              occurredAt: event.occurredAt,
              editedAt:
                typeof payload.editedAt === "number"
                  ? payload.editedAt
                  : undefined,
            })
          );
        }
      }
      return;
    }
    if (
      [
        "voice.members",
        "voice.peer.joined",
        "voice.peer.left",
        "voice.offer",
        "voice.answer",
        "voice.ice",
      ].includes(event.type)
    ) {
      if (
        resolvedVoiceChannelId &&
        event.scope.channelId === resolvedVoiceChannelId &&
        event.scope.roomKey === voiceRoomKey
      ) {
        void voiceMeshRef.current
          ?.handleEvent(event as VoiceSignalEvent)
          .catch(() =>
            toast.error("Não foi possível processar a sinalização da sala.")
          );
      }
      return;
    }
    if (event.type === "presence.updated") {
      const payload = event.payload as {
        userId?: number;
        status?: PresenceStatus;
      };
      if (
        payload.userId &&
        payload.status &&
        presenceOptions.some(option => option.value === payload.status)
      ) {
        setRealtimePresence(current => ({
          ...current,
          [payload.userId as number]: payload.status as PresenceStatus,
        }));
      }
      return;
    }
    if (
      event.type === "message.created" ||
      event.type === "message.updated" ||
      event.type === "message.deleted"
    ) {
      const channelId = event.scope.channelId;
      if (!channelId) return;
      const payload = event.payload as {
        id?: number;
        messageId?: number;
        body?: string;
        editedAt?: number | string;
      };
      trpcUtils.community.messages.setData({ channelId }, current => {
        if (!current) return current;
        if (event.type === "message.created") {
          if (current.some(item => item.id === payload.id)) return current;
          return [...current, payload as unknown as (typeof current)[number]];
        }
        if (event.type === "message.deleted")
          return current.filter(item => item.id !== payload.messageId);
        return current.map(item =>
          item.id === payload.messageId
            ? {
                ...item,
                body: payload.body ?? item.body,
                editedAt: payload.editedAt
                  ? new Date(payload.editedAt)
                  : item.editedAt,
              }
            : item
        );
      });
      return;
    }
    if (event.type === "dm.created" && activeDmUserId) {
      const payload = event.payload as { id?: number };
      trpcUtils.directMessage.list.setData(
        { otherUserId: activeDmUserId },
        current => {
          if (!current || current.some(item => item.id === payload.id))
            return current;
          return [...current, payload as unknown as (typeof current)[number]];
        }
      );
    }
  }

  useEffect(() => {
    if (!selectedCommunityId && communities[0]?.id)
      setSelectedCommunityId(communities[0].id);
  }, [communities, selectedCommunityId]);
  useEffect(() => {
    if (!isAuthenticated || !selectedCommunityId) {
      realtimeClientRef.current?.close();
      realtimeClientRef.current = null;
      setRealtimeStatus("closed");
      return;
    }
    const client = createRealtimeClient({
      subscriptions: [
        { communityId: selectedCommunityId },
        ...(selectedChannelId ? [{ channelId: selectedChannelId }] : []),
        ...(activeDmUserId ? [{ dmUserId: activeDmUserId }] : []),
      ],
      initialPresence: profilePresence,
      onStatus: setRealtimeStatus,
      onEvent: handleRealtimeEvent,
    });
    realtimeClientRef.current = client;
    return () => {
      client.close();
      if (realtimeClientRef.current === client)
        realtimeClientRef.current = null;
    };
  }, [isAuthenticated, selectedCommunityId, selectedChannelId, activeDmUserId]);
  useEffect(() => {
    if (isAuthenticated)
      realtimeClientRef.current?.setPresence(profilePresence);
  }, [isAuthenticated, profilePresence]);
  useEffect(() => {
    setProfileDisplayName(user?.name || "");
  }, [user?.name]);
  useEffect(() => {
    if (!avatarEditorSource) return;
    avatarEditorRef.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (isAvatarEditorEscapeKey(event.key)) resetAvatarEditor();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [avatarEditorSource]);
  useEffect(
    () => () => {
      if (profileAvatarUrl?.startsWith("blob:"))
        URL.revokeObjectURL(profileAvatarUrl);
    },
    [profileAvatarUrl]
  );
  useEffect(() => {
    if (!mobileNavOpen) return;
    mobileNavRef.current?.focus();
    const handleMobileNavKeyDown = (event: KeyboardEvent) => {
      handleMobileNavEscape(event.key, () => {
        window.requestAnimationFrame(() =>
          closeMobileNavState(setMobileNavOpen, mobileNavTriggerRef)
        );
      });
    };
    window.addEventListener("keydown", handleMobileNavKeyDown);
    return () => window.removeEventListener("keydown", handleMobileNavKeyDown);
  }, [mobileNavOpen]);
  useEffect(() => {
    if (!profileOpen) return;
    profilePanelRef.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
        window.requestAnimationFrame(() => profileTriggerRef.current?.focus());
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [profileOpen]);
  useEffect(() => {
    if (!activeVoiceChannel) return;
    setVoiceChatMessages([]);
    setVoiceChatDraft("");
    setEditingVoiceChatId(null);
    setEditingVoiceChatDraft("");
    setVoiceTypingParticipants({});
    setVoiceChatOpen(false);
  }, [activeVoiceChannel, voiceRoomKey]);
  useEffect(() => {
    const expiryTimer = window.setInterval(
      () =>
        setVoiceTypingParticipants(current =>
          pruneVoiceTypingParticipants(current)
        ),
      500
    );
    return () => window.clearInterval(expiryTimer);
  }, []);
  useEffect(() => {
    if (!activeVoiceChannel || !voiceJoined || !resolvedVoiceChannelId) return;
    const typing = Boolean(voiceChatDraft.trim());
    realtimeClientRef.current?.sendCommand({
      type: "voice.typing",
      channelId: resolvedVoiceChannelId,
      roomKey: voiceRoomKey,
      typing,
    });
    if (voiceChatTypingTimerRef.current !== undefined)
      window.clearTimeout(voiceChatTypingTimerRef.current);
    if (typing)
      voiceChatTypingTimerRef.current = window.setTimeout(
        () =>
          realtimeClientRef.current?.sendCommand({
            type: "voice.typing",
            channelId: resolvedVoiceChannelId,
            roomKey: voiceRoomKey,
            typing: false,
          }),
        1200
      );
    return () => {
      if (voiceChatTypingTimerRef.current !== undefined)
        window.clearTimeout(voiceChatTypingTimerRef.current);
    };
  }, [
    voiceChatDraft,
    activeVoiceChannel,
    voiceJoined,
    resolvedVoiceChannelId,
    voiceRoomKey,
  ]);
  useEffect(() => {
    const container = voiceChatMessagesRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [voiceChatMessages, voiceChatOpen]);
  useEffect(() => {
    if (!activeVoiceChannel) return;
    if (voiceRoomRef.current) focusVoiceRoom(voiceRoomRef.current);
    const handleVoiceEscape = (event: KeyboardEvent) => {
      handleVoiceRoomKey(event.key, closeVoiceRoom);
    };
    window.addEventListener("keydown", handleVoiceEscape);
    return () => window.removeEventListener("keydown", handleVoiceEscape);
  }, [activeVoiceChannel]);
  useEffect(() => {
    if (!voiceJoined || !resolvedVoiceChannelId) {
      voiceMeshRef.current?.close();
      voiceMeshRef.current = null;
      setRemoteMediaStreams({});
      setVoicePeerStates({});
      setNetworkQualities({});
      return;
    }
    const mesh = createWebRtcMesh({
      channelId: resolvedVoiceChannelId,
      roomKey: voiceRoomKey,
      localUserId: user?.id || 0,
      sendSignal: command => realtimeClientRef.current?.sendCommand(command),
      onRemoteStream: (userId, stream) =>
        setRemoteMediaStreams(current => ({ ...current, [userId]: stream })),
      onPeerState: (userId, state) =>
        setVoicePeerStates(current => ({ ...current, [userId]: state })),
      onPeerQuality: (userId, quality) =>
        setNetworkQualities(current => ({ ...current, [userId]: quality })),
    });
    voiceMeshRef.current = mesh;
    mesh.setLocalStream(localMediaStream);
    return () => {
      mesh.close();
      if (voiceMeshRef.current === mesh) voiceMeshRef.current = null;
    };
  }, [voiceJoined, resolvedVoiceChannelId, voiceRoomKey, user?.id]);
  useEffect(() => {
    voiceMeshRef.current?.setLocalStream(localMediaStream);
  }, [localMediaStream]);
  useEffect(() => {
    microphoneMeterRef.current?.close();
    microphoneMeterRef.current = null;
    if (
      !voiceJoined ||
      !localMediaStream ||
      localMediaStream.getAudioTracks().length === 0
    ) {
      setMicrophoneLevel(0);
      setMicrophoneMeterSupported(true);
      return;
    }
    const meter = createMicrophoneMeter(
      localMediaStream,
      level => setMicrophoneLevel(voiceMuted ? 0 : level),
      undefined,
      microphoneSensitivity
    );
    microphoneMeterRef.current = meter;
    setMicrophoneMeterSupported(meter.supported);
    return () => {
      meter.close();
      if (microphoneMeterRef.current === meter)
        microphoneMeterRef.current = null;
    };
  }, [localMediaStream, voiceJoined, voiceMuted, microphoneSensitivity]);
  useEffect(() => {
    speechDetectorsRef.current.forEach(detector => detector.close());
    speechDetectorsRef.current.clear();
    setSpeakingParticipants({});
    if (!voiceJoined) {
      setSpeechDetectionSupported(true);
      return;
    }
    let supported = true;
    const attachDetector = (userId: number, stream: MediaStream) => {
      const detector = createSpeechDetector(
        stream,
        speaking =>
          setSpeakingParticipants(current => ({
            ...current,
            [userId]: speaking,
          })),
        globalThis,
        { threshold: 0.075, releaseThreshold: 0.045 }
      );
      supported = supported && detector.supported;
      speechDetectorsRef.current.set(userId, detector);
    };
    if (localMediaStream && !voiceMuted && user?.id)
      attachDetector(user.id, localMediaStream);
    Object.entries(remoteMediaStreams).forEach(([userId, stream]) =>
      attachDetector(Number(userId), stream)
    );
    setSpeechDetectionSupported(supported);
    return () => {
      speechDetectorsRef.current.forEach(detector => detector.close());
      speechDetectorsRef.current.clear();
    };
  }, [localMediaStream, remoteMediaStreams, user?.id, voiceJoined, voiceMuted]);
  useEffect(() => {
    if (
      voiceJoined &&
      resolvedVoiceChannelId &&
      realtimeStatus === "connected"
    ) {
      realtimeClientRef.current?.sendCommand({
        type: "voice.join",
        channelId: resolvedVoiceChannelId,
        roomKey: voiceRoomKey,
      });
    }
  }, [voiceJoined, resolvedVoiceChannelId, voiceRoomKey, realtimeStatus]);
  useEffect(() => {
    if (!isAuthenticated) return;
    pendingRoomInvites.forEach(invite => {
      if (seenInviteIdsRef.current.has(invite.id)) return;
      seenInviteIdsRef.current.add(invite.id);
      const title = `Convite recebido: ${invite.roomName}`;
      const body = `${invite.senderName || "Um piloto"} convidou você para uma sala.`;
      toast.info(title, { description: body });
      if (
        notificationPermission === "granted" &&
        typeof window !== "undefined" &&
        "Notification" in window
      ) {
        try {
          emitRoomInviteNotification(invite, Notification, () => {
            window.focus();
            setNotificationsOpen(true);
          });
        } catch {
          toast.info(
            "O alerta nativo não pôde ser exibido; confira a central de sinais."
          );
        }
      }
    });
  }, [isAuthenticated, notificationPermission, pendingRoomInvites]);
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTypingField =
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.isContentEditable;
      if (
        (event.key === "k" && (event.metaKey || event.ctrlKey)) ||
        (event.key === "/" && !isTypingField)
      ) {
        event.preventDefault();
        setGlobalSearchOpen(true);
        window.requestAnimationFrame(() =>
          globalSearchInputRef.current?.focus()
        );
        return;
      }
      if (event.key === "Escape" && globalSearchOpen) {
        event.preventDefault();
        setGlobalSearchOpen(false);
        globalSearchPanelRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [globalSearchOpen]);
  useEffect(() => {
    if (
      selectedCommunityId &&
      overviewQuery.data?.channels?.[0] &&
      selectedChannelId === null
    )
      setSelectedChannelId(overviewQuery.data.channels[0].id);
  }, [overviewQuery.data, selectedChannelId, selectedCommunityId]);
  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    let active = true;
    const refreshDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (active) setMediaDevices(devices);
      } catch {
        if (active) setMediaDevices([]);
      }
    };
    void refreshDevices();
    navigator.mediaDevices.addEventListener?.("devicechange", refreshDevices);
    return () => {
      active = false;
      navigator.mediaDevices.removeEventListener?.(
        "devicechange",
        refreshDevices
      );
    };
  }, []);
  const selectedCommunity = overviewQuery.data?.community;
  const dataLoading =
    communitiesQuery.isLoading ||
    Boolean(selectedCommunityId && overviewQuery.isLoading) ||
    Boolean(selectedChannelId && messagesQuery.isLoading);
  const members = overviewQuery.data?.members ?? [];
  const currentMember = members.find(member => member.userId === user?.id);
  const canModerateVoice =
    user?.role === "admin" ||
    ["owner", "admin", "moderator"].includes(currentMember?.memberRole ?? "");
  const voiceParticipants = members
    .filter(member => !removedParticipantIds.includes(String(member.id)))
    .slice(0, 6)
    .map(member => ({
      id: member.id,
      userId: member.userId,
      name: member.name || "Piloto",
      role: member.memberRole,
      presence:
        realtimePresence[member.userId] ||
        (member.status === "away"
          ? "away"
          : member.status === "offline"
            ? "invisible"
            : "online"),
      muted: mutedParticipantIds.includes(String(member.id)),
    }));
  const messages = messagesQuery.data?.length
    ? messagesQuery.data
    : demoMessages;
  const visibleMessages = useMemo(
    () =>
      messages.filter(
        item =>
          !search ||
          `${item.authorName} ${item.body}`
            .toLowerCase()
            .includes(search.toLowerCase())
      ),
    [messages, search]
  );
  const globalSearchResults = useMemo(
    () => searchGlobalContent(globalSearchQuery, messages, members),
    [globalSearchQuery, messages, members]
  );
  const filteredGlobalSearchResults = useMemo(
    () => filterGlobalSearchResults(globalSearchResults, globalSearchFilter),
    [globalSearchResults, globalSearchFilter]
  );
  const globalSearchCounts = useMemo(
    () => ({
      all: globalSearchResults.length,
      message: globalSearchResults.filter(result => result.kind === "message")
        .length,
      user: globalSearchResults.filter(result => result.kind === "user").length,
    }),
    [globalSearchResults]
  );
  const selectedFilePreview = useMemo(
    () =>
      selectedFile?.type.startsWith("image/")
        ? URL.createObjectURL(selectedFile)
        : null,
    [selectedFile]
  );
  useEffect(
    () => () => {
      if (selectedFilePreview) URL.revokeObjectURL(selectedFilePreview);
    },
    [selectedFilePreview]
  );
  useEffect(() => {
    if (typeof window !== "undefined")
      window.localStorage.setItem(
        recentSearchStorageKey,
        JSON.stringify(normalizeRecentSearches(recentSearches))
      );
  }, [recentSearches]);

  function recordRecentSearch(query: string) {
    setRecentSearches(current => addRecentSearch(current, query));
  }
  function selectRecentSearch(query: string) {
    setGlobalSearchQuery(query);
    setGlobalSearchFilter("all");
    window.requestAnimationFrame(() => globalSearchInputRef.current?.focus());
  }
  function removeRecentSearch(query: string) {
    setRecentSearches(current => current.filter(item => item !== query));
  }
  function clearRecentSearches() {
    setRecentSearches([]);
  }

  async function handleEnableNativeNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      toast.error("Este navegador não oferece notificações nativas.");
      return;
    }
    if (Notification.permission === "denied") {
      setNotificationPermission("denied");
      toast.error(
        "As notificações estão bloqueadas. Reative-as nas configurações do navegador."
      );
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    toast[permission === "granted" ? "success" : "info"](
      permission === "granted"
        ? "Notificações nativas ativadas."
        : "A central de sinais continuará como fallback."
    );
  }

  async function startVoiceMedia() {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Este navegador não oferece captura de áudio/vídeo.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        getMediaConstraints(true, cameraEnabled, {
          audioDeviceId: selectedAudioInputId || undefined,
          videoDeviceId: selectedVideoInputId || undefined,
        })
      );
      setLocalMediaStream(stream);
      void navigator.mediaDevices
        .enumerateDevices()
        .then(setMediaDevices)
        .catch(() => undefined);
      setVoiceJoined(true);
      toast.success("Mídia local conectada à sala.");
    } catch {
      try {
        const audioOnly = await navigator.mediaDevices.getUserMedia(
          getMediaConstraints(true, false, {
            audioDeviceId: selectedAudioInputId || undefined,
          })
        );
        setLocalMediaStream(audioOnly);
        void navigator.mediaDevices
          .enumerateDevices()
          .then(setMediaDevices)
          .catch(() => undefined);
        setCameraEnabled(false);
        setVoiceJoined(true);
        toast.info("Câmera indisponível; sala iniciada somente com áudio.");
      } catch {
        toast.error(
          "Permissão de microfone/câmera negada. A sala continua disponível em modo de prévia."
        );
      }
    }
  }

  function sendVoiceChatMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = normalizeVoiceChatBody(voiceChatDraft);
    if (!body) return;
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    if (!voiceJoined || !resolvedVoiceChannelId) {
      toast.info("Entre na sala antes de enviar mensagens.");
      return;
    }
    realtimeClientRef.current?.sendCommand({
      type: "voice.chat",
      channelId: resolvedVoiceChannelId,
      roomKey: voiceRoomKey,
      body,
    });
    setVoiceChatDraft("");
  }

  function startVoiceChatEdit(item: VoiceChatMessage) {
    if (item.userId !== user?.id) return;
    setEditingVoiceChatId(item.id);
    setEditingVoiceChatDraft(item.body);
  }

  function cancelVoiceChatEdit() {
    setEditingVoiceChatId(null);
    setEditingVoiceChatDraft("");
  }

  function submitVoiceChatEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = normalizeVoiceChatBody(editingVoiceChatDraft);
    if (!editingVoiceChatId || !body || !resolvedVoiceChannelId || !voiceJoined)
      return;
    realtimeClientRef.current?.sendCommand({
      type: "voice.chat.edit",
      channelId: resolvedVoiceChannelId,
      roomKey: voiceRoomKey,
      messageId: editingVoiceChatId,
      body,
    });
    cancelVoiceChatEdit();
  }

  function deleteVoiceChatMessage(item: VoiceChatMessage) {
    if (item.userId !== user?.id || !resolvedVoiceChannelId || !voiceJoined)
      return;
    if (
      !window.confirm(
        "Excluir esta mensagem da chamada? Esta ação não pode ser desfeita."
      )
    )
      return;
    realtimeClientRef.current?.sendCommand({
      type: "voice.chat.delete",
      channelId: resolvedVoiceChannelId,
      roomKey: voiceRoomKey,
      messageId: item.id,
    });
    if (editingVoiceChatId === item.id) cancelVoiceChatEdit();
  }

  function leaveVoiceMedia() {
    screenMediaStream?.getTracks().forEach(track => track.stop());
    setScreenMediaStream(null);
    setScreenSharing(false);
    realtimeClientRef.current?.sendCommand(
      resolvedVoiceChannelId
        ? {
            type: "voice.leave",
            channelId: resolvedVoiceChannelId,
            roomKey: voiceRoomKey,
          }
        : { type: "ping" }
    );
    voiceMeshRef.current?.close();
    voiceMeshRef.current = null;
    localMediaStream?.getTracks().forEach(track => track.stop());
    setLocalMediaStream(null);
    setRemoteMediaStreams({});
    setVoicePeerStates({});
    setVoiceJoined(false);
  }

  async function toggleCamera() {
    if (!voiceJoined || !localMediaStream) {
      setCameraEnabled(enabled => !enabled);
      return;
    }
    if (cameraEnabled) {
      voiceMeshRef.current?.setTrackEnabled("video", false);
      setCameraEnabled(false);
      return;
    }
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia(
        getMediaConstraints(false, true, {
          videoDeviceId: selectedVideoInputId || undefined,
        })
      );
      cameraStream
        .getVideoTracks()
        .forEach(track => localMediaStream.addTrack(track));
      voiceMeshRef.current?.setLocalStream(localMediaStream);
      await voiceMeshRef.current?.renegotiateAll();
      setCameraEnabled(true);
    } catch {
      toast.error("Não foi possível ativar a câmera.");
    }
  }

  function toggleMicrophone() {
    const nextMuted = !voiceMuted;
    voiceMeshRef.current?.setTrackEnabled("audio", !nextMuted);
    setVoiceMuted(nextMuted);
  }

  function changeMicrophoneSensitivity(value: number) {
    const next = normalizeMicrophoneSensitivity(value);
    setMicrophoneSensitivity(next);
    window.localStorage.setItem(
      "cybercall-microphone-sensitivity",
      String(next)
    );
  }

  function resetMicrophoneSensitivity() {
    setMicrophoneSensitivity(100);
    window.localStorage.removeItem("cybercall-microphone-sensitivity");
  }

  async function changeAudioInput(deviceId: string) {
    setSelectedAudioInputId(deviceId);
    window.localStorage.setItem("cybercall-audio-input", deviceId);
    if (
      !voiceJoined ||
      !localMediaStream ||
      !navigator.mediaDevices?.getUserMedia
    )
      return;
    try {
      const replacement = await navigator.mediaDevices.getUserMedia({
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        video: false,
      });
      const nextTrack = replacement.getAudioTracks()[0];
      if (!nextTrack) return;
      const oldTracks = localMediaStream.getAudioTracks();
      await voiceMeshRef.current?.replaceTrack("audio", nextTrack);
      oldTracks.forEach(track => {
        track.stop();
        localMediaStream.removeTrack(track);
      });
      localMediaStream.addTrack(nextTrack);
      setLocalMediaStream(new MediaStream(localMediaStream.getTracks()));
      setVoiceMuted(false);
      toast.success("Microfone de transmissão atualizado.");
    } catch {
      toast.error("Não foi possível ativar este microfone.");
    }
  }

  async function changeVideoInput(deviceId: string) {
    setSelectedVideoInputId(deviceId);
    window.localStorage.setItem("cybercall-video-input", deviceId);
    if (
      !voiceJoined ||
      !localMediaStream ||
      !cameraEnabled ||
      !navigator.mediaDevices?.getUserMedia
    )
      return;
    try {
      const replacement = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
      });
      const nextTrack = replacement.getVideoTracks()[0];
      if (!nextTrack) return;
      const oldTracks = localMediaStream.getVideoTracks();
      await voiceMeshRef.current?.replaceTrack("video", nextTrack);
      oldTracks.forEach(track => {
        track.stop();
        localMediaStream.removeTrack(track);
      });
      localMediaStream.addTrack(nextTrack);
      setLocalMediaStream(new MediaStream(localMediaStream.getTracks()));
      toast.success("Câmera de transmissão atualizada.");
    } catch {
      toast.error("Não foi possível ativar esta câmera.");
    }
  }

  function stopScreenShare() {
    const screenTrack = screenMediaStream?.getVideoTracks()[0];
    screenTrack?.stop();
    const cameraTrack = localMediaStream?.getVideoTracks()[0] || null;
    void voiceMeshRef.current?.replaceTrack("video", cameraTrack);
    setScreenMediaStream(null);
    setScreenSharing(false);
  }

  async function toggleScreenShare() {
    if (!voiceJoined || !voiceMeshRef.current) {
      toast.info("Entre na sala antes de compartilhar sua tela.");
      return;
    }
    if (screenSharing) {
      stopScreenShare();
      return;
    }
    if (!navigator.mediaDevices?.getDisplayMedia) {
      toast.error("Este navegador não oferece compartilhamento de tela.");
      return;
    }
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      const screenTrack = displayStream.getVideoTracks()[0];
      if (!screenTrack) return;
      screenTrack.onended = () => stopScreenShare();
      await voiceMeshRef.current.replaceTrack("video", screenTrack);
      setScreenMediaStream(displayStream);
      setScreenSharing(true);
      toast.success("Tela compartilhada com a sala.");
    } catch {
      toast.info("Compartilhamento de tela cancelado ou bloqueado.");
    }
  }

  function openVoiceRoom(
    event: MouseEvent<HTMLButtonElement>,
    channelName: string,
    channelId?: number
  ) {
    openVoiceRoomState(
      channelName,
      setActiveVoiceChannel,
      setVoiceJoined,
      voiceTriggerRef,
      event.currentTarget
    );
    setActiveVoiceChannelId(channelId || null);
  }
  function closeVoiceRoom() {
    if (voiceJoined) leaveVoiceMedia();
    closeVoiceRoomState(setActiveVoiceChannel, setVoiceJoined, voiceTriggerRef);
    setActiveVoiceChannelId(null);
  }

  function resetAvatarEditor() {
    if (avatarEditorSource?.startsWith("blob:"))
      URL.revokeObjectURL(avatarEditorSource);
    setAvatarEditorSource(null);
    setAvatarEditorZoom(1);
    setAvatarEditorOffset({ x: 0, y: 0 });
    setAvatarEditorDragging(false);
  }

  function openAvatarEditor(file: File) {
    const validationError = validateProfileAvatarFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (avatarEditorSource?.startsWith("blob:"))
      URL.revokeObjectURL(avatarEditorSource);
    setAvatarEditorSource(URL.createObjectURL(file));
    setAvatarEditorZoom(1);
    setAvatarEditorOffset({ x: 0, y: 0 });
  }

  async function applyAvatarCrop() {
    if (!avatarEditorSource || !canApplyAvatarCrop(avatarEditorSource)) return;
    try {
      const croppedAvatar = await cropAvatarImage(
        avatarEditorSource,
        avatarEditorZoom,
        avatarEditorOffset.x,
        avatarEditorOffset.y
      );
      setProfileAvatarUrl(croppedAvatar);
      resetAvatarEditor();
      toast.success("Avatar recortado e aplicado localmente.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível recortar o avatar."
      );
    }
  }

  function handleAvatarPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    avatarEditorPointerRef.current = { x: event.clientX, y: event.clientY };
    setAvatarEditorDragging(true);
  }

  function handleAvatarPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!avatarEditorDragging) return;
    const previous = avatarEditorPointerRef.current;
    setAvatarEditorOffset(offset => ({
      x: offset.x + event.clientX - previous.x,
      y: offset.y + event.clientY - previous.y,
    }));
    avatarEditorPointerRef.current = { x: event.clientX, y: event.clientY };
  }

  function handleAvatarPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    setAvatarEditorDragging(false);
  }

  function handleCreateCommunity() {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    const name = window.prompt("Nome da nova comunidade");
    if (!name?.trim()) return;
    createCommunity.mutate({
      name: name.trim(),
      description: "Uma comunidade CyberCall em construção.",
    });
  }

  function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingMessageId || !editingBody.trim()) return;
    updateMessage.mutate({
      messageId: editingMessageId,
      body: editingBody.trim(),
    });
  }

  async function uploadAttachment(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/attachments", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(result.error || "Não foi possível enviar o anexo.");
    return result;
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim() && !selectedFile) return;
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    if (!selectedCommunityId || !selectedChannelId) {
      toast.info("Crie ou selecione uma comunidade para enviar mensagens.");
      return;
    }
    try {
      setIsUploading(Boolean(selectedFile));
      setModerationStatus(selectedFile ? "analyzing" : "idle");
      setModerationMessage("");
      let attachment;
      if (selectedFile) {
        attachment = await uploadAttachment(selectedFile);
      }
      sendMessage.mutate({
        communityId: selectedCommunityId,
        channelId: selectedChannelId,
        body: message.trim() || "Anexo enviado",
        attachment,
      });
      setSelectedFile(null);
      setModerationStatus("idle");
      setModerationMessage("");
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "Falha no upload do anexo.";
      setModerationStatus(selectedFile ? "blocked" : "idle");
      setModerationMessage(selectedFile ? reason : "");
      toast.error(reason);
    } finally {
      setIsUploading(false);
    }
  }

  if (loading)
    return (
      <div className="grid min-h-screen place-items-center bg-[#080b10] font-display text-xs uppercase tracking-[0.2em] text-[#6fffe9]">
        Inicializando sinal...
      </div>
    );

  return (
    <main className="cybercall-app min-h-screen bg-[radial-gradient(circle_at_50%_-10%,rgba(111,255,233,0.07),transparent_30%),#080b10] text-[#f3f7f5] selection:bg-[#6fffe9] selection:text-[#080b10]">
      {globalSearchOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-[#05070b]/80 px-4 pt-[12vh] backdrop-blur-sm"
          onMouseDown={event => {
            if (event.target === event.currentTarget)
              setGlobalSearchOpen(false);
          }}
        >
          <div
            ref={globalSearchPanelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="global-search-title"
            className="global-search-panel w-full max-w-2xl overflow-hidden border border-[#6fffe9]/35 bg-[#0b1117] shadow-[0_24px_100px_rgba(0,0,0,.55),0_0_50px_rgba(111,255,233,.08)]"
          >
            <div className="flex items-center gap-3 border-b border-[#26363a] px-4 py-3">
              <Search size={18} className="shrink-0 text-[#6fffe9]" />
              <input
                ref={globalSearchInputRef}
                autoFocus
                value={globalSearchQuery}
                onChange={event => setGlobalSearchQuery(event.target.value)}
                placeholder="Buscar mensagens ou usuários..."
                aria-label="Busca global"
                className="min-w-0 flex-1 bg-transparent font-display text-sm text-[#f3f7f5] outline-none placeholder:text-[#526366]"
              />
              <kbd className="hidden border border-[#26363a] px-2 py-1 font-display text-[9px] text-[#718183] sm:inline">
                ESC
              </kbd>
              <button
                type="button"
                onClick={() => setGlobalSearchOpen(false)}
                className="grid min-h-9 min-w-9 place-items-center text-[#718183] transition hover:text-[#ffb547]"
                aria-label="Fechar busca global"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[min(58vh,520px)] overflow-y-auto p-3">
              <div
                id="global-search-title"
                className="px-2 pb-2 font-display text-[9px] uppercase tracking-[0.18em] text-[#718183]"
              >
                Busca global · mensagens e pilotos
              </div>
              <div
                className="mb-3 grid grid-cols-3 gap-1 border-b border-[#26363a] pb-3"
                role="tablist"
                aria-label="Filtrar resultados da busca"
              >
                {(
                  [
                    {
                      value: "all",
                      label: "Todos",
                      icon: <Search size={12} />,
                    },
                    {
                      value: "message",
                      label: "Mensagens",
                      icon: <MessageSquarePlus size={12} />,
                    },
                    {
                      value: "user",
                      label: "Usuários",
                      icon: <Users size={12} />,
                    },
                  ] as const
                ).map(filter => (
                  <button
                    type="button"
                    key={filter.value}
                    role="tab"
                    aria-selected={globalSearchFilter === filter.value}
                    onClick={() => setGlobalSearchFilter(filter.value)}
                    className={`flex min-h-9 items-center justify-center gap-1.5 border px-2 font-display text-[9px] uppercase tracking-[0.1em] transition ${globalSearchFilter === filter.value ? "border-[#6fffe9]/55 bg-[#102327] text-[#6fffe9]" : "border-transparent text-[#718183] hover:border-[#26363a] hover:text-[#f3f7f5]"}`}
                  >
                    {filter.icon}
                    <span className="hidden sm:inline">{filter.label}</span>
                    <span>{globalSearchCounts[filter.value]}</span>
                  </button>
                ))}
              </div>
              {!globalSearchQuery.trim() && recentSearches.length > 0 && (
                <section
                  className="mb-3 border border-[#26363a] bg-[#0f191d] p-2"
                  aria-labelledby="recent-searches-title"
                >
                  <div className="flex items-center justify-between px-2 pb-2">
                    <span
                      id="recent-searches-title"
                      className="font-display text-[9px] uppercase tracking-[0.16em] text-[#718183]"
                    >
                      Buscas recentes
                    </span>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="font-display text-[8px] uppercase tracking-[0.12em] text-[#718183] transition hover:text-[#ffb547]"
                    >
                      Limpar tudo
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map(recent => (
                      <div
                        key={recent}
                        className="flex items-center gap-2 border border-transparent transition hover:border-[#26363a] hover:bg-[#111f23]"
                      >
                        <button
                          type="button"
                          onClick={() => selectRecentSearch(recent)}
                          className="flex min-h-9 min-w-0 flex-1 items-center gap-2 px-2 text-left"
                        >
                          <Search
                            size={12}
                            className="shrink-0 text-[#6fffe9]"
                          />
                          <span className="truncate text-xs text-[#b8c4c4]">
                            {recent}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRecentSearch(recent)}
                          className="mr-1 grid min-h-8 min-w-8 place-items-center text-[#526366] transition hover:text-[#ffb547]"
                          aria-label={`Remover busca recente ${recent}`}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {globalSearchQuery.trim() &&
                filteredGlobalSearchResults.length === 0 && (
                  <div className="grid min-h-32 place-items-center px-4 text-center">
                    <Search size={22} className="text-[#26363a]" />
                    <p className="mt-3 font-display text-[10px] uppercase tracking-[0.14em] text-[#718183]">
                      Nenhum sinal encontrado
                    </p>
                    <p className="mt-1 text-xs text-[#526366]">
                      Tente outro nome ou palavra-chave.
                    </p>
                  </div>
                )}
              {!globalSearchQuery.trim() && (
                <div className="grid min-h-32 place-items-center px-4 text-center">
                  <p className="font-display text-[10px] uppercase tracking-[0.14em] text-[#6fffe9]">
                    Digite para começar
                  </p>
                  <p className="mt-1 text-xs text-[#526366]">
                    Use / ou Ctrl/Cmd+K a qualquer momento.
                  </p>
                </div>
              )}
              {filteredGlobalSearchResults.length > 0 && (
                <div className="space-y-1">
                  {filteredGlobalSearchResults.map(result => (
                    <button
                      type="button"
                      key={result.id}
                      onClick={() => {
                        recordRecentSearch(globalSearchQuery);
                        if (result.kind === "message" && "body" in result)
                          setSearch(result.body || "");
                        setGlobalSearchOpen(false);
                      }}
                      className="global-search-result flex w-full items-start gap-3 border border-transparent px-3 py-3 text-left transition hover:border-[#6fffe9]/25 hover:bg-[#101d20]"
                    >
                      <span
                        className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center border ${result.kind === "message" ? "border-[#6fffe9]/25 text-[#6fffe9]" : "border-[#ffb547]/25 text-[#ffb547]"}`}
                      >
                        {result.kind === "message" ? (
                          <MessageSquarePlus size={14} />
                        ) : (
                          <Users size={14} />
                        )}
                      </span>
                      <span className="min-w-0">
                        <strong className="block truncate font-display text-xs text-[#f3f7f5]">
                          {renderSearchHighlight(
                            result.title,
                            globalSearchQuery
                          )}
                        </strong>
                        <span className="mt-1 block truncate text-[11px] text-[#718183]">
                          {renderSearchHighlight(
                            result.subtitle,
                            globalSearchQuery
                          )}
                        </span>
                        {"body" in result && result.body && (
                          <span className="mt-1 block line-clamp-2 text-xs leading-5 text-[#b8c4c4]">
                            {renderSearchHighlight(
                              result.body,
                              globalSearchQuery
                            )}
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-[#26363a] px-4 py-2 font-display text-[9px] uppercase tracking-[0.12em] text-[#526366]">
              <span>{filteredGlobalSearchResults.length} resultados</span>
              <span>Enter seleciona · Esc fecha</span>
            </div>
          </div>
        </div>
      )}
      <header className="flex h-16 items-center border-b border-[#26363a] bg-[linear-gradient(90deg,#080b10,#0b171a,#0b1115)] px-4 sm:px-6">
        <div className="flex w-[236px] items-center gap-3 border-r border-[#26363a] pr-6">
          <span className="grid h-9 w-9 place-items-center border border-[#6fffe9]/60 bg-[#080b10]/70 p-1 text-[#6fffe9]">
            <img
              src={cyberCallLogo}
              alt=""
              className="h-full w-full object-contain"
            />
          </span>
          <div>
            <strong className="block font-display text-sm tracking-[0.16em]">
              CYBERCALL
            </strong>
            <span className="font-display text-[8px] uppercase tracking-[0.2em] text-[#6fffe9]">
              Future in communication / 01
            </span>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-between pl-5">
          <div className="hidden items-center gap-3 font-display text-[10px] uppercase tracking-[0.18em] text-[#718183] sm:flex">
            <Radio className="h-3 w-3 text-[#6fffe9]" /> Live network{" "}
            <span className="text-[#ffb547]">
              {communities.length || "—"} communities
            </span>
            <span
              className={
                realtimeStatus === "connected"
                  ? "text-[#6fffe9]"
                  : "text-[#ffb547]"
              }
            >
              {realtimeStatus === "connected" ? "· realtime" : "· reconectando"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  startLogin();
                  return;
                }
                setNotificationsOpen(open => !open);
              }}
              className="relative p-2 text-[#718183] transition hover:text-[#6fffe9]"
              aria-label="Notificações"
            >
              <Bell size={17} />
              {(notificationsQuery.data?.some(item => !item.readAt) ||
                pendingRoomInviteCount > 0) && (
                <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center bg-[#ffb547] px-1 font-display text-[8px] font-bold text-[#080b10] shadow-[0_0_12px_rgba(255,181,71,.65)]">
                  {pendingRoomInviteCount || "!"}
                </span>
              )}
            </button>
            {isAuthenticated ? (
              <button
                ref={profileTriggerRef}
                onClick={() => {
                  if (profileOpen) {
                    setProfileOpen(false);
                    window.requestAnimationFrame(() =>
                      profileTriggerRef.current?.focus()
                    );
                  } else setProfileOpen(true);
                }}
                className="flex items-center gap-2 border-l border-[#26363a] pl-3 text-left transition hover:text-[#6fffe9]"
                aria-label="Abrir perfil da sessão"
                aria-expanded={profileOpen}
                aria-controls="cybercall-profile-panel"
              >
                <Avatar
                  name={user?.name}
                  imageUrl={profileAvatarUrl}
                  presence={profilePresence}
                />
                <span className="hidden max-w-28 truncate font-display text-[10px] uppercase tracking-[0.12em] text-[#a8b6b7] sm:block">
                  {user?.name || "piloto"}
                </span>
                <Settings size={14} className="text-[#718183]" />
              </button>
            ) : (
              <button
                onClick={() => {
                  window.location.href = "/auth";
                }}
                className="bg-[#6fffe9] px-3 py-2 font-display text-[10px] font-bold uppercase tracking-[0.12em] text-[#080b10] transition hover:bg-[#f3f7f5]"
              >
                Entrar
              </button>
            )}
          </div>
        </div>
      </header>
      {profileOpen && isAuthenticated && (
        <section
          ref={profilePanelRef}
          id="cybercall-profile-panel"
          tabIndex={-1}
          className="absolute right-4 top-[4.5rem] z-30 w-[min(340px,calc(100vw-2rem))] border border-[#6fffe9]/40 bg-[#0b1115]/95 p-1 shadow-[0_0_38px_rgba(111,255,233,.12)] backdrop-blur-md"
          role="dialog"
          aria-labelledby="cybercall-profile-title"
        >
          <div className="border border-[#26363a] p-4">
            <div className="flex items-start gap-3">
              <Avatar
                name={user?.name}
                imageUrl={profileAvatarUrl}
                presence={profilePresence}
              />
              <div className="min-w-0 flex-1">
                <p
                  id="cybercall-profile-title"
                  className="font-display text-xs uppercase tracking-[0.14em] text-[#f3f7f5]"
                >
                  {cyberCallProfilePanelCopy.title} · {user?.name || "Piloto"}
                </p>
                <p className="mt-1 truncate text-xs text-[#8c9c9e]">
                  {user?.email || "E-mail protegido"}
                </p>
              </div>
              <span className="border border-[#ffb547]/40 px-2 py-1 font-display text-[8px] uppercase tracking-[0.12em] text-[#ffb547]">
                {user?.role || "user"}
              </span>
            </div>
            <div
              className="mt-4 grid grid-cols-2 border-b border-[#26363a]"
              role="tablist"
              aria-label="Seções do perfil"
            >
              <button
                type="button"
                role="tab"
                aria-selected={profileTab === "main"}
                onClick={() => setProfileTab("main")}
                className={`profile-tab px-3 py-2 text-left font-display text-[9px] uppercase tracking-[0.14em] ${profileTab === "main" ? "border-b-2 border-[#6fffe9] text-[#6fffe9]" : "text-[#718183]"}`}
              >
                {cyberCallProfilePanelCopy.mainTab}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={profileTab === "settings"}
                onClick={() => setProfileTab("settings")}
                className={`profile-tab px-3 py-2 text-left font-display text-[9px] uppercase tracking-[0.14em] ${profileTab === "settings" ? "border-b-2 border-[#ffb547] text-[#ffb547]" : "text-[#718183]"}`}
              >
                {cyberCallProfilePanelCopy.settingsTab}
              </button>
            </div>
            {profileTab === "main" ? (
              <>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="border border-[#26363a] bg-[#101c20] p-3">
                    <p className="font-display text-[8px] uppercase tracking-[0.14em] text-[#718183]">
                      Sessão
                    </p>
                    <p className="mt-1 text-xs text-[#6fffe9]">
                      {cyberCallProfilePanelCopy.session}
                    </p>
                  </div>
                  <div className="border border-[#26363a] bg-[#101c20] p-3">
                    <p className="font-display text-[8px] uppercase tracking-[0.14em] text-[#718183]">
                      Presença
                    </p>
                    <p className="mt-1 text-xs text-[#6fffe9]">
                      {getPresenceLabel(profilePresence)}
                    </p>
                  </div>
                </div>
                <p className="mt-4 border-l border-[#6fffe9] pl-3 text-xs leading-5 text-[#8c9c9e]">
                  Seu perfil concentra identidade, permissões e futuras
                  preferências de comunidade.
                </p>
                <div className="mt-4 border border-[#26363a] bg-[#101c20] p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[8px] uppercase tracking-[0.14em] text-[#718183]">
                      Conexões
                    </span>
                    <span className="font-display text-[8px] uppercase tracking-[0.12em] text-[#6fffe9]">
                      1 ativa
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[#f3f7f5]">
                    CyberCall Identity Gateway
                  </p>
                </div>
              </>
            ) : (
              <div className="mt-4 space-y-3" role="tabpanel">
                <div className="border border-[#26363a] bg-[#101c20] p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[8px] uppercase tracking-[0.14em] text-[#718183]">
                      Identidade pública
                    </span>
                    <button
                      type="button"
                      onClick={() => setProfileEditing(editing => !editing)}
                      className="font-display text-[8px] uppercase tracking-[0.12em] text-[#6fffe9] hover:text-[#f3f7f5]"
                    >
                      {profileEditing ? "Cancelar" : "Editar"}
                    </button>
                  </div>
                  {profileEditing ? (
                    <div className="mt-3 flex gap-2">
                      <input
                        value={profileDisplayName}
                        onChange={event =>
                          setProfileDisplayName(event.target.value)
                        }
                        aria-label="Nome público"
                        className="min-w-0 flex-1 border border-[#6fffe9]/50 bg-[#0b1115] px-2 py-2 text-xs text-[#f3f7f5] outline-none focus:border-[#6fffe9]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setProfileEditing(false);
                          toast.success("Preferência salva localmente.");
                        }}
                        className="border border-[#6fffe9] px-2 font-display text-[8px] uppercase tracking-[0.1em] text-[#6fffe9]"
                      >
                        Salvar
                      </button>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-[#f3f7f5]">
                      {profileDisplayName || "Piloto CyberCall"}
                    </p>
                  )}
                </div>
                <div className="border border-[#26363a] bg-[#101c20] p-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={profileDisplayName || user?.name}
                      imageUrl={profileAvatarUrl}
                      presence={profilePresence}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[8px] uppercase tracking-[0.14em] text-[#718183]">
                        Avatar de transmissão
                      </p>
                      <p className="mt-1 text-[11px] text-[#f3f7f5]">
                        Pré-visualização local
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <label
                      htmlFor="profile-avatar"
                      className="flex min-h-10 flex-1 cursor-pointer items-center justify-center border border-[#6fffe9]/50 px-2 font-display text-[8px] uppercase tracking-[0.1em] text-[#6fffe9] transition hover:bg-[#6fffe9] hover:text-[#080b10]"
                    >
                      Recortar avatar
                    </label>
                    <input
                      id="profile-avatar"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={event => {
                        const file = event.target.files?.[0];
                        event.currentTarget.value = "";
                        if (file) openAvatarEditor(file);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (profileAvatarUrl?.startsWith("blob:"))
                          URL.revokeObjectURL(profileAvatarUrl);
                        setProfileAvatarUrl(null);
                      }}
                      className="min-h-10 border border-[#26363a] px-2 font-display text-[8px] uppercase tracking-[0.1em] text-[#718183] transition hover:border-[#ffb547] hover:text-[#ffb547]"
                      disabled={!profileAvatarUrl}
                    >
                      Remover
                    </button>
                  </div>
                </div>
                <div className="border border-[#26363a] bg-[#101c20] p-3">
                  <label
                    htmlFor="profile-presence"
                    className="font-display text-[8px] uppercase tracking-[0.14em] text-[#718183]"
                  >
                    Status de presença
                  </label>
                  <select
                    id="profile-presence"
                    value={profilePresence}
                    onChange={event => {
                      const nextPresence = event.target.value as PresenceStatus;
                      setProfilePresence(nextPresence);
                      window.localStorage.setItem(
                        "cybercall-presence",
                        nextPresence
                      );
                      realtimeClientRef.current?.setPresence(nextPresence);
                      toast.success("Presença sincronizada em tempo real.");
                    }}
                    className="mt-3 min-h-10 w-full border border-[#26363a] bg-[#0b1115] px-3 text-xs text-[#f3f7f5] outline-none focus:border-[#6fffe9]"
                  >
                    <option value="online">
                      Online — Disponível para sinais
                    </option>
                    <option value="away">Ausente — Retorno em breve</option>
                    <option value="busy">Ocupado — Não interromper</option>
                    <option value="invisible">
                      Invisível — Aparecer offline
                    </option>
                  </select>
                  <p className="mt-2 text-[10px] leading-4 text-[#718183]">
                    Este status é transmitido em tempo real para as comunidades
                    autorizadas; a persistência completa do perfil virá no
                    próximo ciclo.
                  </p>
                </div>
                <div className="border border-[#26363a] bg-[#101c20] p-3">
                  <p className="font-display text-[8px] uppercase tracking-[0.14em] text-[#718183]">
                    Preferências locais / demonstração
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-[#b8c4c4]">
                    <span>Notificações nativas</span>
                    <span className="text-[#6fffe9]">Ativas</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-[#b8c4c4]">
                    <span>Movimento reduzido</span>
                    <span className="text-[#ffb547]">Respeitado</span>
                  </div>
                </div>
                <div className="border border-[#26363a] bg-[#101c20] p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[8px] uppercase tracking-[0.14em] text-[#718183]">
                      Segurança
                    </span>
                    <Shield size={13} className="text-[#6fffe9]" />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#8c9c9e]">
                    OAuth protegido, sem senha local armazenada.
                  </p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => logout()}
              className="mt-4 flex w-full items-center justify-center gap-2 border border-[#ffb547]/40 px-3 py-2 font-display text-[9px] uppercase tracking-[0.14em] text-[#ffb547] transition hover:bg-[#ffb547] hover:text-[#080b10]"
            >
              <LogOut size={14} /> Encerrar sessão
            </button>
          </div>
        </section>
      )}
      {avatarEditorSource && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#05070a]/90 p-4 backdrop-blur-sm"
          role="presentation"
        >
          <section
            ref={avatarEditorRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="avatar-editor-title"
            className="w-full max-w-md border border-[#6fffe9]/50 bg-[#0b1115] p-4 shadow-[0_0_42px_rgba(111,255,233,.18)]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-[9px] uppercase tracking-[0.18em] text-[#ffb547]">
                  Profile lab // crop
                </p>
                <h2
                  id="avatar-editor-title"
                  className="mt-1 font-display text-sm uppercase tracking-[0.1em] text-[#f3f7f5]"
                >
                  Ajustar avatar
                </h2>
              </div>
              <button
                type="button"
                onClick={resetAvatarEditor}
                className="grid min-h-10 min-w-10 place-items-center border border-[#26363a] text-[#718183] transition hover:border-[#ffb547] hover:text-[#ffb547]"
                aria-label="Cancelar edição do avatar"
              >
                <X size={16} />
              </button>
            </div>
            <div
              className="relative mx-auto mt-4 aspect-square w-full max-w-[280px] cursor-grab touch-none overflow-hidden border border-[#6fffe9]/60 bg-[#05070a] active:cursor-grabbing"
              onPointerDown={handleAvatarPointerDown}
              onPointerMove={handleAvatarPointerMove}
              onPointerUp={handleAvatarPointerUp}
              onPointerCancel={handleAvatarPointerUp}
              aria-label="Área de recorte do avatar"
            >
              <img
                src={avatarEditorSource}
                alt="Pré-visualização do avatar"
                className="absolute left-1/2 top-1/2 h-full w-full max-w-none select-none object-cover"
                draggable={false}
                style={{
                  transform: `translate(calc(-50% + ${avatarEditorOffset.x}px), calc(-50% + ${avatarEditorOffset.y}px)) scale(${avatarEditorZoom})`,
                }}
              />
              <span
                className="pointer-events-none absolute inset-4 border-2 border-[#ffb547]/80 shadow-[0_0_0_999px_rgba(5,7,10,.48)]"
                aria-hidden="true"
              />
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="avatar-zoom"
                  className="font-display text-[9px] uppercase tracking-[0.14em] text-[#718183]"
                >
                  Zoom
                </label>
                <span className="font-display text-[9px] text-[#6fffe9]">
                  {avatarEditorZoom.toFixed(1)}×
                </span>
              </div>
              <input
                id="avatar-zoom"
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={avatarEditorZoom}
                onChange={event =>
                  setAvatarEditorZoom(Number(event.target.value))
                }
                className="mt-2 w-full accent-[#6fffe9]"
                aria-label="Ajustar zoom do avatar"
              />
            </div>
            <p className="mt-3 text-[10px] leading-4 text-[#718183]">
              Arraste a imagem dentro da moldura e confirme quando o
              enquadramento estiver pronto.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={resetAvatarEditor}
                className="min-h-10 flex-1 border border-[#26363a] px-3 font-display text-[9px] uppercase tracking-[0.12em] text-[#718183] transition hover:border-[#f3f7f5] hover:text-[#f3f7f5]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={applyAvatarCrop}
                className="min-h-10 flex-1 bg-[#6fffe9] px-3 font-display text-[9px] font-bold uppercase tracking-[0.12em] text-[#080b10] transition hover:bg-[#f3f7f5]"
              >
                <Crop size={14} className="mr-2 inline" />
                Aplicar recorte
              </button>
            </div>
          </section>
        </div>
      )}
      {dataIssue && (
        <div
          role="alert"
          className="border-b border-[#ffb547]/40 bg-[#211a0f] px-4 py-2 font-display text-[10px] uppercase tracking-[0.14em] text-[#ffb547]"
        >
          Sinal instável: não foi possível atualizar todos os dados. Tente
          novamente em instantes.
        </div>
      )}
      {dataLoading && (
        <div className="border-b border-[#26363a] bg-[#0b1115] px-4 py-2 font-display text-[10px] uppercase tracking-[0.14em] text-[#6fffe9]">
          Sincronizando comunidade...
        </div>
      )}
      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className="flex w-[70px] shrink-0 flex-col items-center gap-3 border-r border-[#26363a] bg-[linear-gradient(180deg,#080b10,#0a1216)] py-4">
          <button
            onClick={handleCreateCommunity}
            className="grid h-11 w-11 place-items-center border border-dashed border-[#6fffe9]/60 text-[#6fffe9] transition hover:bg-[#6fffe9] hover:text-[#080b10]"
            title="Criar comunidade"
          >
            <Plus size={19} />
          </button>
          <div className="h-px w-8 bg-[#26363a]" />
          {filteredCommunities.slice(0, 8).map(community => (
            <button
              key={community.id}
              onClick={() => setSelectedCommunityId(community.id)}
              className={`grid h-11 w-11 place-items-center font-display text-xs font-bold transition ${selectedCommunityId === community.id ? "bg-[#6fffe9] text-[#080b10]" : "border border-[#26363a] bg-[#111a1f] text-[#6fffe9] hover:border-[#6fffe9]"}`}
              title={community.name}
            >
              {community.name.slice(0, 2).toUpperCase()}
            </button>
          ))}
          <button
            onClick={handleCreateCommunity}
            className="mt-auto grid h-11 w-11 place-items-center border border-[#26363a] text-[#718183] transition hover:border-[#ffb547] hover:text-[#ffb547]"
            title="Adicionar comunidade"
          >
            <MessageSquarePlus size={17} />
          </button>
        </aside>
        <aside
          ref={mobileNavRef}
          tabIndex={-1}
          aria-label="Navegação de comunidades e canais"
          className={`${mobileNavOpen ? "flex" : "hidden"} fixed inset-x-0 bottom-0 left-0 top-16 z-40 w-[min(300px,85vw)] shrink-0 flex-col border-r border-[#26363a] bg-[linear-gradient(180deg,#0b1115,#0d171b)] shadow-2xl md:static md:flex md:w-[236px] md:shadow-none`}
        >
          <div className="border-b border-[#26363a] px-4 py-4">
            <div className="flex items-start justify-between gap-2">
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() =>
                  selectedCommunityId &&
                  toast.info("Configurações de comunidade em breve.")
                }
              >
                <span className="block truncate font-display text-xs uppercase tracking-[0.14em] text-[#f3f7f5]">
                  {selectedCommunity?.name || "Radar de comunidades"}
                </span>
                <span className="mt-1 block font-display text-[9px] uppercase tracking-[0.16em] text-[#718183]">
                  {selectedCommunity
                    ? "Comunidade ativa"
                    : "Descubra seu próximo time"}
                </span>
              </button>
              <ChevronDown size={15} className="mt-1 shrink-0 text-[#718183]" />
            </div>
            <div className="mt-3 flex items-center gap-2 border border-[#26363a] bg-[#080b10] px-2 py-1.5">
              <Search size={13} className="shrink-0 text-[#718183]" />
              <input
                value={communitySearch}
                onChange={event => setCommunitySearch(event.target.value)}
                placeholder="Buscar comunidade"
                aria-label="Buscar comunidade"
                className="min-w-0 flex-1 bg-transparent font-display text-[10px] text-[#f3f7f5] outline-none placeholder:text-[#526366]"
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() =>
                  toast.info(
                    "Convide pilotos compartilhando o link da comunidade."
                  )
                }
                className="flex min-h-9 flex-1 items-center justify-center gap-2 border border-[#26363a] font-display text-[9px] uppercase tracking-[0.12em] text-[#6fffe9] transition hover:border-[#6fffe9]"
                aria-label="Convidar pilotos"
              >
                <UserPlus size={13} /> Convidar
              </button>
              <button
                onClick={() =>
                  toast.info(
                    "Eventos da comunidade estarão disponíveis no próximo pulso."
                  )
                }
                className="grid min-h-9 w-10 place-items-center border border-[#26363a] text-[#ffb547] transition hover:border-[#ffb547]"
                aria-label="Abrir eventos"
              >
                <CalendarDays size={14} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <div className="mb-5">
              <button
                type="button"
                onClick={() =>
                  setChannelGroupsOpen(current => ({
                    ...current,
                    info: !current.info,
                  }))
                }
                className="mb-2 flex w-full items-center justify-between px-2 font-display text-[9px] uppercase tracking-[0.18em] text-[#718183]"
                aria-expanded={channelGroupsOpen.info}
              >
                <span>Informações</span>
                <ChevronDown
                  size={13}
                  className={channelGroupsOpen.info ? "rotate-0" : "-rotate-90"}
                />
              </button>
              {channelGroupsOpen.info && (
                <div className="space-y-1">
                  {[
                    { name: "boas-vindas", badge: 1 },
                    { name: "anúncios", badge: 0 },
                    { name: "recursos", badge: 0 },
                  ].map(channel => (
                    <button
                      key={channel.name}
                      onClick={() =>
                        toast.info(
                          `Canal ${channel.name} pronto para o próximo pulso.`
                        )
                      }
                      className="flex min-h-9 w-full items-center gap-2 px-2 text-left font-display text-xs text-[#8c9c9e] transition hover:bg-[#111a1f] hover:text-[#f3f7f5]"
                    >
                      <Hash size={14} />
                      {channel.name}
                      {channel.badge > 0 && (
                        <span className="ml-auto min-w-4 rounded-full bg-[#ff435d] px-1 text-center font-display text-[8px] text-white">
                          {channel.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mb-5">
              <button
                type="button"
                onClick={() =>
                  setChannelGroupsOpen(current => ({
                    ...current,
                    text: !current.text,
                  }))
                }
                className="mb-2 flex w-full items-center justify-between px-2 font-display text-[9px] uppercase tracking-[0.18em] text-[#718183]"
                aria-expanded={channelGroupsOpen.text}
              >
                <span>Canais de texto</span>
                <div className="flex items-center gap-2">
                  <Plus size={13} />
                  <ChevronDown
                    size={13}
                    className={
                      channelGroupsOpen.text ? "rotate-0" : "-rotate-90"
                    }
                  />
                </div>
              </button>
              {channelGroupsOpen.text && (
                <div>
                  {channels
                    .filter(channel => channel.channelType !== "voice")
                    .map((channel, index) => (
                      <button
                        key={`${channel.name}-${index}`}
                        onClick={() => {
                          setSelectedChannelId(channel.id ?? 0);
                          setMobileNavOpen(false);
                        }}
                        className={`mb-1 flex min-h-9 w-full items-center gap-2 px-2 py-2 text-left font-display text-xs transition ${selectedChannelId === channel.id ? "bg-[#14252a] text-[#6fffe9]" : "text-[#8c9c9e] hover:bg-[#111a1f] hover:text-[#f3f7f5]"}`}
                      >
                        <Hash size={14} />
                        {channel.name}
                        {index === 0 && (
                          <span className="ml-auto min-w-4 rounded-full bg-[#ff435d] px-1 text-center font-display text-[8px] text-white">
                            4
                          </span>
                        )}
                      </button>
                    ))}
                </div>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() =>
                  setChannelGroupsOpen(current => ({
                    ...current,
                    voice: !current.voice,
                  }))
                }
                className="mb-2 flex w-full items-center justify-between px-2 font-display text-[9px] uppercase tracking-[0.18em] text-[#718183]"
                aria-expanded={channelGroupsOpen.voice}
              >
                <span>Canais de voz</span>
                <div className="flex items-center gap-2">
                  <Plus size={13} />
                  <ChevronDown
                    size={13}
                    className={
                      channelGroupsOpen.voice ? "rotate-0" : "-rotate-90"
                    }
                  />
                </div>
              </button>
              {channelGroupsOpen.voice && (
                <div>
                  {channels
                    .filter(channel => channel.channelType === "voice")
                    .map((channel, index) => (
                      <button
                        key={`${channel.name}-${index}`}
                        onClick={event => {
                          openVoiceRoom(event, channel.name, channel.id);
                          setMobileNavOpen(false);
                        }}
                        className="mb-1 flex min-h-9 w-full items-center gap-2 px-2 py-2 text-left font-display text-xs text-[#8c9c9e] transition hover:bg-[#111a1f] hover:text-[#f3f7f5]"
                      >
                        <Volume2 size={14} />
                        {channel.name}
                        <span className="ml-auto font-display text-[9px] text-[#ffb547]">
                          {index === 0 ? "LIVE" : "BETA"}
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-[#26363a] p-3">
            <Avatar
              name={user?.name || "G"}
              imageUrl={profileAvatarUrl}
              presence={profilePresence}
            />
            <div className="min-w-0 flex-1">
              <span className="block truncate font-display text-[10px] text-[#f3f7f5]">
                {user?.name || "Visitante"}
              </span>
              <span className="block font-display text-[9px] uppercase tracking-[0.12em] text-[#6fffe9]">
                {isAuthenticated
                  ? getPresenceLabel(profilePresence)
                  : "Modo visitante"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setProfileTab("settings");
                setProfileOpen(true);
              }}
              className="grid min-h-10 min-w-10 place-items-center text-[#718183] transition hover:text-[#6fffe9]"
              aria-label="Abrir configurações do perfil"
            >
              <Settings size={14} />
            </button>
          </div>
        </aside>
        <section className="flex min-w-0 flex-1 flex-col bg-[#0e171c]">
          <div className="flex h-14 items-center gap-3 border-b border-[#26363a] px-4 sm:gap-4 sm:px-6">
            <button
              ref={mobileNavTriggerRef}
              type="button"
              onClick={event =>
                mobileNavOpen
                  ? closeMobileNavState(setMobileNavOpen, mobileNavTriggerRef)
                  : openMobileNavState(
                      setMobileNavOpen,
                      mobileNavTriggerRef,
                      event.currentTarget,
                      mobileNavRef
                    )
              }
              className="grid min-h-10 min-w-10 place-items-center border border-[#26363a] text-[#6fffe9] md:hidden"
              aria-label="Abrir navegação de comunidades"
              aria-expanded={mobileNavOpen}
            >
              <Menu size={17} />
            </button>
            <div className="flex items-center gap-2 font-display text-sm text-[#f3f7f5]">
              <Hash size={17} className="text-[#6fffe9]" />
              {channels.find(channel => channel.id === selectedChannelId)
                ?.name || "general"}
            </div>
            <span className="h-4 w-px bg-[#26363a]" />
            <p className="hidden text-xs text-[#718183] sm:block">
              Conversa aberta para pilotos, criadores e quem chegou antes do
              sinal.
            </p>
            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setGlobalSearchOpen(true);
                  window.requestAnimationFrame(() =>
                    globalSearchInputRef.current?.focus()
                  );
                }}
                className="flex items-center gap-2 text-[#718183] transition hover:text-[#6fffe9]"
                aria-label="Abrir busca global"
              >
                <Search size={17} />
                <kbd className="hidden border border-[#26363a] px-1.5 py-0.5 font-display text-[8px] text-[#526366] sm:inline">
                  ⌘K
                </kbd>
              </button>
              <div className="hidden items-center gap-2 border-l border-[#26363a] pl-3 sm:flex">
                <Users size={15} className="text-[#6fffe9]" />
                <span className="font-display text-[10px] text-[#a8b6b7]">
                  {members.length || 0}
                </span>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
            <div className="mx-auto max-w-3xl">
              <div
                className="cypher-hero-shell relative mb-8 overflow-hidden border border-[#26363a] bg-[#0d1519] p-5"
                style={{
                  backgroundImage: `linear-gradient(90deg,rgba(13,21,25,.98) 0%,rgba(13,21,25,.88) 48%,rgba(13,21,25,.38) 100%), url(${heroImage})`,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }}
              >
                <video
                  className="cybercall-video pointer-events-none absolute inset-0 h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster={heroImage}
                  aria-hidden="true"
                >
                  <source src={cyberCallVideo} type="video/mp4" />
                </video>
                <div className="pointer-events-none absolute right-[-8%] top-0 h-full w-1/3 skew-x-[-18deg] border-l border-[#6fffe9]/20 bg-[#6fffe9]/[0.03]" />
                <div className="relative mb-5 flex items-center gap-3 font-display text-[9px] uppercase tracking-[0.2em] text-[#ffb547]">
                  <span className="h-1.5 w-1.5 bg-[#ffb547]" /> Night circuit /
                  live community OS
                </div>
                <div className="cypher-hero-content relative flex items-start gap-4">
                  <span className="grid h-10 w-10 place-items-center bg-[#6fffe9] text-[#080b10]">
                    <Sparkles size={18} />
                  </span>
                  <div>
                    <h1 className="font-display text-xl tracking-[-0.04em] text-[#f3f7f5]">
                      {selectedCommunity?.name ||
                        "A rede está pronta para o primeiro sinal."}
                    </h1>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-[#8c9c9e]">
                      {selectedCommunity?.description ||
                        "Crie sua primeira comunidade, convide seu time e transforme o CyberCall em um espaço de conversa, estratégia e criação."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="border border-[#6fffe9]/30 px-2 py-1 font-display text-[9px] uppercase tracking-[0.14em] text-[#6fffe9]">
                        {selectedCommunity ? "Sinal ativo" : "Modo descoberta"}
                      </span>
                      <span className="border border-[#ffb547]/30 px-2 py-1 font-display text-[9px] uppercase tracking-[0.14em] text-[#ffb547]">
                        {selectedCommunity
                          ? `${members.length} membros`
                          : "Comece agora"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {visibleMessages.map(item => (
                <article key={item.id} className="group mb-6 flex gap-3">
                  <Avatar name={item.authorName} />
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-3">
                      <strong className="font-display text-xs text-[#6fffe9]">
                        {item.authorName}
                      </strong>
                      <time className="font-display text-[9px] uppercase tracking-[0.12em] text-[#526366]">
                        {new Date(item.createdAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                    {editingMessageId === item.id ? (
                      <form
                        onSubmit={handleEditSubmit}
                        className="mt-2 flex gap-2"
                      >
                        <input
                          autoFocus
                          value={editingBody}
                          onChange={event => setEditingBody(event.target.value)}
                          className="min-w-0 flex-1 border border-[#6fffe9] bg-[#111a1f] px-3 py-2 text-sm text-[#f3f7f5] outline-none"
                        />
                        <button
                          type="submit"
                          className="font-display text-[9px] uppercase tracking-[0.12em] text-[#6fffe9]"
                          disabled={updateMessage.isPending}
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMessageId(null);
                            setEditingBody("");
                          }}
                          className="font-display text-[9px] uppercase tracking-[0.12em] text-[#718183]"
                        >
                          Cancelar
                        </button>
                      </form>
                    ) : (
                      <>
                        <p className="mt-1 text-sm leading-6 text-[#b8c4c4]">
                          {item.body}
                        </p>
                        {"attachmentUrl" in item && item.attachmentUrl && (
                          <div className="mt-3 max-w-sm border border-[#26363a] bg-[#111a1f] p-2">
                            {item.attachmentMimeType?.startsWith("image/") ? (
                              <img
                                src={item.attachmentUrl}
                                alt={item.attachmentName || "Imagem anexada"}
                                className="max-h-72 w-full object-contain"
                                loading="lazy"
                              />
                            ) : (
                              <a
                                href={item.attachmentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-3 p-2 text-[#6fffe9] hover:bg-[#14252a]"
                              >
                                <FileText size={18} />
                                <span className="min-w-0 flex-1 truncate text-xs">
                                  {item.attachmentName || "Abrir anexo"}
                                </span>
                                <span className="font-display text-[9px] uppercase tracking-[0.12em] text-[#718183]">
                                  Abrir
                                </span>
                              </a>
                            )}
                          </div>
                        )}
                        {"editedAt" in item && item.editedAt && (
                          <span className="mt-1 block font-display text-[9px] uppercase tracking-[0.12em] text-[#ffb547]">
                            editado
                          </span>
                        )}
                      </>
                    )}
                    {typeof item.id === "number" && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() =>
                            isAuthenticated
                              ? toggleReaction.mutate({
                                  messageId: Number(item.id),
                                  emoji: "⚡",
                                })
                              : startLogin()
                          }
                          className={`border px-2 py-1 font-display text-[9px] uppercase tracking-[0.12em] transition ${"reactedByMe" in item && item.reactedByMe ? "border-[#ffb547] text-[#ffb547]" : "border-[#26363a] text-[#718183] hover:border-[#ffb547] hover:text-[#ffb547]"}`}
                          aria-label="Reagir com energia"
                        >
                          ⚡ energia{" "}
                          {"reactionCount" in item && item.reactionCount
                            ? `· ${item.reactionCount}`
                            : ""}
                        </button>
                        {"authorId" in item && item.authorId === user?.id && (
                          <>
                            <button
                              onClick={() => {
                                setEditingMessageId(Number(item.id));
                                setEditingBody(item.body);
                              }}
                              className="font-display text-[9px] uppercase tracking-[0.12em] text-[#718183] hover:text-[#6fffe9]"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() =>
                                window.confirm(
                                  "Excluir esta mensagem? Esta ação não pode ser desfeita."
                                ) &&
                                deleteMessage.mutate({
                                  messageId: Number(item.id),
                                })
                              }
                              className="font-display text-[9px] uppercase tracking-[0.12em] text-[#718183] hover:text-[#ffb547]"
                            >
                              Excluir
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))}
              {!selectedCommunity && (
                <div className="mt-8 border-l border-[#ffb547] bg-[#141b1e] p-4">
                  <p className="font-display text-[10px] uppercase tracking-[0.15em] text-[#ffb547]">
                    Primeiro movimento
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#8c9c9e]">
                    Entre para salvar mensagens e criar sua comunidade. A
                    interface permanece navegável em modo visitante.
                  </p>
                </div>
              )}
            </div>
          </div>
          {selectedFile && (
            <div className="mx-auto mb-3 flex max-w-3xl items-center gap-3 border border-[#26363a] bg-[#111a1f] p-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden border border-[#26363a] bg-[#0b1115]">
                {selectedFilePreview ? (
                  <img
                    src={selectedFilePreview}
                    alt={`Pré-visualização de ${selectedFile.name}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-[#6fffe9]">
                    <FileText size={20} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-[#f3f7f5]">
                  {selectedFile.name}
                </p>
                <p className="mt-1 font-display text-[9px] uppercase tracking-[0.12em] text-[#718183]">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · pronto
                  para transmitir
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-[#718183] hover:text-[#ffb547]"
                aria-label="Remover anexo"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {moderationStatus !== "idle" && (
            <div
              role="status"
              className={`mx-auto mb-3 max-w-3xl border px-3 py-2 font-display text-[9px] uppercase tracking-[0.12em] ${moderationStatus === "analyzing" ? "border-[#6fffe9]/40 text-[#6fffe9]" : "border-[#ffb547]/50 bg-[#211a0f] text-[#ffb547]"}`}
            >
              {moderationStatus === "analyzing"
                ? "Analisando anexo antes de transmitir..."
                : `Anexo bloqueado: ${moderationMessage}`}
            </div>
          )}
          <form
            onSubmit={handleSend}
            className="border-t border-[#26363a] bg-[#0b1115] p-4 sm:px-8"
          >
            <div className="mx-auto flex max-w-3xl items-center gap-3 border border-[#26363a] bg-[#111a1f] px-4 py-2 focus-within:border-[#6fffe9]">
              <button
                type="button"
                onClick={handleCreateCommunity}
                className="text-[#6fffe9]"
                aria-label="Criar comunidade"
              >
                <Plus size={18} />
              </button>
              <input
                value={message}
                onChange={event => setMessage(event.target.value)}
                placeholder={
                  isAuthenticated
                    ? "Transmitir mensagem para #general"
                    : "Entre para participar da conversa"
                }
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-[#f3f7f5] outline-none placeholder:text-[#526366]"
              />
              <label
                htmlFor="message-attachment"
                className="cursor-pointer text-[#718183] hover:text-[#6fffe9]"
                aria-label="Adicionar anexo"
              >
                <Paperclip size={17} />
              </label>
              <input
                id="message-attachment"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="sr-only"
                onChange={event => {
                  const file = event.target.files?.[0] || null;
                  if (file && file.size > 10 * 1024 * 1024) {
                    toast.error("O arquivo excede o limite de 10 MB.");
                    event.currentTarget.value = "";
                    return;
                  }
                  setSelectedFile(file);
                }}
              />
              <button
                type="submit"
                className="font-display text-[10px] uppercase tracking-[0.14em] text-[#6fffe9] disabled:opacity-40"
                disabled={sendMessage.isPending || isUploading}
              >
                {isUploading
                  ? "Subindo"
                  : sendMessage.isPending
                    ? "Enviando"
                    : "Enviar"}
              </button>
            </div>
          </form>
        </section>
        <aside
          className={`${voiceChatOpen ? "flex" : "hidden"} voice-chat-panel min-h-[260px] flex-col overflow-hidden border border-[#26363a] bg-[#0b1115] lg:flex`}
          aria-label="Chat textual da chamada"
        >
          <div className="flex items-center justify-between border-b border-[#26363a] px-4 py-4">
            <div>
              <p className="font-display text-[9px] uppercase tracking-[0.18em] text-[#ffb547]">
                Comms // room chat
              </p>
              <h3 className="mt-1 font-display text-xs uppercase tracking-[0.12em] text-[#f3f7f5]">
                Sinal escrito
              </h3>
            </div>
            <span className="font-display text-[8px] uppercase tracking-[0.12em] text-[#6fffe9]">
              {voiceChatMessages.length} sinais
            </span>
          </div>
          {formatVoiceTypingLabel(Object.values(voiceTypingParticipants)) && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 border-b border-[#26363a] bg-[#101d20] px-4 py-2 font-display text-[9px] uppercase tracking-[0.12em] text-[#6fffe9]"
            >
              <span className="flex gap-0.5" aria-hidden="true">
                <i className="h-1 w-1 animate-pulse rounded-full bg-[#6fffe9]" />
                <i className="h-1 w-1 animate-pulse rounded-full bg-[#6fffe9] [animation-delay:120ms]" />
                <i className="h-1 w-1 animate-pulse rounded-full bg-[#6fffe9] [animation-delay:240ms]" />
              </span>
              {formatVoiceTypingLabel(Object.values(voiceTypingParticipants))}
            </div>
          )}
          <div
            ref={voiceChatMessagesRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
            role="log"
            aria-live="polite"
            aria-label="Mensagens da chamada"
          >
            {voiceChatMessages.length ? (
              voiceChatMessages.map(item => (
                <article
                  key={item.id}
                  className="border-l border-[#6fffe9]/60 pl-3"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <strong
                      className={`truncate font-display text-[9px] uppercase tracking-[0.1em] ${item.userId === user?.id ? "text-[#ffb547]" : "text-[#6fffe9]"}`}
                    >
                      {item.userId === user?.id ? "Você" : item.authorName}
                    </strong>
                    <time className="shrink-0 font-display text-[8px] text-[#526366]">
                      {new Date(item.occurredAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                  {editingVoiceChatId === item.id ? (
                    <form
                      onSubmit={submitVoiceChatEdit}
                      className="mt-2 space-y-2"
                    >
                      <input
                        autoFocus
                        value={editingVoiceChatDraft}
                        onChange={event =>
                          setEditingVoiceChatDraft(event.target.value)
                        }
                        maxLength={2000}
                        aria-label={`Editar mensagem de ${item.authorName}`}
                        className="w-full border border-[#6fffe9] bg-[#111a1f] px-2 py-2 text-xs text-[#f3f7f5] outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="font-display text-[8px] uppercase tracking-[0.1em] text-[#6fffe9]"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={cancelVoiceChatEdit}
                          className="font-display text-[8px] uppercase tracking-[0.1em] text-[#718183]"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p className="mt-1 break-words text-xs leading-5 text-[#b8c4c4]">
                        {item.body}
                      </p>
                      {item.editedAt && (
                        <span className="mt-1 block font-display text-[8px] uppercase tracking-[0.1em] text-[#ffb547]">
                          editado
                        </span>
                      )}
                      {item.userId === user?.id && (
                        <div className="mt-2 flex gap-3">
                          <button
                            type="button"
                            onClick={() => startVoiceChatEdit(item)}
                            className="font-display text-[8px] uppercase tracking-[0.1em] text-[#718183] hover:text-[#6fffe9]"
                            aria-label="Editar minha mensagem"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteVoiceChatMessage(item)}
                            className="font-display text-[8px] uppercase tracking-[0.1em] text-[#718183] hover:text-[#ff435d]"
                            aria-label="Excluir minha mensagem"
                          >
                            Excluir
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </article>
              ))
            ) : (
              <div className="grid min-h-[180px] place-items-center text-center">
                <div>
                  <MessageSquarePlus
                    size={22}
                    className="mx-auto text-[#26363a]"
                  />
                  <p className="mt-3 font-display text-[9px] uppercase tracking-[0.14em] text-[#718183]">
                    Nenhuma mensagem ainda
                  </p>
                  <p className="mt-2 text-[11px] leading-4 text-[#526366]">
                    Entre na sala e envie o primeiro sinal escrito.
                  </p>
                </div>
              </div>
            )}
          </div>
          <form
            onSubmit={sendVoiceChatMessage}
            className="border-t border-[#26363a] p-3"
          >
            <div className="flex items-end gap-2 border border-[#26363a] bg-[#111a1f] p-2 focus-within:border-[#6fffe9]">
              <input
                value={voiceChatDraft}
                onChange={event => setVoiceChatDraft(event.target.value)}
                maxLength={2000}
                disabled={!voiceJoined}
                placeholder={
                  voiceJoined
                    ? "Escrever para a sala..."
                    : "Entre na sala para conversar"
                }
                aria-label="Mensagem da chamada"
                className="min-w-0 flex-1 bg-transparent px-1 py-2 text-xs text-[#f3f7f5] outline-none placeholder:text-[#526366]"
              />
              <button
                type="submit"
                disabled={!voiceJoined || !voiceChatDraft.trim()}
                className="border border-[#6fffe9] px-2 py-2 font-display text-[8px] uppercase tracking-[0.1em] text-[#6fffe9] transition hover:bg-[#6fffe9] hover:text-[#080b10] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Enviar mensagem da chamada"
              >
                Enviar
              </button>
            </div>
            <p className="mt-2 text-[9px] text-[#526366]">
              Enter envia · máximo 2.000 caracteres
            </p>
          </form>
        </aside>
        <aside className="hidden w-[220px] shrink-0 border-l border-[#26363a] bg-[#0b1115] xl:block">
          <div className="border-b border-[#26363a] px-4 py-5">
            <p className="font-display text-[9px] uppercase tracking-[0.18em] text-[#718183]">
              Signal / members
            </p>
            <div className="mt-3 flex items-center gap-2 border border-[#26363a] px-2 py-2">
              <Search size={13} className="text-[#718183]" />
              <input
                ref={searchInputRef}
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Buscar mensagens"
                aria-label="Buscar mensagens na conversa"
                className="min-w-0 bg-transparent text-xs text-[#f3f7f5] outline-none placeholder:text-[#526366]"
              />
            </div>
          </div>
          <div className="p-4">
            <div className="mb-4 flex items-center gap-2 font-display text-[9px] uppercase tracking-[0.18em] text-[#6fffe9]">
              <span className="h-1.5 w-1.5 bg-[#6fffe9]" /> Online —{" "}
              {members.filter(
                member =>
                  (realtimePresence[member.userId] ||
                    (member.status === "away"
                      ? "away"
                      : member.status === "offline"
                        ? "invisible"
                        : "online")) === "online"
              ).length || 0}
            </div>
            {members.length ? (
              members.map(member => (
                <button
                  key={member.id}
                  onClick={() => setActiveDmUserId(member.userId)}
                  className="mb-3 flex w-full items-center gap-2 text-left transition hover:opacity-80"
                >
                  <Avatar
                    name={member.name}
                    presence={
                      realtimePresence[member.userId] ||
                      (member.status === "away"
                        ? "away"
                        : member.status === "offline"
                          ? "invisible"
                          : "online")
                    }
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs text-[#f3f7f5]">
                      {member.name || "Piloto"}
                    </p>
                    <p className="font-display text-[9px] uppercase tracking-[0.12em] text-[#718183]">
                      {member.memberRole} · mensagem direta
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="space-y-3 text-xs leading-5 text-[#718183]">
                <p>
                  Os membros aparecem aqui quando uma comunidade estiver ativa.
                </p>
                <p className="flex items-center gap-2 text-[#a8b6b7]">
                  <Shield size={13} className="text-[#ffb547]" /> Moderação
                  nativa no próximo ciclo
                </p>
                <p className="flex items-center gap-2 text-[#a8b6b7]">
                  <Mic size={13} className="text-[#6fffe9]" /> Voz e eventos em
                  beta
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
      {activeVoiceChannel && (
        <div
          ref={voiceRoomRef}
          className="voice-room-overlay fixed inset-0 z-40 flex items-center justify-center bg-[#05070a]/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="voice-room-title"
          tabIndex={-1}
          onKeyDown={() => undefined}
        >
          <div
            className="voice-room-scanlines pointer-events-none absolute inset-0"
            aria-hidden="true"
          />
          <div
            className="voice-room-glitch-corner pointer-events-none absolute right-4 top-4 hidden font-display text-[9px] uppercase tracking-[0.18em] text-[#ffb547] sm:block"
            aria-hidden="true"
          >
            CALL//LINK 07 · SIGNAL LOCKED
          </div>
          <div className="voice-room-frame relative flex max-h-[min(760px,calc(100vh-2rem))] w-full max-w-5xl flex-col overflow-hidden border border-[#26363a] bg-[radial-gradient(circle_at_50%_0%,rgba(111,255,233,.12),transparent_38%),#0b1115] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#26363a] px-4 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center border border-[#ffb547]/60 bg-[#080b10] p-1">
                  <img
                    src={cyberCallLogo}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                </span>
                <div>
                  <p className="font-display text-[9px] uppercase tracking-[0.22em] text-[#ffb547]">
                    {cyberCallVoiceRoomCopy.eyebrow} / {activeVoiceChannel}
                  </p>
                  <h2
                    id="voice-room-title"
                    className="mt-1 font-display text-lg tracking-[-0.03em] text-[#f3f7f5]"
                  >
                    <span
                      className="voice-room-title-glitch"
                      data-text={cyberCallVoiceRoomCopy.title}
                    >
                      {cyberCallVoiceRoomCopy.title}
                    </span>{" "}
                    {cyberCallVoiceRoomCopy.subtitle}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInviteOpen(open => !open)}
                  className="flex items-center gap-2 border border-[#26363a] px-3 py-2 font-display text-[9px] uppercase tracking-[0.12em] text-[#6fffe9] hover:border-[#6fffe9]"
                  aria-label="Convidar participantes"
                  aria-expanded={inviteOpen}
                >
                  <UserPlus size={14} /> Convidar
                </button>
                <button
                  onClick={() => setVoiceChatOpen(open => !open)}
                  className={`flex items-center gap-2 border px-3 py-2 font-display text-[9px] uppercase tracking-[0.12em] lg:hidden ${voiceChatOpen ? "border-[#ffb547] text-[#ffb547]" : "border-[#26363a] text-[#6fffe9]"}`}
                  aria-label="Abrir chat da chamada"
                  aria-expanded={voiceChatOpen}
                >
                  <MessageSquarePlus size={14} /> Chat
                </button>
                <button
                  onClick={closeVoiceRoom}
                  className="border border-[#26363a] p-2 text-[#718183] transition hover:border-[#ffb547] hover:text-[#ffb547]"
                  aria-label="Fechar sala"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            {inviteOpen && (
              <div className="border-b border-[#26363a] bg-[#0e171c] px-4 py-4 sm:px-6">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[9px] uppercase tracking-[0.16em] text-[#6fffe9]">
                      Convite da sala
                    </p>
                    <p className="mt-1 truncate text-xs text-[#8c9c9e]">
                      {typeof window !== "undefined"
                        ? `${window.location.origin}/room/${activeVoiceChannel}`
                        : "Link da sala"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (
                        typeof navigator !== "undefined" &&
                        navigator.clipboard
                      )
                        navigator.clipboard.writeText(
                          `${window.location.origin}/room/${activeVoiceChannel}`
                        );
                      toast.success(
                        "Link copiado para a área de transferência."
                      );
                    }}
                    className="flex items-center gap-2 border border-[#26363a] px-3 py-2 font-display text-[9px] uppercase tracking-[0.12em] text-[#f3f7f5] hover:border-[#6fffe9]"
                    aria-label="Copiar link do convite"
                  >
                    <Copy size={14} /> Copiar link
                  </button>
                </div>
                {members.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {members.slice(0, 8).map(member => (
                      <button
                        key={member.id}
                        onClick={() =>
                          createRoomInvite.mutate({
                            recipientId: member.userId,
                            communityId: selectedCommunityId || 0,
                            roomKey: activeVoiceChannel || "lobby",
                            roomName: activeVoiceChannel || "lobby",
                          })
                        }
                        className="flex items-center gap-2 border border-[#26363a] px-2 py-2 text-left text-xs text-[#b8c4c4] hover:border-[#ffb547]"
                      >
                        <Avatar name={member.name} />
                        <span>{member.name || "Piloto"}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-[#718183]">
                    Nenhum membro disponível para convite direto. Compartilhe o
                    link da sala.
                  </p>
                )}
              </div>
            )}
            <div className="voice-room-content grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_300px_250px]">
              <div
                className="relative min-h-[300px] overflow-hidden border border-[#26363a] bg-[linear-gradient(135deg,#101c20,#080b10)] bg-cover bg-center p-4"
                style={{
                  backgroundImage: `linear-gradient(135deg,rgba(16,28,32,.92),rgba(8,11,16,.82)), url(${heroImage})`,
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(111,255,233,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(111,255,233,.08) 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                  }}
                />
                <div className="relative flex items-center justify-between font-display text-[9px] uppercase tracking-[0.16em] text-[#718183]">
                  <span>
                    {voiceJoined
                      ? cyberCallVoiceRoomCopy.status
                      : cyberCallVoiceRoomCopy.preview}
                  </span>
                  <span className="flex items-center gap-2 text-[#6fffe9]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#6fffe9]" />{" "}
                    {voiceParticipants.length} pilotos
                  </span>
                </div>
                <div className="voice-participant-grid relative mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {voiceParticipants.length ? (
                    voiceParticipants.map((participant, index) => (
                      <button
                        key={String(participant.id)}
                        onClick={() =>
                          toast.info(
                            `${participant.name} está ${index === 0 ? "transmitindo" : "ouvindo"}.`
                          )
                        }
                        className={`relative min-h-[145px] border bg-[#111a1f] p-4 text-left transition hover:-translate-y-1 ${speakingParticipants[participant.userId] ? "border-[#ffb547] shadow-[0_0_28px_rgba(255,181,71,.32)]" : "border-[#26363a]"}`}
                        aria-label={`${participant.name}${speakingParticipants[participant.userId] ? " está falando agora" : " está na sala"}`}
                      >
                        <div
                          className={`absolute inset-2 border border-transparent ${speakingParticipants[participant.userId] ? "animate-pulse border-[#ffb547]/55" : ""}`}
                        />
                        <div className="relative flex h-full flex-col justify-between">
                          <MediaPreview
                            stream={
                              participant.userId === user?.id
                                ? screenSharing
                                  ? screenMediaStream
                                  : localMediaStream
                                : remoteMediaStreams[participant.userId]
                            }
                            muted={participant.userId === user?.id}
                            outputDeviceId={selectedAudioOutputId}
                            label={`Mídia de ${participant.name}`}
                          />
                          <div className="relative flex items-start justify-between">
                            <Avatar
                              name={participant.name}
                              presence={participant.presence}
                              accent={
                                speakingParticipants[participant.userId]
                                  ? "#ffb547"
                                  : "#6fffe9"
                              }
                            />
                            <span
                              className={`h-2 w-2 rounded-full ${speakingParticipants[participant.userId] ? "bg-[#ffb547] shadow-[0_0_12px_#ffb547]" : "bg-[#718183]"}`}
                              aria-label={
                                speakingParticipants[participant.userId]
                                  ? "Falando agora"
                                  : "Silencioso"
                              }
                            />
                            <span
                              className={`flex items-end gap-px ${networkQualityClass(networkQualities[participant.userId]?.level)}`}
                              title={
                                networkQualities[participant.userId]
                                  ? `${networkQualityLabel(networkQualities[participant.userId].level)}${networkQualities[participant.userId].rttMs ? ` · RTT ${Math.round(networkQualities[participant.userId].rttMs ?? 0)} ms` : ""}`
                                  : "Qualidade de conexão indisponível"
                              }
                              aria-label={networkQualityLabel(
                                networkQualities[participant.userId]?.level
                              )}
                            >
                              {[1, 2, 3, 4].map(bar => (
                                <span
                                  key={bar}
                                  className={`w-1 ${networkQualities[participant.userId]?.level === "good" || (networkQualities[participant.userId]?.level === "unstable" && bar < 4) || (networkQualities[participant.userId]?.level === "poor" && bar < 2) ? "bg-current" : "bg-[#26363a]"}`}
                                  style={{ height: `${bar * 3 + 3}px` }}
                                />
                              ))}
                            </span>
                          </div>
                          <div>
                            <p className="truncate font-display text-xs text-[#f3f7f5]">
                              {participant.name}
                            </p>
                            <p className="mt-1 font-display text-[9px] uppercase tracking-[0.12em] text-[#718183]">
                              {participant.role || "piloto"}
                            </p>
                            <p
                              className={`relative mt-3 font-display text-[9px] uppercase tracking-[0.12em] ${speakingParticipants[participant.userId] ? "text-[#ffb547]" : "text-[#526366]"}`}
                            >
                              {speakingParticipants[participant.userId]
                                ? "● falando agora"
                                : voicePeerStates[participant.userId] ===
                                    "connected"
                                  ? "peer conectado"
                                  : "microfone em espera"}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full border border-dashed border-[#26363a] px-6 py-12 text-center">
                      <div className="mx-auto grid h-12 w-12 place-items-center border border-[#26363a] text-[#718183]">
                        <Volume2 size={20} />
                      </div>
                      <p className="mt-4 font-display text-xs uppercase tracking-[0.14em] text-[#f3f7f5]">
                        Nenhum piloto conectado
                      </p>
                      <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#718183]">
                        Entre na sala para abrir o primeiro canal de voz. Os
                        participantes aparecerão aqui quando a conexão real
                        estiver ativa.
                      </p>
                    </div>
                  )}
                </div>
                <div className="relative mt-5 flex flex-wrap items-center justify-center gap-2 border-t border-[#26363a] pt-4">
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        startLogin();
                        return;
                      }
                      if (voiceJoined) leaveVoiceMedia();
                      else void startVoiceMedia();
                    }}
                    className="flex items-center gap-2 bg-[#6fffe9] px-4 py-2 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-[#080b10] transition hover:bg-[#f3f7f5]"
                  >
                    {voiceJoined ? (
                      <PhoneOff size={14} />
                    ) : (
                      <Headphones size={14} />
                    )}
                    {voiceJoined ? "Sair da sala" : "Entrar na sala"}
                  </button>
                  <button
                    onClick={toggleMicrophone}
                    disabled={!voiceJoined}
                    className={`border p-2 transition ${voiceMuted ? "border-[#ffb547] text-[#ffb547]" : "border-[#26363a] text-[#6fffe9] hover:border-[#6fffe9]"} disabled:cursor-not-allowed disabled:opacity-40`}
                    aria-label={
                      voiceMuted ? "Ativar microfone" : "Desativar microfone"
                    }
                  >
                    <Mic size={15} />
                  </button>
                  <button
                    onClick={() => void toggleCamera()}
                    disabled={!voiceJoined}
                    className={`border p-2 transition ${cameraEnabled ? "border-[#6fffe9] text-[#6fffe9]" : "border-[#26363a] text-[#718183] hover:border-[#6fffe9]"} disabled:cursor-not-allowed disabled:opacity-40`}
                    aria-label={
                      cameraEnabled ? "Desativar câmera" : "Ativar câmera"
                    }
                  >
                    <Camera size={15} />
                  </button>
                  <button
                    onClick={() => void toggleScreenShare()}
                    disabled={!voiceJoined}
                    className={`border p-2 transition ${screenSharing ? "border-[#ffb547] text-[#ffb547]" : "border-[#26363a] text-[#718183] hover:border-[#ffb547]"} disabled:cursor-not-allowed disabled:opacity-40`}
                    aria-label={
                      screenSharing
                        ? "Parar compartilhamento de tela"
                        : "Compartilhar tela"
                    }
                  >
                    <MonitorUp size={15} />
                  </button>
                  <div
                    className="flex min-h-10 items-center gap-2 border border-[#26363a] bg-[#0b1115] px-2"
                    role="status"
                    aria-live="polite"
                    aria-label={
                      voiceMuted
                        ? "Microfone mutado"
                        : microphoneMeterSupported
                          ? `Nível do microfone: ${Math.round(microphoneLevel * 100)} por cento`
                          : "Medidor de microfone indisponível"
                    }
                  >
                    <Mic
                      size={13}
                      className={
                        voiceMuted
                          ? "text-[#ffb547]"
                          : microphoneLevel > 0.08
                            ? "text-[#6fffe9]"
                            : "text-[#718183]"
                      }
                    />
                    <div
                      className="flex h-3 w-16 items-end gap-px"
                      aria-hidden="true"
                    >
                      {Array.from({ length: 12 }, (_, index) => (
                        <span
                          key={index}
                          className={`h-full flex-1 transition-colors ${!voiceMuted && microphoneMeterSupported && microphoneLevel > index / 12 ? (index > 9 ? "bg-[#ff435d]" : index > 6 ? "bg-[#ffb547]" : "bg-[#6fffe9]") : "bg-[#26363a]"}`}
                        />
                      ))}
                    </div>
                    <span className="font-display text-[8px] uppercase tracking-[0.1em] text-[#718183]">
                      {voiceMuted
                        ? "muted"
                        : microphoneMeterSupported
                          ? `${Math.round(microphoneLevel * 100)}%`
                          : "n/a"}
                    </span>
                  </div>
                  <button
                    onClick={() => setVoiceSettingsOpen(open => !open)}
                    className={`border p-2 transition ${voiceSettingsOpen ? "border-[#6fffe9] text-[#6fffe9]" : "border-[#26363a] text-[#718183] hover:border-[#6fffe9]"}`}
                    aria-label="Abrir configurações de mídia"
                    aria-expanded={voiceSettingsOpen}
                  >
                    <Settings size={15} />
                  </button>
                  {voiceSettingsOpen && (
                    <div className="absolute bottom-14 right-0 z-10 w-64 border border-[#26363a] bg-[#0b1115] p-4 text-left shadow-xl">
                      <p className="font-display text-[9px] uppercase tracking-[0.16em] text-[#6fffe9]">
                        Configurações de mídia
                      </p>
                      <label className="mt-4 block font-display text-[9px] uppercase tracking-[0.12em] text-[#718183]">
                        Microfone de entrada
                        <select
                          value={selectedAudioInputId}
                          onChange={event =>
                            void changeAudioInput(event.target.value)
                          }
                          className="mt-2 w-full border border-[#26363a] bg-[#111a1f] px-2 py-2 text-xs text-[#f3f7f5]"
                        >
                          <option value="">Padrão do sistema</option>
                          {mediaDevices
                            .filter(device => device.kind === "audioinput")
                            .map(device => (
                              <option
                                key={device.deviceId}
                                value={device.deviceId}
                              >
                                {device.label ||
                                  `Microfone ${device.deviceId.slice(0, 6)}`}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label className="mt-3 block font-display text-[9px] uppercase tracking-[0.12em] text-[#718183]">
                        Câmera de vídeo
                        <select
                          value={selectedVideoInputId}
                          onChange={event =>
                            void changeVideoInput(event.target.value)
                          }
                          className="mt-2 w-full border border-[#26363a] bg-[#111a1f] px-2 py-2 text-xs text-[#f3f7f5]"
                        >
                          <option value="">Câmera padrão</option>
                          {mediaDevices
                            .filter(device => device.kind === "videoinput")
                            .map(device => (
                              <option
                                key={device.deviceId}
                                value={device.deviceId}
                              >
                                {device.label ||
                                  `Câmera ${device.deviceId.slice(0, 6)}`}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label className="mt-3 block font-display text-[9px] uppercase tracking-[0.12em] text-[#718183]">
                        Saída de áudio
                        <select
                          value={selectedAudioOutputId}
                          onChange={event => {
                            const deviceId = event.target.value;
                            setSelectedAudioOutputId(deviceId);
                            window.localStorage.setItem(
                              "cybercall-audio-output",
                              deviceId
                            );
                          }}
                          className="mt-2 w-full border border-[#26363a] bg-[#111a1f] px-2 py-2 text-xs text-[#f3f7f5]"
                        >
                          <option value="">Saída padrão</option>
                          {mediaDevices
                            .filter(device => device.kind === "audiooutput")
                            .map(device => (
                              <option
                                key={device.deviceId}
                                value={device.deviceId}
                              >
                                {device.label ||
                                  `Saída ${device.deviceId.slice(0, 6)}`}
                              </option>
                            ))}
                        </select>
                      </label>
                      <div className="mt-4 border-t border-[#26363a] pt-4">
                        <div className="flex items-center justify-between gap-3">
                          <label
                            htmlFor="microphone-sensitivity"
                            className="font-display text-[9px] uppercase tracking-[0.12em] text-[#718183]"
                          >
                            Sensibilidade do microfone
                          </label>
                          <span className="font-display text-[10px] text-[#6fffe9]">
                            {microphoneSensitivity}%
                          </span>
                        </div>
                        <input
                          id="microphone-sensitivity"
                          type="range"
                          min="50"
                          max="200"
                          step="5"
                          value={microphoneSensitivity}
                          onChange={event =>
                            changeMicrophoneSensitivity(
                              Number(event.target.value)
                            )
                          }
                          className="mt-3 w-full accent-[#6fffe9]"
                          aria-describedby="microphone-sensitivity-help"
                        />
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <p
                            id="microphone-sensitivity-help"
                            className="text-[10px] leading-4 text-[#718183]"
                          >
                            Ajusta apenas a leitura visual do medidor; o áudio
                            enviado não é amplificado.
                          </p>
                          <button
                            type="button"
                            onClick={resetMicrophoneSensitivity}
                            className="shrink-0 font-display text-[9px] uppercase tracking-[0.12em] text-[#ffb547] hover:text-[#f3f7f5]"
                          >
                            Resetar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <p className="relative mt-3 text-center font-display text-[9px] uppercase tracking-[0.14em] text-[#526366]">
                  {voiceJoined
                    ? `WebRTC mesh ativo · ${Object.keys(remoteMediaStreams).length} peer(s) remoto(s)`
                    : "Entre para solicitar microfone e iniciar a sinalização segura"}
                </p>
              </div>
              <aside className="border border-[#26363a] bg-[#0e171c] p-4">
                <p className="font-display text-[9px] uppercase tracking-[0.18em] text-[#718183]">
                  Signal telemetry
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    ["LATÊNCIA", "18 ms"],
                    ["QUALIDADE", "NIGHT / 98%"],
                    [
                      "REDE",
                      voiceParticipants.some(
                        participant =>
                          networkQualities[participant.userId]?.level === "poor"
                      )
                        ? "BAIXA"
                        : voiceParticipants.some(
                              participant =>
                                networkQualities[participant.userId]?.level ===
                                "unstable"
                            )
                          ? "INSTÁVEL"
                          : speechDetectionSupported
                            ? "BOA"
                            : "N/D",
                    ],
                    ["MICROFONE", voiceMuted ? "MUTED" : "LIVE"],
                    ["CÂMERA", cameraEnabled ? "LIVE" : "OFF"],
                    ["TELA", screenSharing ? "SHARING" : "OFF"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between border-b border-[#26363a] pb-2"
                    >
                      <span className="font-display text-[9px] uppercase tracking-[0.12em] text-[#718183]">
                        {label}
                      </span>
                      <span className="font-display text-[10px] text-[#6fffe9]">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 border-l border-[#ffb547] bg-[#211a0f] p-3">
                  <p className="font-display text-[9px] uppercase tracking-[0.14em] text-[#ffb547]">
                    Quem fala
                  </p>
                  <p className="mt-2 text-sm text-[#f3f7f5]">
                    {voiceParticipants.find(
                      participant => speakingParticipants[participant.userId]
                    )?.name || "Nenhum piloto"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#8c9c9e]">
                    O anel âmbar acompanha quem está falando no momento.
                  </p>
                </div>
                {voiceParticipants.length > 0 && (
                  <div className="mt-6 border-t border-[#26363a] pt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-display text-[9px] uppercase tracking-[0.16em] text-[#ffb547]">
                        Moderação
                      </p>
                      <span
                        className={`font-display text-[8px] uppercase tracking-[0.12em] ${canModerateVoice ? "text-[#6fffe9]" : "text-[#718183]"}`}
                      >
                        {canModerateVoice
                          ? "Host autorizado"
                          : "Somente leitura"}
                      </span>
                    </div>
                    {canModerateVoice ? (
                      <div className="space-y-2">
                        {voiceParticipants.map(participant => (
                          <div
                            key={`mod-${String(participant.id)}`}
                            className="border border-[#26363a] bg-[#111a1f] p-2"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar
                                name={participant.name}
                                presence={participant.presence}
                                accent={
                                  participant.muted ? "#ffb547" : "#6fffe9"
                                }
                              />
                              <span className="min-w-0 flex-1 truncate text-[10px] text-[#f3f7f5]">
                                {participant.name}
                              </span>
                              <button
                                onClick={() =>
                                  setModerationMenuId(current =>
                                    current === String(participant.id)
                                      ? null
                                      : String(participant.id)
                                  )
                                }
                                className="border border-[#26363a] px-2 py-1 font-display text-[8px] uppercase tracking-[0.1em] text-[#718183] hover:border-[#6fffe9] hover:text-[#6fffe9]"
                                aria-expanded={
                                  moderationMenuId === String(participant.id)
                                }
                                aria-label={`Abrir ações de moderação para ${participant.name}`}
                              >
                                Ações
                              </button>
                            </div>
                            {moderationMenuId === String(participant.id) && (
                              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#26363a] pt-2">
                                <button
                                  onClick={() =>
                                    setMutedParticipantIds(current =>
                                      current.includes(String(participant.id))
                                        ? current.filter(
                                            id => id !== String(participant.id)
                                          )
                                        : [...current, String(participant.id)]
                                    )
                                  }
                                  className={`flex items-center justify-center gap-1 border px-2 py-2 font-display text-[8px] uppercase tracking-[0.1em] ${participant.muted ? "border-[#ffb547] text-[#ffb547]" : "border-[#26363a] text-[#718183] hover:border-[#6fffe9] hover:text-[#6fffe9]"}`}
                                >
                                  <VolumeX size={12} />
                                  {participant.muted ? "Desmutar" : "Silenciar"}
                                </button>
                                <button
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `Remover ${participant.name} da sala?`
                                      )
                                    ) {
                                      setRemovedParticipantIds(current => [
                                        ...current,
                                        String(participant.id),
                                      ]);
                                      setModerationMenuId(null);
                                      toast.success(
                                        `${participant.name} foi removido da sala.`
                                      );
                                    }
                                  }}
                                  className="flex items-center justify-center gap-1 border border-[#26363a] px-2 py-2 font-display text-[8px] uppercase tracking-[0.1em] text-[#718183] hover:border-[#ffb547] hover:text-[#ffb547]"
                                >
                                  <UserX size={12} />
                                  Remover
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] leading-5 text-[#718183]">
                        Você está no modo participante. Apenas moderadores e
                        administradores podem silenciar ou remover pilotos.
                      </p>
                    )}
                  </div>
                )}
              </aside>
            </div>
          </div>
        </div>
      )}
      <Suspense fallback={null}>
        <CyberCallHelpBot />
      </Suspense>
      {notificationsOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Central de sinais"
          className="fixed right-4 top-20 z-30 w-[min(360px,calc(100vw-2rem))] border border-[#26363a] bg-[#0b1115] p-4 shadow-2xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="font-display text-[10px] uppercase tracking-[0.16em] text-[#6fffe9]">
              Central de sinais
            </p>
            <button
              onClick={() => setNotificationsOpen(false)}
              className="font-display text-[9px] uppercase tracking-[0.12em] text-[#718183]"
            >
              Fechar
            </button>
          </div>
          {notificationPermission !== "granted" && (
            <div
              className="mb-4 border border-[#6fffe9]/30 bg-[#101c20] p-3"
              role="region"
              aria-label="Permissão de notificações"
              aria-live="polite"
            >
              <div className="flex items-center gap-2 font-display text-[9px] uppercase tracking-[0.16em] text-[#6fffe9]">
                <Bell size={13} /> Radar em segundo plano
              </div>
              <p className="mt-2 text-xs leading-5 text-[#8c9c9e]">
                Receba um alerta nativo quando alguém convidar você para uma
                sala, mesmo com esta aba em segundo plano.
              </p>
              {notificationPermission === "denied" ? (
                <p className="mt-2 font-display text-[9px] uppercase tracking-[0.12em] text-[#ffb547]">
                  Permissão bloqueada. Reative nas configurações do navegador.
                </p>
              ) : notificationPermission === "unsupported" ? (
                <p className="mt-2 font-display text-[9px] uppercase tracking-[0.12em] text-[#718183]">
                  Notificações nativas indisponíveis neste navegador.
                </p>
              ) : (
                <button
                  onClick={handleEnableNativeNotifications}
                  className="mt-3 border border-[#6fffe9] px-3 py-2 font-display text-[9px] font-bold uppercase tracking-[0.12em] text-[#6fffe9] hover:bg-[#6fffe9] hover:text-[#080b10]"
                >
                  Ativar alertas nativos
                </button>
              )}
            </div>
          )}
          {pendingRoomInvites.length > 0 && (
            <div
              className="mb-4 border border-[#ffb547]/60 bg-[linear-gradient(135deg,rgba(255,181,71,.12),rgba(17,26,31,.95))] p-3 shadow-[0_0_22px_rgba(255,181,71,.08)]"
              role="region"
              aria-label="Convites de sala pendentes"
              aria-live="assertive"
            >
              <div className="flex items-center gap-2 font-display text-[9px] uppercase tracking-[0.16em] text-[#ffb547]">
                <Radio size={13} /> Convites recebidos{" "}
                <span className="ml-auto">{pendingRoomInviteCount}</span>
              </div>
              {pendingRoomInvites.map(invite => (
                <div
                  key={invite.id}
                  className="mt-3 border-t border-[#ffb547]/20 pt-3"
                >
                  <p className="text-xs text-[#f3f7f5]">
                    {invite.senderName || "Um piloto"} convidou você
                  </p>
                  <p className="mt-1 font-display text-[10px] text-[#6fffe9]">
                    {invite.roomName}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        respondRoomInvite.mutate({
                          inviteId: invite.id,
                          status: "accepted",
                        })
                      }
                      className="flex items-center justify-center gap-1 bg-[#6fffe9] px-2 py-2 font-display text-[9px] font-bold uppercase tracking-[0.12em] text-[#080b10]"
                      disabled={respondRoomInvite.isPending}
                    >
                      <Check size={12} /> Aceitar
                    </button>
                    <button
                      onClick={() =>
                        respondRoomInvite.mutate({
                          inviteId: invite.id,
                          status: "declined",
                        })
                      }
                      className="flex items-center justify-center gap-1 border border-[#26363a] px-2 py-2 font-display text-[9px] uppercase tracking-[0.12em] text-[#718183] hover:border-[#ffb547] hover:text-[#ffb547]"
                      disabled={respondRoomInvite.isPending}
                    >
                      <X size={12} /> Recusar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {notificationsQuery.isLoading ? (
            <p className="text-xs text-[#718183]">Sincronizando alertas...</p>
          ) : notificationsQuery.data?.length ? (
            notificationsQuery.data.map(item => (
              <button
                key={item.id}
                onClick={() =>
                  !item.readAt &&
                  markNotificationRead.mutate({ notificationId: item.id })
                }
                className={`mb-2 block w-full border p-3 text-left ${item.readAt ? "border-[#26363a] opacity-60" : "border-[#6fffe9]/50 bg-[#111a1f]"}`}
              >
                <p className="font-display text-[10px] text-[#f3f7f5]">
                  {item.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#8c9c9e]">
                  {item.body}
                </p>
              </button>
            ))
          ) : (
            <p className="text-xs leading-5 text-[#718183]">
              Nenhum alerta novo. O radar está limpo.
            </p>
          )}
        </div>
      )}
      {activeDmUserId && (
        <div className="fixed inset-0 z-20 flex items-end justify-end bg-[#080b10]/45 p-4 sm:items-center sm:p-8">
          <div className="flex h-[min(620px,calc(100vh-2rem))] w-full max-w-md flex-col border border-[#26363a] bg-[#0b1115] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#26363a] px-4 py-4">
              <div className="flex items-center gap-3">
                <Avatar
                  name={
                    members.find(member => member.userId === activeDmUserId)
                      ?.name
                  }
                />
                <div>
                  <p className="font-display text-xs text-[#f3f7f5]">
                    {members.find(member => member.userId === activeDmUserId)
                      ?.name || "Piloto"}
                  </p>
                  <p className="font-display text-[9px] uppercase tracking-[0.14em] text-[#6fffe9]">
                    Sinal privado
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveDmUserId(null)}
                className="font-display text-[10px] uppercase tracking-[0.14em] text-[#718183] hover:text-[#f3f7f5]"
              >
                Fechar
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {dmMessagesQuery.isLoading ? (
                <p className="font-display text-[10px] uppercase tracking-[0.14em] text-[#6fffe9]">
                  Carregando conversa...
                </p>
              ) : dmMessagesQuery.data?.length ? (
                dmMessagesQuery.data.map(item => (
                  <div key={item.id} className="mb-4">
                    <p className="font-display text-[10px] text-[#6fffe9]">
                      {item.senderName || "Piloto"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#b8c4c4]">
                      {item.body}
                    </p>
                    {item.attachmentUrl && (
                      <div className="mt-2 border border-[#26363a] bg-[#111a1f] p-2">
                        {item.attachmentMimeType?.startsWith("image/") ? (
                          <img
                            src={item.attachmentUrl}
                            alt={item.attachmentName || "Imagem anexada"}
                            className="max-h-56 w-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <a
                            href={item.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 text-xs text-[#6fffe9]"
                          >
                            <FileText size={16} />
                            {item.attachmentName || "Abrir anexo"}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-[#718183]">
                  Ainda não há mensagens. Envie o primeiro sinal privado.
                </p>
              )}
            </div>
            <div className="border-t border-[#26363a] p-3">
              {selectedDmFile && (
                <div className="mb-2 flex items-center gap-2 border border-[#26363a] bg-[#111a1f] p-2">
                  <FileText size={15} className="text-[#6fffe9]" />
                  <span className="min-w-0 flex-1 truncate text-xs">
                    {selectedDmFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedDmFile(null)}
                    aria-label="Remover anexo"
                  >
                    <X size={14} className="text-[#718183]" />
                  </button>
                </div>
              )}
              <form
                onSubmit={async event => {
                  event.preventDefault();
                  if ((!dmDraft.trim() && !selectedDmFile) || !activeDmUserId)
                    return;
                  try {
                    const attachment = selectedDmFile
                      ? await uploadAttachment(selectedDmFile)
                      : undefined;
                    sendDirectMessage.mutate({
                      recipientId: activeDmUserId,
                      body: dmDraft.trim() || "Anexo enviado",
                      attachment,
                    });
                    setSelectedDmFile(null);
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Falha no upload do anexo."
                    );
                  }
                }}
                className="flex gap-2"
              >
                <label
                  htmlFor="dm-attachment"
                  className="cursor-pointer self-center text-[#718183] hover:text-[#6fffe9]"
                  aria-label="Adicionar anexo à mensagem direta"
                >
                  <Paperclip size={16} />
                </label>
                <input
                  id="dm-attachment"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="sr-only"
                  onChange={event =>
                    setSelectedDmFile(event.target.files?.[0] || null)
                  }
                />
                <input
                  value={dmDraft}
                  onChange={event => setDmDraft(event.target.value)}
                  placeholder="Escreva uma mensagem direta"
                  className="min-w-0 flex-1 bg-[#111a1f] px-3 py-3 text-sm text-[#f3f7f5] outline-none placeholder:text-[#526366]"
                />
                <button
                  className="bg-[#6fffe9] px-3 font-display text-[10px] font-bold uppercase tracking-[0.12em] text-[#080b10]"
                  disabled={sendDirectMessage.isPending}
                >
                  {sendDirectMessage.isPending ? "..." : "Enviar"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
