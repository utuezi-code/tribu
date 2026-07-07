import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength, ValidateIf } from "class-validator";

export class CreateMessageDto {
  @ValidateIf((dto: CreateMessageDto) => !dto.mediaIds || dto.mediaIds.length === 0)
  @IsString()
  @MaxLength(4000)
  content?: string;

  /** Médias déjà uploadés (voir module Media) à rattacher à ce message. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  mediaIds?: string[];

  /** Identifiant généré côté client pour la file d'attente hors-ligne (idempotence). */
  @IsOptional()
  @IsString()
  clientId?: string;
}
