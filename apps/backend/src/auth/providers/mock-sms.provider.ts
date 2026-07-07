import { Injectable, Logger } from "@nestjs/common";
import { SmsProvider } from "../sms-provider.interface";

/**
 * Provider de développement/test : n'envoie aucun SMS réel, se contente de
 * logger le code. Actif par défaut (SMS_PROVIDER=mock) tant qu'aucun compte
 * Vonage n'est configuré.
 */
@Injectable()
export class MockSmsProvider implements SmsProvider {
  private readonly logger = new Logger(MockSmsProvider.name);

  async sendOtp(phoneNumber: string, code: string): Promise<void> {
    this.logger.warn(`[MOCK SMS] Code OTP pour ${phoneNumber} : ${code}`);
  }
}
