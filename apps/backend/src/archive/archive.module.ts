import { Module, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { Queue } from "bullmq";
import { NotificationsModule } from "../notifications/notifications.module";
import { ArchiveSweepService } from "./archive-sweep.service";
import { ArchiveService } from "./archive.service";
import { ArchiveProcessor } from "./archive.processor";
import { ARCHIVE_QUEUE, ARCHIVE_QUEUE_NAME } from "./archive.constants";
import { parseRedisConnection } from "./redis-connection.util";

@Module({
  imports: [ScheduleModule.forRoot(), NotificationsModule],
  providers: [
    ArchiveSweepService,
    ArchiveService,
    ArchiveProcessor,
    {
      provide: ARCHIVE_QUEUE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>("REDIS_URL");
        if (!redisUrl) return null;
        return new Queue(ARCHIVE_QUEUE_NAME, { connection: parseRedisConnection(redisUrl) });
      },
    },
  ],
  exports: [ArchiveService],
})
export class ArchiveModule implements OnModuleInit {
  constructor(
    private readonly config: ConfigService,
    private readonly processor: ArchiveProcessor,
  ) {}

  onModuleInit() {
    const redisUrl = this.config.get<string>("REDIS_URL");
    if (redisUrl) {
      this.processor.start(redisUrl);
    }
  }
}
