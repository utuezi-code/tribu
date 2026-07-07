import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EventStatus } from "@prisma/client";
import { PrismaService } from "../common/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { CreateMessageDto } from "./dto/create-message.dto";

const PAGE_SIZE = 50;

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async listForEvent(userId: string, eventId: string, cursor?: string) {
    await this.assertMember(userId, eventId);

    const messages = await this.prisma.message.findMany({
      where: { eventId },
      take: PAGE_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: { user: true, media: true },
    });

    return messages;
  }

  async create(userId: string, eventId: string, dto: CreateMessageDto) {
    await this.assertMember(userId, eventId);

    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException("Événement introuvable.");

    if (event.status !== EventStatus.ACTIVE) {
      throw new ForbiddenException(
        "Cet événement est archivé : la discussion est figée en lecture seule.",
      );
    }

    const message = await this.prisma.message.create({
      data: {
        eventId,
        userId,
        content: dto.content,
        ...(dto.mediaIds?.length
          ? { media: { connect: dto.mediaIds.map((id) => ({ id })) } }
          : {}),
      },
      include: { user: true, media: true },
    });

    this.notifyOtherMembers(eventId, userId, message.content ?? "📷 Photo/vidéo partagée").catch(
      () => undefined,
    );

    return message;
  }

  private async notifyOtherMembers(eventId: string, senderId: string, preview: string) {
    const members = await this.prisma.eventMembership.findMany({
      where: { eventId, userId: { not: senderId } },
      include: { user: true },
    });
    const sender = await this.prisma.user.findUnique({ where: { id: senderId } });

    await this.notifications.sendToUsers(
      members.map((m) => m.userId),
      {
        title: sender?.displayName ?? "Nouveau message",
        body: preview.slice(0, 120),
        data: { eventId },
      },
    );
  }

  private async assertMember(userId: string, eventId: string) {
    const membership = await this.prisma.eventMembership.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (!membership) throw new ForbiddenException("Tu ne fais pas partie de cet événement.");
  }
}
