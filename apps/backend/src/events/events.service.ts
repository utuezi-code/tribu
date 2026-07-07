import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { MemberRole } from "@prisma/client";
import { PrismaService } from "../common/prisma.service";
import { ArchiveService } from "../archive/archive.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly archiveService: ArchiveService,
  ) {}

  async create(userId: string, dto: CreateEventDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate <= startDate) {
      throw new ForbiddenException("La date de fin doit être après la date de début.");
    }

    const event = await this.prisma.event.create({
      data: {
        name: dto.name,
        type: dto.type,
        startDate,
        endDate,
        timezone: dto.timezone ?? "Europe/Paris",
        coverImageUrl: dto.coverImageUrl,
        createdBy: userId,
        members: {
          create: { userId, role: MemberRole.ORGANIZER },
        },
      },
    });

    if (dto.invitePhoneNumbers?.length) {
      await this.addMembersByPhoneNumbers(event.id, dto.invitePhoneNumbers);
    }

    await this.archiveService.scheduleForEvent(event.id, event.endDate, event.timezone);

    return this.findOneForUser(userId, event.id);
  }

  async findAllForUser(userId: string) {
    const memberships = await this.prisma.eventMembership.findMany({
      where: { userId },
      include: {
        event: {
          include: {
            members: { include: { user: true } },
            _count: { select: { media: true } },
          },
        },
      },
      orderBy: { event: { endDate: "desc" } },
    });

    return memberships.map((m) => m.event);
  }

  async findOneForUser(userId: string, eventId: string) {
    await this.assertMember(userId, eventId);

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        members: { include: { user: true } },
        _count: { select: { media: true } },
      },
    });

    if (!event) throw new NotFoundException("Événement introuvable.");
    return event;
  }

  async update(userId: string, eventId: string, dto: UpdateEventDto) {
    await this.assertOrganizer(userId, eventId);

    const event = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        name: dto.name,
        coverImageUrl: dto.coverImageUrl,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });

    if (dto.endDate) {
      await this.archiveService.scheduleForEvent(event.id, event.endDate, event.timezone);
    }

    return this.findOneForUser(userId, eventId);
  }

  async addMembers(userId: string, eventId: string, phoneNumbers: string[]) {
    await this.assertOrganizer(userId, eventId);
    return this.addMembersByPhoneNumbers(eventId, phoneNumbers);
  }

  async joinByInviteCode(userId: string, inviteCode: string) {
    const event = await this.prisma.event.findUnique({ where: { inviteCode } });
    if (!event) throw new NotFoundException("Lien d'invitation invalide.");

    await this.prisma.eventMembership.upsert({
      where: { userId_eventId: { userId, eventId: event.id } },
      create: { userId, eventId: event.id, role: MemberRole.MEMBER },
      update: {},
    });

    return this.findOneForUser(userId, event.id);
  }

  private async addMembersByPhoneNumbers(eventId: string, phoneNumbers: string[]) {
    const users = await this.prisma.user.findMany({
      where: { phoneNumber: { in: phoneNumbers } },
    });

    await Promise.all(
      users.map((user) =>
        this.prisma.eventMembership.upsert({
          where: { userId_eventId: { userId: user.id, eventId } },
          create: { userId: user.id, eventId, role: MemberRole.MEMBER },
          update: {},
        }),
      ),
    );

    const foundNumbers = new Set(users.map((u) => u.phoneNumber));
    const notYetRegistered = phoneNumbers.filter((p) => !foundNumbers.has(p));
    return { invited: users.length, notYetRegistered };
  }

  private async assertMember(userId: string, eventId: string) {
    const membership = await this.prisma.eventMembership.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (!membership) throw new ForbiddenException("Tu ne fais pas partie de cet événement.");
    return membership;
  }

  private async assertOrganizer(userId: string, eventId: string) {
    const membership = await this.assertMember(userId, eventId);
    if (membership.role !== MemberRole.ORGANIZER) {
      throw new ForbiddenException("Seul l'organisateur peut effectuer cette action.");
    }
    return membership;
  }
}
