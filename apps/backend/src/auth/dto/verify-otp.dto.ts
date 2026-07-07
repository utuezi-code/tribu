import { IsOptional, IsPhoneNumber, IsString, Length } from "class-validator";

export class VerifyOtpDto {
  @IsPhoneNumber(undefined, { message: "Numéro de téléphone invalide (format E.164 attendu)." })
  phoneNumber!: string;

  @IsString()
  @Length(6, 6, { message: "Le code doit contenir 6 chiffres." })
  code!: string;

  /** Requis uniquement à la toute première vérification (création de compte). */
  @IsOptional()
  @IsString()
  displayName?: string;
}
