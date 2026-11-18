import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import type { AuthenticatedUser } from "./authenticated-user.js"
import { REQUIRED_PERMISSIONS } from "./permissions.decorator.js"

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!required?.length) return true

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>()
    const granted = new Set(request.user?.permissions ?? [])
    if (!required.every((permission) => granted.has(permission))) {
      throw new ForbiddenException("You do not have permission to perform this action.")
    }
    return true
  }
}
