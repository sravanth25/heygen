"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkCredentials, endSession, requireAdmin, startSession, adminConfigured } from "@/lib/server/admin-auth";
import { rateLimit } from "@/lib/server/rate-limit";
import {
  addNote,
  addTracking,
  CommerceError,
  markSubmittedToSupplier,
  recordRefund,
  setFulfillmentHold,
} from "@/lib/server/orders";

export type ActionState = { ok?: boolean; error?: string; message?: string; email?: string };

export async function login(_prev: ActionState, fd: FormData): Promise<ActionState> {
  if (!adminConfigured()) return { error: "Admin sign-in isn't configured. Set ADMIN_EMAIL, ADMIN_PASSWORD_HASH and ADMIN_SESSION_SECRET." };
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`admin-login:${ip}`, 8, 15 * 60_000)) return { error: "Too many attempts. Try again in 15 minutes." };
  const email = String(fd.get("email") ?? "");
  const password = String(fd.get("password") ?? "");
  if (!checkCredentials(email, password)) return { error: "Email or password is incorrect.", email };
  await startSession(email.trim().toLowerCase());
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

async function run(id: string, fn: (actor: string) => Promise<unknown>, message: string): Promise<ActionState> {
  const admin = await requireAdmin();
  try {
    await fn(admin.email);
  } catch (e) {
    if (e instanceof CommerceError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin");
  return { ok: true, message };
}

export async function submitToSupplierAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get("orderId"));
  if (fd.get("confirm") !== "on") return { error: "Confirm that you placed this order in Supliful and checked the items and address." };
  return run(id, (actor) => markSubmittedToSupplier(id, String(fd.get("suplifulOrderId") ?? ""), actor), "Marked as submitted to Supliful.");
}

export async function addTrackingAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get("orderId"));
  return run(
    id,
    (actor) =>
      addTracking(
        id,
        {
          carrier: String(fd.get("carrier") ?? ""),
          trackingNumber: String(fd.get("trackingNumber") ?? ""),
          trackingUrl: String(fd.get("trackingUrl") ?? ""),
        },
        actor,
      ),
    "Tracking saved. Shipment update queued in the email outbox.",
  );
}

export async function addNoteAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get("orderId"));
  return run(id, (actor) => addNote(id, String(fd.get("note") ?? ""), actor), "Note added.");
}

export async function recordRefundAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get("orderId"));
  const dollars = Number(String(fd.get("amount") ?? "").replace(/[$,]/g, ""));
  if (!Number.isFinite(dollars)) return { error: "Enter a refund amount in dollars." };
  return run(
    id,
    (actor) => recordRefund(id, Math.round(dollars * 100), String(fd.get("reason") ?? ""), actor),
    "Refund recorded. Supplier fulfillment was NOT changed — cancel it separately if needed.",
  );
}

export async function fulfillmentAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get("orderId"));
  const op = String(fd.get("op")) as "hold" | "release" | "cancel";
  if (!["hold", "release", "cancel"].includes(op)) return { error: "Unknown action." };
  return run(id, (actor) => setFulfillmentHold(id, op, String(fd.get("reason") ?? ""), actor), "Fulfillment status updated.");
}
