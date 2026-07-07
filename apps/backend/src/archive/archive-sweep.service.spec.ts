import { EventStatus } from "@prisma/client";
import { ArchiveSweepService } from "./archive-sweep.service";

type FakeEvent = {
  id: string;
  status: EventStatus;
  endDate: Date;
  timezone: string;
  archivedAt: Date | null;
};

/**
 * Faux PrismaService en mémoire : suffisant pour tester la logique de
 * transition d'état sans dépendre d'une vraie base ni de Redis, absents de
 * cet environnement de build.
 */
class FakePrisma {
  events: FakeEvent[] = [];
  archiveJobLogs: Array<{ eventId: string; status: string; errorMsg?: string }> = [];

  event = {
    findMany: async ({ where }: { where: { status: EventStatus } }) =>
      this.events.filter((e) => e.status === where.status),
    findUnique: async ({ where }: { where: { id: string } }) =>
      this.events.find((e) => e.id === where.id) ?? null,
    updateMany: async ({
      where,
      data,
    }: {
      where: { id: string; status: EventStatus };
      data: Partial<FakeEvent>;
    }) => {
      const event = this.events.find((e) => e.id === where.id && e.status === where.status);
      if (!event) return { count: 0 };
      Object.assign(event, data);
      return { count: 1 };
    },
  };

  archiveJobLog = {
    create: async ({ data }: { data: { eventId: string; status: string; errorMsg?: string } }) => {
      this.archiveJobLogs.push(data);
      return data;
    },
    findFirst: async ({ where }: { where: { eventId: string; status: string } }) =>
      this.archiveJobLogs.find(
        (l) => l.eventId === where.eventId && l.status === where.status,
      ) ?? null,
  };

  eventMembership = {
    findMany: async () => [] as Array<{ userId: string }>,
  };
}

const fakeNotifications = { sendToUsers: async () => undefined };

// Horloge figée pour des tests déterministes, indépendants du fuseau/moment
// d'exécution de la CI. 2026-07-10T12:00:00Z est un midi UTC "neutre" (pas
// proche d'un changement de jour dans les fuseaux testés).
const FIXED_NOW = new Date("2026-07-10T12:00:00.000Z");

describe("ArchiveSweepService", () => {
  let prisma: FakePrisma;
  let service: ArchiveSweepService;

  beforeEach(() => {
    jest.useFakeTimers({ now: FIXED_NOW });
    prisma = new FakePrisma();
    service = new ArchiveSweepService(prisma as never, fakeNotifications as never);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("verrouille la discussion (ACTIVE -> GRACE_PERIOD) une fois la date de fin passée", async () => {
    // lockAt = minuit Paris du 2026-07-09 = 2026-07-08T22:00:00Z (passé)
    // graceEndsAt = lockAt + 48h = 2026-07-10T22:00:00Z (futur par rapport à FIXED_NOW)
    prisma.events.push({
      id: "evt-1",
      status: EventStatus.ACTIVE,
      endDate: new Date("2026-07-08T10:00:00.000Z"),
      timezone: "Europe/Paris",
      archivedAt: null,
    });

    await service.sweep();

    expect(prisma.events[0].status).toBe(EventStatus.GRACE_PERIOD);
    expect(prisma.archiveJobLogs).toHaveLength(1);
    expect(prisma.archiveJobLogs[0].status).toBe("ACTIVE_TO_GRACE_PERIOD");
  });

  it("termine la fenêtre de grâce après 48h (GRACE_PERIOD -> ARCHIVED)", async () => {
    prisma.events.push({
      id: "evt-2",
      status: EventStatus.GRACE_PERIOD,
      endDate: new Date("2026-06-20T00:00:00.000Z"),
      timezone: "Europe/Paris",
      archivedAt: null,
    });

    await service.sweep();

    expect(prisma.events[0].status).toBe(EventStatus.ARCHIVED);
    expect(prisma.events[0].archivedAt).not.toBeNull();
  });

  it("ne touche pas un événement encore actif dont la date de fin n'est pas passée", async () => {
    prisma.events.push({
      id: "evt-3",
      status: EventStatus.ACTIVE,
      endDate: new Date(FIXED_NOW.getTime() + 5 * 24 * 60 * 60 * 1000),
      timezone: "Europe/Paris",
      archivedAt: null,
    });

    await service.sweep();

    expect(prisma.events[0].status).toBe(EventStatus.ACTIVE);
    expect(prisma.archiveJobLogs).toHaveLength(0);
  });

  it("rattrape un événement après une panne serveur simulée, en cascadant jusqu'à ARCHIVED si les deux délais sont dépassés", async () => {
    // Simule un serveur resté éteint plusieurs semaines : aucun sweep n'a
    // tourné entre-temps, donc le verrouillage ET la fin de fenêtre de
    // grâce sont déjà dépassés. Un seul appel à sweep() doit rattraper les
    // deux transitions.
    prisma.events.push({
      id: "evt-4",
      status: EventStatus.ACTIVE,
      endDate: new Date("2026-05-01T00:00:00.000Z"),
      timezone: "Europe/Paris",
      archivedAt: null,
    });

    await service.sweep();

    expect(prisma.events[0].status).toBe(EventStatus.ARCHIVED);
    expect(prisma.archiveJobLogs.map((l) => l.status)).toEqual([
      "ACTIVE_TO_GRACE_PERIOD",
      "GRACE_PERIOD_TO_ARCHIVED",
    ]);
  });

  it("est idempotent face à une double exécution concurrente du job", async () => {
    prisma.events.push({
      id: "evt-5",
      status: EventStatus.GRACE_PERIOD,
      endDate: new Date("2026-06-20T00:00:00.000Z"),
      timezone: "Europe/Paris",
      archivedAt: null,
    });

    await Promise.all([service.sweep(), service.sweep()]);

    expect(prisma.events[0].status).toBe(EventStatus.ARCHIVED);
    // Une seule des deux exécutions doit avoir effectivement écrit la
    // transition (le compteur updateMany protège contre le doublon).
    expect(prisma.archiveJobLogs).toHaveLength(1);
  });

  it("processEvent est idempotent quand rappelé après une transition déjà faite", async () => {
    prisma.events.push({
      id: "evt-6",
      status: EventStatus.ACTIVE,
      endDate: new Date("2026-07-08T10:00:00.000Z"),
      timezone: "Europe/Paris",
      archivedAt: null,
    });

    await service.processEvent("evt-6");
    await service.processEvent("evt-6"); // rejoué (ex: retry BullMQ)

    expect(prisma.events[0].status).toBe(EventStatus.GRACE_PERIOD);
    expect(prisma.archiveJobLogs).toHaveLength(1);
  });

  it("respecte le fuseau horaire de l'organisateur pour déclencher au bon moment", async () => {
    // endDate = 2026-07-07T00:00:00Z pour les deux événements.
    // - Pacific/Kiritimati (UTC+14) : minuit local est déjà le 07-07 à
    //   14:00 UTC-... -> lockAt (minuit local du lendemain) = 2026-07-07T10:00:00Z.
    // - Etc/GMT+12 (UTC-12) : minuit local du 07-07 correspond à
    //   2026-07-06T12:00:00Z -> lockAt (minuit local du lendemain) = 2026-07-07T12:00:00Z.
    // En figeant l'horloge à 11:00Z ce jour-là, seul le fuseau "en avance"
    // doit avoir déjà déclenché le verrouillage.
    jest.setSystemTime(new Date("2026-07-07T11:00:00.000Z"));

    const endDate = new Date("2026-07-07T00:00:00.000Z");

    prisma.events.push({
      id: "evt-tz-ahead",
      status: EventStatus.ACTIVE,
      endDate,
      timezone: "Pacific/Kiritimati",
      archivedAt: null,
    });
    prisma.events.push({
      id: "evt-tz-behind",
      status: EventStatus.ACTIVE,
      endDate,
      timezone: "Etc/GMT+12",
      archivedAt: null,
    });

    await service.sweep();

    expect(prisma.events.find((e) => e.id === "evt-tz-ahead")?.status).toBe(
      EventStatus.GRACE_PERIOD,
    );
    expect(prisma.events.find((e) => e.id === "evt-tz-behind")?.status).toBe(EventStatus.ACTIVE);
  });
});
