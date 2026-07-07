import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser, AuthenticatedUser } from "../common/current-user.decorator";
import { MediaService } from "./media.service";
import { RequestUploadDto } from "./dto/request-upload.dto";
import { RegisterMediaDto } from "./dto/register-media.dto";

@UseGuards(JwtAuthGuard)
@Controller("events/:eventId/media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post("upload-url")
  requestUploadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventId") eventId: string,
    @Body() dto: RequestUploadDto,
  ) {
    return this.mediaService.requestUploadUrl(user.userId, eventId, dto);
  }

  @Post()
  register(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventId") eventId: string,
    @Body() dto: RegisterMediaDto,
  ) {
    return this.mediaService.register(user.userId, eventId, dto);
  }

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventId") eventId: string,
    @Query("cursor") cursor?: string,
  ) {
    return this.mediaService.listForEvent(user.userId, eventId, cursor);
  }
}
