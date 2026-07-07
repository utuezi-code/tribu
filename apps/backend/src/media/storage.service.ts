import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";

export interface SignedUpload {
  uploadUrl: string;
  storageUrl: string;
  path: string;
}

/**
 * Abstraction sur Supabase Storage. Sans SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY
 * configurés, retourne une URL de dev locale (pas d'upload réel) — utile
 * pour développer l'app mobile sans dépendre d'un vrai projet Supabase.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly config: ConfigService) {}

  async createSignedUploadUrl(eventId: string, extension: string): Promise<SignedUpload> {
    const bucket = this.config.get<string>("SUPABASE_MEDIA_BUCKET") ?? "event-media";
    const path = `${eventId}/${randomUUID()}.${extension}`;
    const supabaseUrl = this.config.get<string>("SUPABASE_URL");
    const serviceKey = this.config.get<string>("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      this.logger.warn(
        "SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY manquants : retour d'une URL de dev factice.",
      );
      return {
        uploadUrl: `https://dev-storage.local/${bucket}/${path}`,
        storageUrl: `https://dev-storage.local/${bucket}/${path}`,
        path,
      };
    }

    const response = await fetch(
      `${supabaseUrl}/storage/v1/object/upload/sign/${bucket}/${path}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Échec de génération de l'URL d'upload Supabase (HTTP ${response.status})`);
    }

    const body = (await response.json()) as { url: string };

    return {
      uploadUrl: `${supabaseUrl}/storage/v1${body.url}`,
      storageUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`,
      path,
    };
  }
}
