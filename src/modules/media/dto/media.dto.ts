import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator"

export class CreateUploadUrlDto {
  @ApiProperty({ example: "project-cover.webp" })
  @IsString()
  @MaxLength(255)
  originalFilename!: string

  @ApiProperty({ example: "image/webp" })
  @IsString()
  @MaxLength(100)
  mimeType!: string

  @ApiProperty({ example: 220_000 })
  @IsInt()
  @Min(1)
  @Max(10 * 1024 * 1024)
  byteSize!: number

  @ApiPropertyOptional({ example: "A product dashboard" })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  altText?: string
}

export class CompleteUploadDto {
  @ApiPropertyOptional({ example: 1440 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20_000)
  width?: number

  @ApiPropertyOptional({ example: 900 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20_000)
  height?: number
}
