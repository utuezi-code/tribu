import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./common/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { EventsModule } from "./events/events.module";
import { MessagesModule } from "./messages/messages.module";
import { MediaModule } from "./media/media.module";
import { ArchiveModule } from "./archive/archive.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { AppController } from "./app.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ArchiveModule,
    EventsModule,
    MessagesModule,
    MediaModule,
    NotificationsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
