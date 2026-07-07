import { MediaType } from "@prisma/client";
import { IsEnum, IsOptional, IsString, IsUrl } from "class-validator";

export class RegisterMediaDto {
  @IsUrl({ require_tld: false })
  storageUrl!: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  thumbnailUrl?: string;

  @IsEnum(MediaType)
  type!: MediaType;

  @IsOptional()
  @IsString()
  messageId?: string;
}
