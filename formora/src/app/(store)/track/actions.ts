"use server";

import { headers } from "next/headers";
import { issueTrackingLink } from "@/lib/server/orders";
import { rateLimit } from "@/lib/server/rate-limit";
import { isPreview } from "@/lib/readiness";

export type TrackState = { status: "idle" | "sent" | "error"; message?: string; previewLink?: string };

export async function requestOrderLink(_prev: TrackState, formData: FormData): Promise<TrackState> {
  const number = String(formData.get("number") ?? "").slice(0, 32);
  const email = String(formData.get("email") ?? "").slice(0, 254);
  if (!number || !email.includes("@")) return { status: "error", message: "Enter your order number and the email you used at checkout." };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`track:${ip}`, 5, 15 * 60_000)) {
    return { status: "error", message: "Too many attempts. Please try again in 15 minutes." };
  }

  const token = await issueTrackingLink(number, email);
  // Same response whether or not the order exists, so the form can't be used
  // to discover which emails have ordered.
  const base: TrackState = {
    status: "sent",
    message: "If those details match an order, we've emailed a secure order-status link to that address.",
  };
  if (token && isPreview()) {
    // Preview only: email delivery isn't connected, so show the link directly.
    return { ...base, previewLink: `/orders/${token}` };
  }
  return base;
}
