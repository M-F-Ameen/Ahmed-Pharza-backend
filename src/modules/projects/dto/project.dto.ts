import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { Transform, Type } from "class-transformer"
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator"

export const projectKinds = ["general", "software"] as const
export type ProjectKindValue = (typeof projectKinds)[number]

export class CreateProjectDto {
  @ApiProperty({ enum: projectKinds, example: "general" })
  @IsIn(projectKinds)
  kind!: ProjectKindValue

  @ApiProperty({ example: "clutch-by-cliste" })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(120)
  slug!: string

  @ApiProperty({ example: "Clutch by Cliste" })
  @IsString()
  @MaxLength(160)
  title!: string

  @ApiProperty({ example: "A calm, effective customer-engagement experience." })
  @IsString()
  @MaxLength(1_200)
  description!: string

  @ApiProperty({ example: "Vehicle showroom with modern interiors" })
  @IsString()
  @MaxLength(300)
  imageAlt!: string

  @ApiProperty({ example: ["Strategy", "Automation"], type: [String] })
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  tags!: string[]

  @ApiPropertyOptional({ example: "Customer engagement" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  lead?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8_000)
  overview?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8_000)
  challenge?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8_000)
  approach?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8_000)
  outcome?: string

  @ApiPropertyOptional({ example: "https://preview.example.com" })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2_000)
  previewUrl?: string

  @ApiPropertyOptional({ example: "https://github.com/acme/project" })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2_000)
  githubUrl?: string

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  visible?: boolean

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000)
  sortOrder?: number
}

export class UpdateProjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(120)
  slug?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1_200)
  description?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  imageAlt?: string

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  tags?: string[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  lead?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8_000)
  overview?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8_000)
  challenge?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8_000)
  approach?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8_000)
  outcome?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2_000)
  previewUrl?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2_000)
  githubUrl?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  featured?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  visible?: boolean

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000)
  sortOrder?: number
}

export class ProjectListQueryDto {
  @ApiPropertyOptional({ enum: projectKinds })
  @IsOptional()
  @IsIn(projectKinds)
  kind?: ProjectKindValue

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20

  @ApiPropertyOptional({ example: "clutch" })
  @IsOptional()
  @Transform(({ value }) => typeof value === "string" ? value.trim() : value)
  @IsString()
  @MaxLength(120)
  search?: string
}
