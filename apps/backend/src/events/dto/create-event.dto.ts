import { EventType } from "@prisma/client";
import { IsEnum, IsISO8601, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateEventDto {
  @IsEnum(EventType)
  type!: EventType;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  /** Date de fin uniquement : la date de début est fixée par le serveur à la création (voir EventsService.create). */
  @IsISO8601()
  endDate!: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;
}
