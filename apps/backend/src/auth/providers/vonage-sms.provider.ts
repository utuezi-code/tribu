import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SmsProvider } from "../sms-provider.interface";

/**
 * Envoi réel via l'API Vonage Verify/SMS. Nécessite VONAGE_API_KEY et
 * VONAGE_API_SECRET (voir .env.example) — non testé en conditions réelles
 * dans cet environnement (pas de compte Vonage fourni).
 */
@Injectable()
export class VonageSmsProvider implements SmsProvider {
  private readonly logger = new Logger(VonageSmsProvider.name);

  constructor(private readonly config: ConfigService) {}

  async sendOtp(phoneNumber: string, code: string): Promise<void> {
    const apiKey = this.config.get<string>("VONAGE_API_KEY");
    const apiSecret = this.config.get<string>("VONAGE_API_SECRET");
    const brandName = this.config.get<string>("VONAGE_BRAND_NAME") ?? "Tribu";

    if (!apiKey || !apiSecret) {
      throw new Error(
        "VONAGE_API_KEY / VONAGE_API_SECRET manquants : impossible d'envoyer un SMS réel.",
      );
    }

    const response = await fetch("https://rest.nexmo.com/sms/json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        api_secret: apiSecret,
        to: phoneNumber.replace("+", ""),
        from: brandName,
        text: `${code} est ton code de vérification Tribu.`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Échec d'envoi SMS Vonage (HTTP ${response.status})`);
    }

    const body = (await response.json()) as { messages?: Array<{ status?: string }> };
    const failed = body.messages?.some((m) => m.status !== "0");
    if (failed) {
      this.logger.error(`Vonage a rejeté l'envoi pour ${phoneNumber}: ${JSON.stringify(body)}`);
      throw new Error("Échec d'envoi SMS Vonage");
    }
  }
}
