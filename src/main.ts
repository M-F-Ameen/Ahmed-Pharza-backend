import "reflect-metadata"
import "dotenv/config"
import { Logger, ValidationPipe } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { NestNodeApplication, NodeAdapter } from "@nestjs/platform-node"
import cookieParser from "cookie-parser"
import helmet from "helmet"
import { Logger as PinoLogger } from "nestjs-pino"
import { AppModule } from "./app.module.js"
import { AppConfigService } from "./config/config.service.js"
import { ProblemDetailsFilter } from "./common/filters/problem-details.filter.js"
import { configureOpenApi } from "./openapi/openapi.js"

async function bootstrap() {
  const app = await NestFactory.create<NestNodeApplication>(AppModule, new NodeAdapter(), {
    bufferLogs: true,
  })
  const config = app.get(AppConfigService)

  app.useLogger(app.get(PinoLogger))
  app.use(helmet())
  app.use(cookieParser(config.cookieSecret))
  app.enableCors({
    origin: config.webOrigins,
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    exposedHeaders: ["X-Request-Id"],
  })
  app.enableCsrfProtection({ trustedOrigins: config.webOrigins })
  app.setGlobalPrefix("v1")
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }))
  app.useGlobalFilters(new ProblemDetailsFilter())
  configureOpenApi(app)

  await app.listen(config.port, "127.0.0.1")
  Logger.log(`Cliste API listening on http://127.0.0.1:${config.port}/v1`, "Bootstrap")
}

bootstrap().catch((error: unknown) => {
  Logger.error(error, "Unable to start Cliste API", "Bootstrap")
  process.exitCode = 1
})
