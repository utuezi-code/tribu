import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { SMS_PROVIDER } from "./sms-provider.interface";
import { MockSmsProvider } from "./providers/mock-sms.provider";
import { VonageSmsProvider } from "./providers/vonage-sms.provider";

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET") ?? "change-me",
        signOptions: { expiresIn: config.get<string>("JWT_EXPIRES_IN") ?? "30d" },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: SMS_PROVIDER,
      inject: [ConfigService, MockSmsProvider, VonageSmsProvider],
      useFactory: (
        config: ConfigService,
        mock: MockSmsProvider,
        vonage: VonageSmsProvider,
      ) => (config.get<string>("SMS_PROVIDER") === "vonage" ? vonage : mock),
    },
    MockSmsProvider,
    VonageSmsProvider,
  ],
  exports: [AuthService],
})
export class AuthModule {}
