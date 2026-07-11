/**
 * Serveur factice, sans base de données, pour tester rapidement l'app
 * mobile (UI + parcours complets) sans avoir à configurer Postgres/Supabase.
 * Implémente les mêmes routes que l'API réelle (voir src/*), avec des
 * données en mémoire réinitialisées à chaque redémarrage.
 *
 * N'implémente PAS : persistance réelle, vraie vérification OTP (accepte
 * n'importe quel code à 6 chiffres), vrai stockage média (les photos
 * "uploadées" ne sont jamais réellement enregistrées, un pixel de
 * remplacement est utilisé), authentification JWT réelle (le token retourné
 * est un texte fixe, non vérifié côté serveur).
 *
 * Usage : node mock-server.js  (ou `npm run mock`)
 */
const http = require("http");
const { randomUUID } = require("crypto");

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

const me = { id: "u1", phoneNumber: "+33612345678", displayName: "Léo", avatarUrl: null };
const friends = [
  { id: "u2", phoneNumber: "+33600000002", displayName: "Emma", avatarUrl: null },
  { id: "u3", phoneNumber: "+33600000003", displayName: "Chloé", avatarUrl: null },
  { id: "u4", phoneNumber: "+33600000004", displayName: "Max", avatarUrl: null },
];

function membership(user, role, eventId) {
  return { id: `m-${user.id}-${eventId}`, userId: user.id, eventId, role, user };
}

const events = [
  {
    id: "evt-1",
    name: "Road-trip Portugal",
    type: "VOYAGE",
    coverImageUrl: null,
    startDate: "2026-08-12T00:00:00.000Z",
    endDate: "2026-08-19T00:00:00.000Z",
    timezone: "Europe/Paris",
    status: "ACTIVE",
    archivedAt: null,
    createdBy: "u1",
    inviteCode: "abc123",
    members: [
      membership(me, "ORGANIZER", "evt-1"),
      membership(friends[0], "MEMBER", "evt-1"),
      membership(friends[1], "MEMBER", "evt-1"),
      membership(friends[2], "MEMBER", "evt-1"),
    ],
    _count: { media: 9 },
  },
  {
    id: "evt-2",
    name: "Mariage Chloé & Max",
    type: "MARIAGE",
    coverImageUrl: null,
    startDate: "2026-09-05T00:00:00.000Z",
    endDate: "2026-09-24T00:00:00.000Z",
    timezone: "Europe/Paris",
    status: "ACTIVE",
    archivedAt: null,
    createdBy: "u1",
    inviteCode: "def456",
    members: [membership(me, "MEMBER", "evt-2"), membership(friends[1], "ORGANIZER", "evt-2")],
    _count: { media: 0 },
  },
  {
    id: "evt-3",
    name: "Les 30 ans de Léo",
    type: "ANNIVERSAIRE",
    coverImageUrl: null,
    startDate: "2026-06-14T00:00:00.000Z",
    endDate: "2026-06-14T00:00:00.000Z",
    timezone: "Europe/Paris",
    status: "ARCHIVED",
    archivedAt: "2026-06-17T00:00:00.000Z",
    createdBy: "u1",
    inviteCode: "ghi789",
    members: [
      membership(me, "ORGANIZER", "evt-3"),
      membership(friends[0], "MEMBER", "evt-3"),
      membership(friends[1], "MEMBER", "evt-3"),
    ],
    _count: { media: 6 },
  },
];

const messages = {
  "evt-1": [
    { id: "msg-1", eventId: "evt-1", userId: "u2", content: "On part de Lyon ou de Paris ? 🚗", createdAt: "2026-07-07T09:58:00.000Z", user: friends[0], media: [] },
    { id: "msg-2", eventId: "evt-1", userId: "u1", content: "Lyon !! Et j'ai trouvé ça pour l'airbnb ✨", createdAt: "2026-07-07T09:59:00.000Z", user: me, media: [] },
    { id: "msg-3", eventId: "evt-1", userId: "u1", content: "Trop bien 😍 je fais le doodle pour les dates ?", createdAt: "2026-07-07T14:00:00.000Z", user: me, media: [] },
    { id: "msg-4", eventId: "evt-1", userId: "u2", content: "Oui! vas-y 💜", createdAt: "2026-07-07T14:02:00.000Z", user: friends[0], media: [] },
  ],
};

const media = {
  "evt-1": Array.from({ length: 9 }).map((_, i) => ({
    id: `media-${i}`,
    eventId: "evt-1",
    userId: friends[i % friends.length].id,
    messageId: null,
    storageUrl: PIXEL,
    thumbnailUrl: PIXEL,
    type: i % 5 === 0 ? "VIDEO" : "PHOTO",
    createdAt: new Date(Date.now() - i * 3600 * 1000).toISOString(),
    user: friends[i % friends.length],
  })),
  "evt-3": Array.from({ length: 6 }).map((_, i) => ({
    id: `media-arch-${i}`,
    eventId: "evt-3",
    userId: friends[i % friends.length].id,
    messageId: null,
    storageUrl: PIXEL,
    thumbnailUrl: PIXEL,
    type: "PHOTO",
    createdAt: new Date(Date.now() - (i + 20) * 3600 * 1000).toISOString(),
    user: friends[i % friends.length],
  })),
};

function send(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*",
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});

  const url = req.url.split("?")[0];
  const body = ["POST", "PATCH", "PUT"].includes(req.method) ? await readBody(req) : {};
  console.log(req.method, url);

  if (req.method === "POST" && url === "/auth/otp/request") return send(res, 200, { resendAvailableInSeconds: 30 });
  if (req.method === "POST" && url === "/auth/otp/verify") return send(res, 200, { accessToken: "fake.jwt.token", isNewUser: false });
  if (req.method === "GET" && url === "/auth/me") return send(res, 200, me);

  if (req.method === "GET" && url === "/events") return send(res, 200, events);

  if (req.method === "POST" && url === "/events") {
    const id = `evt-${randomUUID().slice(0, 8)}`;
    const event = {
      id,
      name: body.name ?? "Nouvel événement",
      type: body.type ?? "AUTRE",
      coverImageUrl: body.coverImageUrl ?? null,
      // Pas de date de début côté client : l'événement démarre à sa création.
      startDate: new Date().toISOString(),
      endDate: body.endDate ?? new Date().toISOString(),
      timezone: body.timezone ?? "Europe/Paris",
      status: "ACTIVE",
      archivedAt: null,
      createdBy: "u1",
      inviteCode: randomUUID().slice(0, 6).toUpperCase(),
      members: [membership(me, "ORGANIZER", id)],
      _count: { media: 0 },
    };
    events.unshift(event);
    messages[id] = [];
    media[id] = [];
    return send(res, 200, event);
  }

  const joinMatch = url.match(/^\/events\/join\/([^/]+)$/);
  if (req.method === "POST" && joinMatch) {
    const event = events.find((e) => e.inviteCode === joinMatch[1]);
    if (!event) return send(res, 404, { message: "Lien d'invitation invalide." });
    if (!event.members.some((m) => m.userId === me.id)) {
      event.members.push(membership(me, "MEMBER", event.id));
    }
    return send(res, 200, event);
  }

  const eventMatch = url.match(/^\/events\/([^/]+)$/);
  if (req.method === "GET" && eventMatch) {
    const event = events.find((e) => e.id === eventMatch[1]);
    return event ? send(res, 200, event) : send(res, 404, { message: "not found" });
  }

  const msgMatch = url.match(/^\/events\/([^/]+)\/messages$/);
  if (req.method === "GET" && msgMatch) return send(res, 200, [...(messages[msgMatch[1]] ?? [])].reverse());
  if (req.method === "POST" && msgMatch) {
    const message = {
      id: `msg-${randomUUID().slice(0, 8)}`,
      eventId: msgMatch[1],
      userId: "u1",
      content: body.content ?? null,
      createdAt: new Date().toISOString(),
      user: me,
      media: [],
    };
    (messages[msgMatch[1]] ??= []).push(message);
    return send(res, 200, message);
  }

  const uploadUrlMatch = url.match(/^\/events\/([^/]+)\/media\/upload-url$/);
  if (req.method === "POST" && uploadUrlMatch) {
    return send(res, 200, {
      uploadUrl: `http://${req.headers.host}/mock-upload`,
      storageUrl: PIXEL,
      path: "mock",
    });
  }

  if (req.method === "PUT" && url === "/mock-upload") {
    // Accepte n'importe quel corps et ne le stocke pas réellement.
    return send(res, 200, {});
  }

  const mediaMatch = url.match(/^\/events\/([^/]+)\/media$/);
  if (req.method === "GET" && mediaMatch) return send(res, 200, media[mediaMatch[1]] ?? []);
  if (req.method === "POST" && mediaMatch) {
    const item = {
      id: `media-${randomUUID().slice(0, 8)}`,
      eventId: mediaMatch[1],
      userId: "u1",
      messageId: body.messageId ?? null,
      storageUrl: body.storageUrl ?? PIXEL,
      thumbnailUrl: body.thumbnailUrl ?? body.storageUrl ?? PIXEL,
      type: body.type ?? "PHOTO",
      createdAt: new Date().toISOString(),
      user: me,
    };
    (media[mediaMatch[1]] ??= []).unshift(item);
    const event = events.find((e) => e.id === mediaMatch[1]);
    if (event) event._count.media += 1;
    return send(res, 200, item);
  }

  send(res, 404, { message: "not found" });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Mock Tribu backend (sans base de données) sur http://0.0.0.0:${PORT}`);
  console.log("N'importe quel numéro/code SMS fonctionne pour se connecter.");
});
