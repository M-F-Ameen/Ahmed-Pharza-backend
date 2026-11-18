import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsEmail, IsIn, IsOptional, IsString, IsUrl, MaxLength } from "class-validator"

export class PublicProjectQueryDto {
  @ApiPropertyOptional({ enum: ["general", "software"] })
  @IsOptional()
  @IsIn(["general", "software"])
  kind?: "general" | "software"

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  featured?: boolean
}

export class ContactSubmissionDto {
  @ApiProperty({ example: "Mohamed Fattag" })
  @IsString()
  @MaxLength(160)
  name!: string

  @ApiProperty({ example: "mohamed@example.com" })
  @IsEmail()
  @MaxLength(320)
  email!: string

  @ApiPropertyOptional({ example: "Cliste" })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  company?: string

  @ApiProperty({ example: "I would like to discuss a new project." })
  @IsString()
  @MaxLength(10_000)
  message!: string

  @ApiPropertyOptional({ description: "Spam honeypot. Leave empty." })
  @IsOptional()
  @IsString()
  @MaxLength(0)
  website?: string
}
