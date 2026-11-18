import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import type { IncomingMessage } from "node:http"
import type { AccessTokenPayload, AuthenticatedUser } from "./authenticated-user.js"

type RequestWithUser = IncomingMessage & { user?: AuthenticatedUser }

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestWithUser>()
    const authorization = request.headers.authorization
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined
    if (!token) throw new UnauthorizedException("Authentication is required.")

    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token)
      request.user = {
        id: payload.sub,
        email: payload.email,
        roleId: payload.roleId,
        permissions: payload.permissions,
      }
      return true
    } catch {
      throw new UnauthorizedException("Your session has expired. Please sign in again.")
    }
  }
}
