import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import type { IncomingMessage } from "node:http"
import type { NodeResponse } from "@nestjs/platform-node"
import { CurrentUser } from "../../common/auth/current-user.decorator.js"
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard.js"
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js"
import { AppConfigService } from "../../config/config.service.js"
import { LoginDto } from "./dto/login.dto.js"
import { AuthService } from "./auth.service.js"

type RequestWithCookies = IncomingMessage & { cookies?: Record<string, string | undefined> }

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: AppConfigService,
  ) {}

  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Sign in and start a secure refresh session" })
  async login(@Body() body: LoginDto, @Req() request: RequestWithCookies, @Res({ passthrough: true }) response: NodeResponse) {
    const session = await this.authService.login(body.email, body.password, this.requestMetadata(request))
    this.setRefreshCookie(response, session.refreshToken)
    return { accessToken: session.accessToken, expiresIn: session.expiresIn, user: session.user }
  }

  @Post("refresh")
  @HttpCode(200)
  @ApiOperation({ summary: "Rotate the refresh session and issue a new access token" })
  async refresh(@Req() request: RequestWithCookies, @Res({ passthrough: true }) response: NodeResponse) {
    const session = await this.authService.refresh(request.cookies?.cliste_refresh, this.requestMetadata(request))
    this.setRefreshCookie(response, session.refreshToken)
    return { accessToken: session.accessToken, expiresIn: session.expiresIn, user: session.user }
  }

  @Post("logout")
  @HttpCode(204)
  @ApiOperation({ summary: "Revoke the current refresh session" })
  async logout(@Req() request: RequestWithCookies, @Res({ passthrough: true }) response: NodeResponse) {
    await this.authService.logout(request.cookies?.cliste_refresh)
    response.clearCookie("cliste_refresh", { path: "/v1/auth" })
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get the authenticated administrator" })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.id)
  }

  private setRefreshCookie(response: NodeResponse, token: string) {
    response.cookie("cliste_refresh", token, {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: "lax",
      path: "/v1/auth",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })
  }

  private requestMetadata(request: IncomingMessage) {
    const forwarded = request.headers["x-forwarded-for"]
    const ipAddress = typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : request.socket.remoteAddress
    const userAgent = request.headers["user-agent"]
    return {
      ipAddress: ipAddress || undefined,
      userAgent: typeof userAgent === "string" ? userAgent.slice(0, 512) : undefined,
    }
  }
}
