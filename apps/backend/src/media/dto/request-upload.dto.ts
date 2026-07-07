import { IsIn } from "class-validator";

export class RequestUploadDto {
  @IsIn(["jpg", "jpeg", "png", "heic", "mp4", "mov"])
  extension!: string;
}
