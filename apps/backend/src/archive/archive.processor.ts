import { Injectable, Logger } from "@nestjs/common";
import { Worker, Job } from "bullmq";
import { ArchiveSweepService } from "./archive-sweep.service";
import { ARCHIVE_QUEUE_NAME } from "./archive.constants";
import { parseRedisConnection } from "./redis-connection.util";

@Injectable()
export class ArchiveProcessor {
  private readonly logger = new Logger(ArchiveProcessor.name);
  private worker: Worker | null = null;

  constructor(private readonly sweep: ArchiveSweepService) {}

  start(redisUrl: string) {
    const connection = parseRedisConnection(redisUrl);

    this.worker = new Worker(
      ARCHIVE_QUEUE_NAME,
      async (job: Job) => {
        const { eventId } = job.data as { eventId: string };
        // La transition réelle est toujours réévaluée depuis l'état en base
        // (idempotent) : ce job n'est qu'un déclencheur de précision.
        await this.sweep.processEvent(eventId);
      },
      { connection },
    );

    this.worker.on("failed", (job, err) => {
      this.logger.error(`Job d'archivage échoué (${job?.id})`, err);
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
