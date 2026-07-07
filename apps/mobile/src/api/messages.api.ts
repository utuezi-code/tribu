import { api } from "./client";
import type { Message } from "../types/models";

export const messagesApi = {
  list: (eventId: string, cursor?: string) =>
    api.get<Message[]>(`/events/${eventId}/messages${cursor ? `?cursor=${cursor}` : ""}`),

  send: (eventId: string, content?: string, mediaIds?: string[], clientId?: string) =>
    api.post<Message>(`/events/${eventId}/messages`, { content, mediaIds, clientId }),
};
