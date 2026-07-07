import { randomInt, createHash } from "crypto";
import { BadRequestException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../common/prisma.service";
import { SMS_PROVIDER, SmsProvider } from "./sms-provider.interface";

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 30 * 1000;

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    @Inject(SMS_PROVIDER) private readonly smsProvider: SmsProvider,
  ) {}

  async requestOtp(phoneNumber: string): Promise<{ resendAvailableInSeconds: number }> {
    const recent = await this.prisma.otpCode.findFirst({
      where: { phoneNumber, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      const waited = Date.now() - recent.createdAt.getTime();
      throw new BadRequestException({
        message: "Merci de patienter avant de redemander un code.",
        resendAvailableInSeconds: Math.ceil((RESEND_COOLDOWN_MS - waited) / 1000),
      });
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");

    await this.prisma.otpCode.create({
      data: {
        phoneNumber,
        codeHash: hashCode(code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    await this.smsProvider.sendOtp(phoneNumber, code);

    return { resendAvailableInSeconds: RESEND_COOLDOWN_MS / 1000 };
  }

  async verifyOtp(
    phoneNumber: string,
    code: string,
    displayName?: string,
  ): Promise<{ accessToken: string; isNewUser: boolean }> {
    const otp = await this.prisma.otpCode.findFirst({
      where: { phoneNumber, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!otp || otp.expiresAt < new Date()) {
      throw new UnauthorizedException("Code expiré ou introuvable, demande un nouveau code.");
    }

    if (otp.attempts >= MAX_ATTEMPTS) {
      throw new UnauthorizedException("Trop de tentatives, demande un nouveau code.");
    }

    if (otp.codeHash !== hashCode(code)) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException("Code incorrect.");
    }

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });

    let user = await this.prisma.user.findUnique({ where: { phoneNumber } });
    const isNewUser = !user;

    if (!user) {
      user = await this.prisma.user.create({
        data: { phoneNumber, displayName: displayName?.trim() || phoneNumber },
      });
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      phoneNumber: user.phoneNumber,
    });

    return { accessToken, isNewUser };
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
  }
}
