export type EventType = "VOYAGE" | "MARIAGE" | "ANNIVERSAIRE" | "SOIREE" | "AUTRE";
export type EventStatus = "ACTIVE" | "GRACE_PERIOD" | "ARCHIVED";
export type MemberRole = "ORGANIZER" | "MEMBER";
export type MediaType = "PHOTO" | "VIDEO";

export interface User {
  id: string;
  phoneNumber: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface EventMembership {
  id: string;
  userId: string;
  eventId: string;
  role: MemberRole;
  user: User;
}

export interface TribuEvent {
  id: string;
  name: string;
  type: EventType;
  coverImageUrl?: string | null;
  startDate: string;
  endDate: string;
  timezone: string;
  status: EventStatus;
  archivedAt?: string | null;
  createdBy: string;
  inviteCode: string;
  members: EventMembership[];
  _count?: { media: number };
}

export interface Media {
  id: string;
  eventId: string;
  userId: string;
  messageId?: string | null;
  storageUrl: string;
  thumbnailUrl?: string | null;
  type: MediaType;
  createdAt: string;
  user: User;
}

export interface Message {
  id: string;
  eventId: string;
  userId: string;
  content?: string | null;
  createdAt: string;
  user: User;
  media: Media[];
  /** État local uniquement (file d'attente hors-ligne), jamais renvoyé par l'API. */
  clientState?: "sending" | "failed" | "sent";
  clientId?: string;
}
