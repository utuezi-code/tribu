import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EventStatus } from "@prisma/client";
import { PrismaService } from "../common/prisma.service";
import { StorageService } from "./storage.service";
import { RequestUploadDto } from "./dto/request-upload.dto";
import { RegisterMediaDto } from "./dto/register-media.dto";

const PAGE_SIZE = 60;

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async requestUploadUrl(userId: string, eventId: string, dto: RequestUploadDto) {
    await this.assertCanUpload(userId, eventId);
    return this.storage.createSignedUploadUrl(eventId, dto.extension);
  }

  async register(userId: string, eventId: string, dto: RegisterMediaDto) {
    await this.assertCanUpload(userId, eventId);

    return this.prisma.media.create({
      data: {
        eventId,
        userId,
        storageUrl: dto.storageUrl,
        thumbnailUrl: dto.thumbnailUrl,
        type: dto.type,
        messageId: dto.messageId,
      },
    });
  }

  async listForEvent(userId: string, eventId: string, cursor?: string) {
    await this.assertMember(userId, eventId);

    return this.prisma.media.findMany({
      where: { eventId },
      take: PAGE_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });
  }

  private async assertCanUpload(userId: string, eventId: string) {
    await this.assertMember(userId, eventId);

    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException("Événement introuvable.");

    if (event.status === EventStatus.ARCHIVED) {
      throw new ForbiddenException(
        "La fenêtre de grâce est terminée : la galerie n'accepte plus de nouveaux ajouts.",
      );
    }
  }

  private async assertMember(userId: string, eventId: string) {
    const membership = await this.prisma.eventMembership.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (!membership) throw new ForbiddenException("Tu ne fais pas partie de cet événement.");
  }
}
