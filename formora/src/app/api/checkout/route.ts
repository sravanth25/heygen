import { NextResponse, type NextRequest } from "next/server";
import { checkoutSchema, fieldErrors } from "@/lib/validation";
import { attachPaymentSession, CommerceError, createPendingOrder } from "@/lib/server/orders";
import { createPaymentSession } from "@/lib/server/payments";
import { getCheckoutMode } from "@/lib/readiness";
import { rateLimit } from "@/lib/server/rate-limit";
import { siteUrl } from "@/config/site";

export async function POST(req: NextRequest) {
  const mode = getCheckoutMode();
  if (mode === "disabled") {
    return NextResponse.json({ ok: false, message: "Checkout isn't open yet." }, { status: 503 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`checkout:${ip}`, 20, 10 * 60_000)) {
    return NextResponse.json({ ok: false, message: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Please check the highlighted fields.", errors: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  try {
    const provider = mode === "demo" ? "demo" : "stripe";
    const { order, token } = await createPendingOrder(parsed.data, provider);
    const origin = mode === "live" ? siteUrl : req.nextUrl.origin;
    const session = await createPaymentSession(order, token, origin);
    await attachPaymentSession(order.id, session.sessionId);
    return NextResponse.json({ ok: true, redirectUrl: session.redirectUrl });
  } catch (err) {
    if (err instanceof CommerceError) {
      return NextResponse.json({ ok: false, message: err.message, code: err.code }, { status: 409 });
    }
    console.error("[checkout] failed to start payment", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, message: "We couldn't start payment. Nothing was charged. Please try again." }, { status: 502 });
  }
}
