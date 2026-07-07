import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import type { Queue } from "bullmq";
import { computeGraceEndsAt, computeLockAt } from "./archive-time.util";
import { ARCHIVE_QUEUE } from "./archive.constants";

@Injectable()
export class ArchiveService {
  private readonly logger = new Logger(ArchiveService.name);

  constructor(@Optional() @Inject(ARCHIVE_QUEUE) private readonly queue: Queue | null) {}

  /**
   * Programme (ou reprogramme, en cas de report de date) les jobs de
   * verrouillage et d'archivage définitif pour un événement. Si aucune
   * file BullMQ n'est disponible (pas de REDIS_URL configuré), c'est le
   * sweep périodique (`ArchiveSweepService`) qui prendra le relais avec une
   * précision de quelques minutes au lieu d'une précision exacte.
   */
  async scheduleForEvent(eventId: string, endDate: Date, timezone: string) {
    if (!this.queue) {
      this.logger.warn(
        `REDIS_URL non configuré : l'événement ${eventId} sera traité par le sweep périodique, pas par un job précis.`,
      );
      return;
    }

    const lockAt = computeLockAt(endDate, timezone);
    const graceEndsAt = computeGraceEndsAt(lockAt);
    const now = Date.now();

    // BullMQ n'écrase pas un job existant avec le même jobId (et ne met pas
    // à jour son délai) : en cas de report de date, on retire l'ancien job
    // avant d'en programmer un nouveau, pour que la reprogrammation soit
    // effective plutôt qu'un no-op silencieux.
    await this.removeIfExists(`lock:${eventId}`);
    await this.removeIfExists(`finalize:${eventId}`);

    await this.queue.add(
      "lock-discussion",
      { eventId },
      { jobId: `lock:${eventId}`, delay: Math.max(0, lockAt.getTime() - now) },
    );

    await this.queue.add(
      "finalize-archive",
      { eventId },
      { jobId: `finalize:${eventId}`, delay: Math.max(0, graceEndsAt.getTime() - now) },
    );
  }

  private async removeIfExists(jobId: string) {
    const job = await this.queue!.getJob(jobId);
    if (job && !(await job.isCompleted()) && !(await job.isActive())) {
      await job.remove();
    }
  }
}
