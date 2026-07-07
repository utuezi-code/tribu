import type { ConnectionOptions } from "bullmq";

/**
 * BullMQ embarque sa propre version d'ioredis en dépendance interne : lui
 * passer une instance construite avec notre propre paquet `ioredis` casse le
 * typage (deux classes `Redis` structurellement différentes). On passe donc
 * un objet d'options simple, que BullMQ utilise pour créer sa propre
 * connexion interne.
 */
export function parseRedisConnection(redisUrl: string): ConnectionOptions {
  const url = new URL(redisUrl);
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 6379,
    username: url.username || undefined,
    password: url.password || undefined,
    tls: url.protocol === "rediss:" ? {} : undefined,
  };
}
