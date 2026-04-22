import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";

function resolveEncryptionKey(): Buffer {
  const configured = process.env.ENCRYPTION_KEY;

  if (configured) {
    const asBase64 = Buffer.from(configured, "base64");
    if (asBase64.length === 32) {
      return asBase64;
    }

    const asUtf8 = Buffer.from(configured, "utf8");
    if (asUtf8.length === 32) {
      return asUtf8;
    }

    throw new Error("ENCRYPTION_KEY must be 32 bytes (utf8) or base64-encoded 32 bytes");
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("ENCRYPTION_KEY is required in production");
  }

  return createHash("sha256").update("api-key-rotator-dev-key").digest();
}

export function encryptSecret(secret: string): string {
  const key = resolveEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("base64url"), encrypted.toString("base64url"), authTag.toString("base64url")].join(".");
}

export function decryptSecret(payload: string): string {
  const [ivRaw, encryptedRaw, authTagRaw] = payload.split(".");
  if (!ivRaw || !encryptedRaw || !authTagRaw) {
    throw new Error("Encrypted payload format is invalid");
  }

  const key = resolveEncryptionKey();
  const iv = Buffer.from(ivRaw, "base64url");
  const encrypted = Buffer.from(encryptedRaw, "base64url");
  const authTag = Buffer.from(authTagRaw, "base64url");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
