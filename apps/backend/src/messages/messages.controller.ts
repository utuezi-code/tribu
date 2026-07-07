import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser, AuthenticatedUser } from "../common/current-user.decorator";
import { MessagesService } from "./messages.service";
import { CreateMessageDto } from "./dto/create-message.dto";

@UseGuards(JwtAuthGuard)
@Controller("events/:eventId/messages")
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventId") eventId: string,
    @Query("cursor") cursor?: string,
  ) {
    return this.messagesService.listForEvent(user.userId, eventId, cursor);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventId") eventId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagesService.create(user.userId, eventId, dto);
  }
}
