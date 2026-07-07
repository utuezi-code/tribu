import { ArrayMinSize, IsArray, IsString } from "class-validator";

export class InviteMembersDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  phoneNumbers!: string[];
}
