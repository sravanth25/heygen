import "server-only";
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/** 256-bit URL-safe random token for customer order-status links. */
export function newAccessToken(): string {
  return randomBytes(32).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hmacHex(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Verify a `t=<unix>,v1=<hex>` signature header (the scheme Stripe uses; the
 * demo provider uses the same scheme so both paths are exercised the same way).
 */
export function verifySignatureHeader(
  header: string | null,
  rawBody: string,
  secret: string,
  toleranceSeconds = 300,
  now = Math.floor(Date.now() / 1000),
): boolean {
  if (!header || !secret) return false;
  const parts = Object.create(null) as Record<string, string[]>;
  for (const kv of header.split(",")) {
    const i = kv.indexOf("=");
    if (i < 0) continue;
    const k = kv.slice(0, i).trim();
    (parts[k] ??= []).push(kv.slice(i + 1).trim());
  }
  const t = Number(parts.t?.[0]);
  if (!Number.isFinite(t) || Math.abs(now - t) > toleranceSeconds) return false;
  const expected = hmacHex(secret, `${t}.${rawBody}`);
  return (parts.v1 ?? []).some((sig) => safeEqual(sig, expected));
}

export function signPayload(rawBody: string, secret: string, now = Math.floor(Date.now() / 1000)): string {
  return `t=${now},v1=${hmacHex(secret, `${now}.${rawBody}`)}`;
}

/** Password hashes are stored as `scrypt:<saltHex>:<hashHex>` (no `$`, which .env files expand). */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}
