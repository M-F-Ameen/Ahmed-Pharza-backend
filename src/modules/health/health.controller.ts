import { Controller, Get, ServiceUnavailableException } from "@nestjs/common"
import { ApiOperation, ApiTags } from "@nestjs/swagger"
import { PrismaService } from "../../database/prisma.service.js"

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "API liveness check" })
  live() {
    return { status: "ok" }
  }

  @Get("ready")
  @ApiOperation({ summary: "API readiness and database connectivity" })
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return { status: "ok", database: "up" }
    } catch {
      throw new ServiceUnavailableException("Database is unavailable.")
    }
  }
}
