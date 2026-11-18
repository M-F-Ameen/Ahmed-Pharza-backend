import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js"
import { CurrentUser } from "../../common/auth/current-user.decorator.js"
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard.js"
import { PermissionsGuard } from "../../common/auth/permissions.guard.js"
import { RequirePermissions } from "../../common/auth/permissions.decorator.js"
import { CompleteUploadDto, CreateUploadUrlDto } from "./dto/media.dto.js"
import { MediaService } from "./media.service.js"

@ApiTags("Media")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("media")
@Controller("admin/media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get() @ApiOperation({ summary: "List media assets" })
  list() { return this.mediaService.list() }

  @Post("upload-url") @ApiOperation({ summary: "Create a signed direct-upload URL" })
  uploadUrl(@Body() input: CreateUploadUrlDto, @CurrentUser() actor: AuthenticatedUser) { return this.mediaService.createUploadUrl(input, actor) }

  @Post(":id/complete") @ApiOperation({ summary: "Verify and complete a media upload" })
  complete(@Param("id") id: string, @Body() input: CompleteUploadDto, @CurrentUser() actor: AuthenticatedUser) { return this.mediaService.complete(id, input, actor) }

  @Delete(":id") @ApiOperation({ summary: "Soft-delete a media asset and detach project media" })
  remove(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) { return this.mediaService.remove(id, actor) }
}
