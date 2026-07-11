import { api } from "./client";
import type { EventType, TribuEvent } from "../types/models";

export interface CreateEventInput {
  type: EventType;
  name: string;
  /** Pas de date de début : un événement démarre au moment de sa création côté serveur. */
  endDate: string;
  timezone?: string;
  coverImageUrl?: string;
}

export const eventsApi = {
  list: () => api.get<TribuEvent[]>("/events"),
  get: (id: string) => api.get<TribuEvent>(`/events/${id}`),
  create: (input: CreateEventInput) => api.post<TribuEvent>("/events", input),
  update: (id: string, input: Partial<Pick<CreateEventInput, "name" | "endDate" | "coverImageUrl">>) =>
    api.patch<TribuEvent>(`/events/${id}`, input),
  addMembers: (id: string, phoneNumbers: string[]) =>
    api.post<{ invited: number; notYetRegistered: string[] }>(`/events/${id}/members`, {
      phoneNumbers,
    }),
  joinByInviteCode: (inviteCode: string) =>
    api.post<TribuEvent>(`/events/join/${inviteCode}`),
};
