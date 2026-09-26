"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { transact } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/rate-limit";
import { fieldErrors } from "@/lib/validation";

const schema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  orderNumber: z.string().trim().max(32).optional().default(""),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(3000),
});

export type ContactState = { status: "idle" | "ok" | "error"; message?: string; errors?: Record<string, string>; values?: Record<string, string> };

export async function sendContact(_prev: ContactState, fd: FormData): Promise<ContactState> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`contact:${ip}`, 5, 60 * 60_000)) return { status: "error", message: "Too many messages. Please try again later." };
  // Honeypot for simple bots.
  if (fd.get("website")) return { status: "ok", message: "Thanks — your message was received." };

  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: fieldErrors(parsed.error),
      values: Object.fromEntries(["name", "email", "orderNumber", "message"].map((k) => [k, String(fd.get(k) ?? "")])),
    };

  await transact((db) => {
    db.messages.unshift({ id: randomUUID(), createdAt: new Date().toISOString(), ...parsed.data });
  });
  return { status: "ok", message: "Thanks — your message was received." };
}
