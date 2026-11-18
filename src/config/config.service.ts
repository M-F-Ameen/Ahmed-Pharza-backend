import { Injectable } from "@nestjs/common"
import { Environment, loadEnvironment } from "./environment.js"

@Injectable()
export class AppConfigService {
  private readonly environment: Environment = loadEnvironment()

  get nodeEnv() {
    return this.environment.NODE_ENV
  }

  get port() {
    return this.environment.PORT
  }

  get databaseUrl() {
    return this.environment.DATABASE_URL
  }

  get databaseConnectOnBoot() {
    return this.environment.DATABASE_CONNECT_ON_BOOT
  }

  get webOrigins() {
    return this.environment.WEB_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  }

  get logLevel() {
    return this.environment.LOG_LEVEL
  }

  get accessTokenSecret() {
    return this.environment.ACCESS_TOKEN_SECRET
  }

  get refreshTokenSecret() {
    return this.environment.REFRESH_TOKEN_SECRET
  }

  get cookieSecret() {
    return this.environment.COOKIE_SECRET
  }

  get isProduction() {
    return this.environment.NODE_ENV === "production"
  }

  get storage() {
    return {
      endpoint: this.environment.S3_ENDPOINT,
      region: this.environment.S3_REGION,
      bucket: this.environment.S3_BUCKET,
      accessKeyId: this.environment.S3_ACCESS_KEY_ID,
      secretAccessKey: this.environment.S3_SECRET_ACCESS_KEY,
      publicBaseUrl: this.environment.S3_PUBLIC_BASE_URL.replace(/\/$/, ""),
    }
  }
}
