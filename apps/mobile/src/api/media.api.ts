import { api } from "./client";
import type { Media, MediaType } from "../types/models";

export const mediaApi = {
  list: (eventId: string, cursor?: string) =>
    api.get<Media[]>(`/events/${eventId}/media${cursor ? `?cursor=${cursor}` : ""}`),

  requestUploadUrl: (eventId: string, extension: string) =>
    api.post<{ uploadUrl: string; storageUrl: string; path: string }>(
      `/events/${eventId}/media/upload-url`,
      { extension },
    ),

  register: (
    eventId: string,
    input: { storageUrl: string; thumbnailUrl?: string; type: MediaType; messageId?: string },
  ) => api.post<Media>(`/events/${eventId}/media`, input),
};
