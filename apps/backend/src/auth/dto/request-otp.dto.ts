import { IsPhoneNumber } from "class-validator";

export class RequestOtpDto {
  @IsPhoneNumber(undefined, { message: "Numéro de téléphone invalide (format E.164 attendu)." })
  phoneNumber!: string;
}
