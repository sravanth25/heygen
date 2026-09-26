import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hmacHex, safeEqual, verifyPassword } from "./crypto";

export const ADMIN_COOKIE = "formora_admin";
const SESSION_HOURS = 8;

export type AdminSession = { email: string; exp: number };

function secret(): string | null {
  const s = process.env.ADMIN_SESSION_SECRET;
  return s && s.length >= 32 ? s : null;
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH && secret());
}

export function checkCredentials(email: string, password: string): boolean {
  const expectedEmail = (process.env.ADMIN_EMAIL ?? "").toLowerCase();
  const hash = process.env.ADMIN_PASSWORD_HASH ?? "";
  if (!expectedEmail || !hash) return false;
  // Always run the password check so timing doesn't reveal a valid email.
  const passwordOk = verifyPassword(password, hash);
  return safeEqual(email.trim().toLowerCase(), expectedEmail) && passwordOk;
}

export function encodeSession(session: AdminSession): string {
  const s = secret();
  if (!s) throw new Error("ADMIN_SESSION_SECRET must be at least 32 characters");
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${hmacHex(s, payload)}`;
}

export function decodeSession(value: string | undefined): AdminSession | null {
  const s = secret();
  if (!value || !s) return null;
  const [payload, sig] = value.split(".");
  if (!payload || !sig || !safeEqual(sig, hmacHex(s, payload))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as AdminSession;
    if (typeof session.exp !== "number" || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function startSession(email: string) {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, encodeSession({ email, exp: Date.now() + SESSION_HOURS * 36e5 }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function endSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function getAdmin(): Promise<AdminSession | null> {
  return decodeSession((await cookies()).get(ADMIN_COOKIE)?.value);
}

/** Call at the top of every admin page and server action. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdmin();
  if (!session) redirect("/admin/login");
  return session;
}
