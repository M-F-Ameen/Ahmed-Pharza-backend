import { Body, Controller, Get, HttpCode, Param, Post, Query } from "@nestjs/common"
import { Throttle } from "@nestjs/throttler"
import { ApiOperation, ApiTags } from "@nestjs/swagger"
import { ContactSubmissionDto, PublicProjectQueryDto } from "./dto/public.dto.js"
import { PublicService } from "./public.service.js"

@ApiTags("Public website")
@Controller("public")
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get("site")
  @ApiOperation({ summary: "Get public site settings and visible social links" })
  site() { return this.publicService.site() }

  @Get("navigation")
  @ApiOperation({ summary: "Get public header and footer navigation" })
  navigation() { return this.publicService.navigation() }

  @Get("home")
  @ApiOperation({ summary: "Get the published homepage payload" })
  home() { return this.publicService.home() }

  @Get("projects")
  @ApiOperation({ summary: "List published portfolio projects" })
  projects(@Query() query: PublicProjectQueryDto) { return this.publicService.listProjects(query) }

  @Get("projects/:kind/:slug")
  @ApiOperation({ summary: "Get a published portfolio project" })
  project(@Param("kind") kind: "general" | "software", @Param("slug") slug: string) {
    return this.publicService.project(kind, slug)
  }

  @Get("services")
  @ApiOperation({ summary: "List published services" })
  services() { return this.publicService.services() }

  @Get("services/:slug")
  @ApiOperation({ summary: "Get a published service" })
  service(@Param("slug") slug: string) { return this.publicService.service(slug) }

  @Post("contact-submissions")
  @HttpCode(201)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: "Store a website contact enquiry" })
  contact(@Body() input: ContactSubmissionDto) { return this.publicService.submitContact(input) }
}
