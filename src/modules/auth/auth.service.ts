import { Injectable, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import argon2 from "argon2"
import { randomBytes, randomUUID } from "node:crypto"
import { PrismaService } from "../../database/prisma.service.js"
import type { AccessTokenPayload, AuthenticatedUser } from "../../common/auth/authenticated-user.js"

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60

type UserWithPermissions = {
  id: string
  email: string
  name: string
  roleId: string
  isActive: boolean
  role: { name: string; permissions: Array<{ permissionKey: string }> }
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string, metadata: { ipAddress?: string; userAgent?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { role: { include: { permissions: true } } },
    })
    if (!user || !user.isActive || !(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException("Invalid email or password.")
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    return this.issueSession(user, metadata)
  }

  async refresh(token: string | undefined, metadata: { ipAddress?: string; userAgent?: string }) {
    const [sessionId] = token?.split(".") ?? []
    if (!sessionId || !token) throw new UnauthorizedException("Your session has expired. Please sign in again.")

    const session = await this.prisma.refreshSession.findUnique({
      where: { id: sessionId },
      include: { user: { include: { role: { include: { permissions: true } } } } },
    })
    const valid = session
      && !session.revokedAt
      && session.expiresAt > new Date()
      && session.user.isActive
      && await argon2.verify(session.tokenHash, token)

    if (!valid) {
      if (session && !session.revokedAt) {
        await this.prisma.refreshSession.updateMany({
          where: { userId: session.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        })
      }
      throw new UnauthorizedException("Your session has expired. Please sign in again.")
    }

    await this.prisma.refreshSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } })
    return this.issueSession(session.user, metadata)
  }

  async logout(token: string | undefined) {
    const [sessionId] = token?.split(".") ?? []
    if (sessionId) {
      await this.prisma.refreshSession.updateMany({
        where: { id: sessionId, revokedAt: null },
        data: { revokedAt: new Date() },
      })
    }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: { include: { permissions: true } } },
    })
    if (!user || !user.isActive) throw new UnauthorizedException("Your account is unavailable.")
    return this.serializeUser(user)
  }

  private async issueSession(user: UserWithPermissions, metadata: { ipAddress?: string; userAgent?: string }) {
    const identity = this.serializeUser(user)
    const payload: AccessTokenPayload = {
      sub: identity.id,
      email: identity.email,
      roleId: identity.roleId,
      permissions: identity.permissions,
    }
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn: ACCESS_TOKEN_TTL_SECONDS })
    const sessionId = randomUUID()
    const refreshToken = `${sessionId}.${randomBytes(48).toString("base64url")}`
    await this.prisma.refreshSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        tokenHash: await argon2.hash(refreshToken, { type: argon2.argon2id }),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      },
    })

    return { accessToken, refreshToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS, user: identity }
  }

  private serializeUser(user: UserWithPermissions): AuthenticatedUser & { name: string; role: string } {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      role: user.role.name,
      permissions: user.role.permissions.map(({ permissionKey }) => permissionKey).sort(),
    }
  }
}
