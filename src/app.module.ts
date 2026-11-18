import { Module } from "@nestjs/common"
import { ThrottlerModule } from "@nestjs/throttler"
import { LoggerModule } from "nestjs-pino"
import { ConfigModule } from "./config/config.module.js"
import { DatabaseModule } from "./database/database.module.js"
import { HealthModule } from "./modules/health/health.module.js"
import { AuthModule } from "./modules/auth/auth.module.js"
import { ProjectsModule } from "./modules/projects/projects.module.js"
import { PublicModule } from "./modules/public/public.module.js"
import { MediaModule } from "./modules/media/media.module.js"

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
    ProjectsModule,
    PublicModule,
    MediaModule,
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: 60_000,
        limit: 120,
      },
    ]),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? "info",
        redact: ["req.headers.authorization", "req.headers.cookie", "res.headers.set-cookie"],
      },
    }),
  ],
})
export class AppModule {}
