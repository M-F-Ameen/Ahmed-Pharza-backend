import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { AppConfigService } from "../../config/config.service.js"
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard.js"
import { PermissionsGuard } from "../../common/auth/permissions.guard.js"
import { AuthController } from "./auth.controller.js"
import { AuthService } from "./auth.service.js"

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({ secret: config.accessTokenSecret }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, PermissionsGuard],
  exports: [JwtModule, JwtAuthGuard, PermissionsGuard],
})
export class AuthModule {}
