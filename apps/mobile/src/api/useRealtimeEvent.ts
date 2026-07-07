import { useEffect } from "react";
import { supabase } from "./supabase";

/**
 * Écoute les nouveaux messages/médias d'un événement via Supabase Realtime
 * (changements Postgres directs sur les tables `Message`/`Media`). Si
 * Supabase n'est pas configuré (`supabase === null`), ce hook ne fait rien :
 * l'écran reste utilisable via le rafraîchissement au focus/pull-to-refresh.
 */
export function useRealtimeEvent(eventId: string, onChange: () => void) {
  useEffect(() => {
    if (!supabase) return;

    const client = supabase;
    const channel = client
      .channel(`event:${eventId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Message", filter: `eventId=eq.${eventId}` },
        onChange,
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Media", filter: `eventId=eq.${eventId}` },
        onChange,
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);
}
