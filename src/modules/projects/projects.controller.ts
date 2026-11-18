import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js"
import { CurrentUser } from "../../common/auth/current-user.decorator.js"
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard.js"
import { PermissionsGuard } from "../../common/auth/permissions.guard.js"
import { RequirePermissions } from "../../common/auth/permissions.decorator.js"
import { CreateProjectDto, ProjectListQueryDto, UpdateProjectDto } from "./dto/project.dto.js"
import { ProjectsService } from "./projects.service.js"

@ApiTags("Admin projects")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("portfolio")
@Controller("admin/projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: "List general and software portfolio project drafts" })
  list(@Query() query: ProjectListQueryDto) {
    return this.projectsService.list(query)
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a project draft" })
  get(@Param("id") id: string) {
    return this.projectsService.get(id)
  }

  @Post()
  @ApiOperation({ summary: "Create a portfolio project as a draft" })
  create(@Body() input: CreateProjectDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.projectsService.create(input, actor)
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a portfolio project and create a draft revision" })
  update(@Param("id") id: string, @Body() input: UpdateProjectDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.projectsService.update(id, input, actor)
  }

  @Post(":id/publish")
  @ApiOperation({ summary: "Publish the latest project draft" })
  publish(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.projectsService.publish(id, actor)
  }

  @Post(":id/unpublish")
  @ApiOperation({ summary: "Remove a project from public publication" })
  unpublish(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.projectsService.unpublish(id, actor)
  }
}
