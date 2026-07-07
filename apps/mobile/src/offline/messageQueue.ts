import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { messagesApi } from "../api/messages.api";
import type { Message } from "../types/models";

interface QueuedMessage {
  clientId: string;
  eventId: string;
  content: string;
  createdAt: string;
}

const QUEUE_KEY = "tribu.offlineMessageQueue";

async function readQueue(): Promise<QueuedMessage[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? (JSON.parse(raw) as QueuedMessage[]) : [];
}

async function writeQueue(queue: QueuedMessage[]) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

type Listener = (eventId: string) => void;
const listeners = new Set<Listener>();

/** Prévient les écrans concernés qu'un message en attente a été envoyé (ou a échoué). */
export function onQueueSettled(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Ajoute un message à la file d'attente locale et tente immédiatement un
 * envoi si le réseau est disponible. Retourne un message optimiste à
 * afficher tout de suite dans le fil de discussion.
 */
export async function enqueueMessage(eventId: string, content: string): Promise<Message> {
  const clientId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const queue = await readQueue();
  queue.push({ clientId, eventId, content, createdAt: new Date().toISOString() });
  await writeQueue(queue);

  flushQueue().catch(() => undefined);

  return {
    id: clientId,
    clientId,
    eventId,
    userId: "me",
    content,
    createdAt: new Date().toISOString(),
    user: { id: "me", phoneNumber: "", displayName: "Toi" },
    media: [],
    clientState: "sending",
  };
}

let flushing = false;

/** Tente d'envoyer tous les messages en attente ; à rappeler à la reconnexion réseau. */
export async function flushQueue(): Promise<void> {
  if (flushing) return;
  flushing = true;

  try {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    const queue = await readQueue();
    if (queue.length === 0) return;

    const remaining: QueuedMessage[] = [];

    for (const item of queue) {
      try {
        await messagesApi.send(item.eventId, item.content, undefined, item.clientId);
        listeners.forEach((l) => l(item.eventId));
      } catch {
        remaining.push(item);
      }
    }

    await writeQueue(remaining);
  } finally {
    flushing = false;
  }
}

NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    flushQueue().catch(() => undefined);
  }
});
