import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator"

export class LoginDto {
  @ApiProperty({ example: "admin@example.com" })
  @IsEmail()
  email!: string

  @ApiProperty({ example: "admin", minLength: 4 })
  @IsString()
  @MinLength(4)
  @MaxLength(256)
  password!: string
}
