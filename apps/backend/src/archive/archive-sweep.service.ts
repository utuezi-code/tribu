import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { EventStatus } from "@prisma/client";
import { PrismaService } from "../common/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { computeGraceEndsAt, computeLockAt } from "./archive-time.util";

const SOON_NOTIFICATION_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Source de vérité de la mécanique d'archivage : idempotente et pilotée par
 * l'état réel en base plutôt que par un minuteur en mémoire, afin de survivre
 * à un redémarrage serveur et à des exécutions concurrentes (double job).
 */
@Injectable()
export class ArchiveSweepService implements OnModuleInit {
  private readonly logger = new Logger(ArchiveSweepService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async onModuleInit() {
    this.logger.log("Rattrapage au démarrage : recherche des événements en retard d'archivage.");
    await this.sweep();
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sweep() {
    const now = new Date();

    const activeEvents = await this.prisma.event.findMany({
      where: { status: EventStatus.ACTIVE },
    });

    for (const event of activeEvents) {
      const lockAt = computeLockAt(event.endDate, event.timezone);
      if (lockAt <= now) {
        await this.transition(event.id, EventStatus.ACTIVE, EventStatus.GRACE_PERIOD);
      } else if (lockAt.getTime() - now.getTime() <= SOON_NOTIFICATION_WINDOW_MS) {
        await this.notifySoonOnce(event.id);
      }
    }

    const graceEvents = await this.prisma.event.findMany({
      where: { status: EventStatus.GRACE_PERIOD },
    });

    for (const event of graceEvents) {
      const lockAt = computeLockAt(event.endDate, event.timezone);
      const graceEndsAt = computeGraceEndsAt(lockAt);
      if (graceEndsAt <= now) {
        await this.transition(event.id, EventStatus.GRACE_PERIOD, EventStatus.ARCHIVED, {
          archivedAt: now,
        });
      }
    }
  }

  private async notifySoonOnce(eventId: string) {
    const alreadyNotified = await this.prisma.archiveJobLog.findFirst({
      where: { eventId, status: "SOON_NOTIFIED" },
    });
    if (alreadyNotified) return;

    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    const members = await this.prisma.eventMembership.findMany({ where: { eventId } });

    await this.notifications.sendToUsers(
      members.map((m) => m.userId),
      {
        title: event?.name ?? "Événement",
        body: "Cet événement s'archive bientôt : derniers messages avant que la discussion se fige !",
        data: { eventId },
      },
    );

    await this.prisma.archiveJobLog.create({
      data: { eventId, status: "SOON_NOTIFIED", executedAt: new Date() },
    });
  }

  /**
   * Traite un seul événement (appelé aussi par le worker BullMQ quand Redis
   * est configuré, pour une précision de timing meilleure que le sweep).
   * Toujours idempotent : relit l'état courant avant d'écrire.
   */
  async processEvent(eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return;

    const now = new Date();
    const lockAt = computeLockAt(event.endDate, event.timezone);
    const graceEndsAt = computeGraceEndsAt(lockAt);

    if (event.status === EventStatus.ACTIVE && lockAt <= now) {
      await this.transition(event.id, EventStatus.ACTIVE, EventStatus.GRACE_PERIOD);
    } else if (event.status === EventStatus.GRACE_PERIOD && graceEndsAt <= now) {
      await this.transition(event.id, EventStatus.GRACE_PERIOD, EventStatus.ARCHIVED, {
        archivedAt: now,
      });
    }
  }

  /**
   * Transition protégée par une clause `where.status` : si deux exécutions
   * concurrentes (sweep + job BullMQ, ou deux workers) tentent la même
   * transition, une seule des deux mettra effectivement à jour une ligne —
   * `updateMany` retourne `count: 0` pour l'autre, qui ne journalise rien de
   * plus qu'un log "déjà traité".
   */
  private async transition(
    eventId: string,
    from: EventStatus,
    to: EventStatus,
    extra: Record<string, unknown> = {},
  ) {
    try {
      const result = await this.prisma.event.updateMany({
        where: { id: eventId, status: from },
        data: { status: to, ...extra },
      });

      if (result.count === 0) {
        this.logger.debug(
          `Événement ${eventId} déjà transitionné vers ${to} (double exécution ignorée).`,
        );
        return;
      }

      await this.prisma.archiveJobLog.create({
        data: { eventId, status: `${from}_TO_${to}`, executedAt: new Date() },
      });
      this.logger.log(`Événement ${eventId} : ${from} -> ${to}`);
    } catch (error) {
      await this.prisma.archiveJobLog.create({
        data: {
          eventId,
          status: `${from}_TO_${to}_FAILED`,
          executedAt: new Date(),
          errorMsg: error instanceof Error ? error.message : String(error),
        },
      });
      this.logger.error(`Échec de transition pour l'événement ${eventId}`, error as Error);
      throw error;
    }
  }
}
