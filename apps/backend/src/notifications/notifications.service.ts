import { Injectable, Logger } from "@nestjs/common";
import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { PrismaService } from "../common/prisma.service";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

  constructor(private readonly prisma: PrismaService) {}

  async registerToken(userId: string, token: string) {
    if (!Expo.isExpoPushToken(token)) {
      this.logger.warn(`Token push invalide reçu pour l'utilisateur ${userId}, ignoré.`);
      return;
    }
    await this.prisma.pushToken.upsert({
      where: { token },
      create: { userId, token },
      update: { userId },
    });
  }

  async sendToUsers(
    userIds: string[],
    notification: { title: string; body: string; data?: Record<string, unknown> },
  ) {
    if (userIds.length === 0) return;

    const tokens = await this.prisma.pushToken.findMany({ where: { userId: { in: userIds } } });
    const messages: ExpoPushMessage[] = tokens
      .filter((t) => Expo.isExpoPushToken(t.token))
      .map((t) => ({
        to: t.token,
        sound: "default" as const,
        title: notification.title,
        body: notification.body,
        data: notification.data,
      }));

    if (messages.length === 0) return;

    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await this.expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        this.logger.error("Échec d'envoi d'un lot de notifications push", error as Error);
      }
    }
  }
}
