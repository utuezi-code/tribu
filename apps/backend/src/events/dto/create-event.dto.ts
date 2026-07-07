import { EventType } from "@prisma/client";
import { IsArray, IsEnum, IsISO8601, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateEventDto {
  @IsEnum(EventType)
  type!: EventType;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsISO8601()
  startDate!: string;

  @IsISO8601()
  endDate!: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  invitePhoneNumbers?: string[];
}
