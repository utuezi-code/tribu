import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser, AuthenticatedUser } from "../common/current-user.decorator";
import { EventsService } from "./events.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { InviteMembersDto } from "./dto/invite-members.dto";

@UseGuards(JwtAuthGuard)
@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEventDto) {
    return this.eventsService.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.findAllForUser(user.userId);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.eventsService.findOneForUser(user.userId, id);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.update(user.userId, id, dto);
  }

  @Post(":id/members")
  addMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: InviteMembersDto,
  ) {
    return this.eventsService.addMembers(user.userId, id, dto.phoneNumbers);
  }

  @Post("join/:inviteCode")
  join(@CurrentUser() user: AuthenticatedUser, @Param("inviteCode") inviteCode: string) {
    return this.eventsService.joinByInviteCode(user.userId, inviteCode);
  }
}
