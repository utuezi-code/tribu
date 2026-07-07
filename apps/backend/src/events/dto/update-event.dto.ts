import { IsISO8601, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  /** Report de date : reprogramme automatiquement le job d'archivage. */
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;
}
