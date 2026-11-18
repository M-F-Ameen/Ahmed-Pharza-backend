import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../generated/prisma/client.js"
import { AppConfigService } from "../config/config.service.js"

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly connectOnBoot: boolean

  constructor(config: AppConfigService) {
    const adapter = new PrismaPg({ connectionString: config.databaseUrl })
    super({ adapter })
    this.connectOnBoot = config.databaseConnectOnBoot
  }

  async onModuleInit() {
    if (this.connectOnBoot) await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
