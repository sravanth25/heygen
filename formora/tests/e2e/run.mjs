// End-to-end checks against a running preview server.
// Usage: BASE_URL=http://localhost:3000 E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... node tests/e2e/run.mjs
import { chromium } from "playwright-core";
import { createHmac } from "node:crypto";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const exe = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch({ executablePath: exe });

// 1. Layout at three widths: no horizontal overflow, no console errors.
for (const width of [375, 768, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  for (const path of ["/", "/shop", "/products/creatine-hydration-lemon", "/products/hydration-peach-mango", "/ingredients", "/about", "/faq", "/contact", "/cart", "/checkout", "/track", "/shipping-returns", "/privacy", "/terms"]) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 0) check(`no horizontal overflow ${path} @${width}`, false, `${overflow}px`);
  }
  check(`pages render without overflow @${width}`, !results.some((r) => !r.ok && r.name.includes(`@${width}`)));
  check(`no console errors @${width}`, errors.length === 0, errors.slice(0, 3).join(" | "));
  await page.close();
}

// 2. Mobile menu: opens as a dialog, Escape closes and returns focus.
{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const trigger = page.getByRole("button", { name: "Open menu" });
  await trigger.click();
  const dialogOpen = await page.getByRole("dialog").isVisible();
  const focusInside = await page.evaluate(() => !!document.activeElement?.closest("dialog"));
  await page.keyboard.press("Escape");
  const closed = !(await page.getByRole("dialog").isVisible().catch(() => false));
  const focusBack = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
  check("mobile menu opens as dialog with focus inside", dialogOpen && focusInside);
  check("Escape closes menu and returns focus", closed && focusBack === "Open menu", `focus=${focusBack}`);
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Ingredients" }).click();
  await page.waitForURL("**/ingredients");
  check("mobile menu navigation works", page.url().endsWith("/ingredients"));
  await page.close();
}

// 3. Product page, cart drawer, persistence, quantity, totals.
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const events = [];
await page.exposeFunction("__recordEvent", (e) => events.push(e));
await page.addInitScript(() => window.addEventListener("formora:analytics", (e) => window.__recordEvent(e.detail)));

await page.goto(BASE + "/products/creatine-hydration-lemon", { waitUntil: "networkidle" });
check("product_viewed analytics hook fires", events.some((e) => e.name === "product_viewed"));
await page.getByRole("button", { name: "Increase quantity" }).first().click();
check("add button shows live total", (await page.getByRole("button", { name: /Add to cart · \$79\.98/ }).count()) === 1);
await page.getByRole("button", { name: /Add to cart · \$79\.98/ }).click();
await page.getByRole("dialog").waitFor();
check("add to cart opens drawer", await page.getByRole("heading", { name: /Your cart/ }).isVisible());
check("add_to_cart hook fires without personal data", events.some((e) => e.name === "add_to_cart" && e.quantity === 2 && !("email" in e)));
check("cart count badge = 2", (await page.getByRole("button", { name: "Cart, 2 items" }).count()) === 1);
await page.keyboard.press("Escape");
const stored = await page.evaluate(() => localStorage.getItem("formora-cart-v1"));
check("cart stores only product IDs and quantities", stored === JSON.stringify([{ productId: "creatine-hydration-lemon", quantity: 2 }]), stored);

await page.goto(BASE + "/products/hydration-peach-mango", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Add to cart ·/ }).click();
await page.keyboard.press("Escape");
await page.reload({ waitUntil: "networkidle" });
check("cart persists across reload (3 items)", (await page.getByRole("button", { name: "Cart, 3 items" }).count()) === 1);

await page.goto(BASE + "/cart", { waitUntil: "networkidle" });
const text = async () => (await page.locator("main").innerText()).replace(/\s+/g, " ");
check("cart subtotal $109.97 (2×39.99 + 29.99)", (await text()).includes("$109.97"));
await page.getByRole("group", { name: "Quantity for FORMORA Hydration" }).getByRole("button", { name: "Increase quantity" }).click();
check("quantity update recalculates ($139.96)", (await text()).includes("$139.96"));
await page.getByRole("button", { name: "Remove FORMORA Hydration" }).click();
check("remove item updates subtotal ($79.98)", (await text()).includes("$79.98"));

// 4. Checkout validation and demo payment success.
await page.goto(BASE + "/checkout", { waitUntil: "networkidle" });
check("begin_checkout hook fires", events.some((e) => e.name === "begin_checkout"));
await page.getByRole("button", { name: "Continue to demo payment" }).click();
await page.locator("#checkout-error").waitFor();
await page.waitForFunction(() => document.activeElement?.id === "f-contact-email", null, { timeout: 3000 }).catch(() => {});
const emailInvalid = await page.locator("#f-contact-email").getAttribute("aria-invalid");
const describedBy = await page.locator("#f-contact-email").getAttribute("aria-describedby");
check("server validation marks fields invalid with described errors", emailInvalid === "true" && !!describedBy);
check("focus moves to first invalid field", await page.evaluate(() => document.activeElement?.id === "f-contact-email"));

await page.fill("#f-contact-email", "e2e@example.com");
await page.fill("#f-address-firstName", "Test");
await page.fill("#f-address-lastName", "Customer");
await page.fill("#f-address-line1", "1 Test Street");
await page.fill("#f-address-city", "Austin");
await page.selectOption("#f-address-state", "TX");
await page.fill("#f-address-zip", "7330");
await page.getByRole("button", { name: "Continue to demo payment" }).click();
await page.locator("#f-address-zip-error").waitFor();
check("invalid ZIP rejected", (await page.locator("#f-address-zip-error").innerText()).includes("ZIP"));
check("tax shown before payment ($5.60 on $79.98)", (await text()).includes("$5.60") && (await text()).includes("$91.57"));
await page.fill("#f-address-zip", "73301");
await page.getByRole("button", { name: "Continue to demo payment" }).click();
await page.waitForURL("**/checkout/demo-pay/**");
check("redirects to labelled demo payment page", (await text()).includes("Payment simulator — demo only") && (await text()).includes("$91.57"));
const demoPayUrl = page.url();
await page.getByRole("button", { name: "Simulate successful payment" }).click();
await page.waitForURL("**/checkout/success**");
await page.getByRole("heading", { name: /order is confirmed/ }).waitFor({ timeout: 15000 });
check("success page shows confirmed order after webhook", true);
const orderNumber = (await text()).match(/FM-[A-Z0-9]{4}-[A-Z0-9]{4}/)?.[0];
await page.waitForFunction(() => localStorage.getItem("formora-cart-v1") === "[]");
check("cart cleared after confirmed payment", true);
await page.getByRole("link", { name: "View order status" }).click();
await page.waitForURL("**/orders/**");
check("order status page via token", (await text()).includes(orderNumber) && (await text()).includes("Payment confirmed"));
check("order status masks the street address", !(await text()).includes("1 Test Street"));
await page.goto(demoPayUrl, { waitUntil: "networkidle" });
check("demo session cannot be paid twice", (await text()).includes("already complete"));

// 5. Payment failure path.
await page.goto(BASE + "/products/hydration-peach-mango", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Add to cart ·/ }).click();
await page.keyboard.press("Escape");
await page.goto(BASE + "/checkout", { waitUntil: "networkidle" });
for (const [id, v] of [["#f-contact-email", "fail@example.com"], ["#f-address-firstName", "F"], ["#f-address-lastName", "L"], ["#f-address-line1", "2 Test Street"], ["#f-address-city", "Denver"], ["#f-address-zip", "80202"]]) await page.fill(id, v);
await page.selectOption("#f-address-state", "CO");
await page.getByRole("button", { name: "Continue to demo payment" }).click();
await page.waitForURL("**/checkout/demo-pay/**");
await page.getByRole("button", { name: "Simulate declined payment" }).click();
await page.waitForURL("**/checkout/failed**");
check("declined payment shows failure screen", (await text()).includes("declined") && (await text()).includes("Nothing was charged"));
check("cart kept after failure", (await page.getByRole("button", { name: "Cart, 1 item" }).count()) === 1);

// 6. Access control.
const anon = await browser.newContext();
const ap = await anon.newPage();
await ap.goto(BASE + "/admin", { waitUntil: "networkidle" });
check("admin redirects to login without a session", ap.url().endsWith("/admin/login"));
await anon.addCookies([{ name: "formora_admin", value: "forged.value", url: BASE }]);
await ap.goto(BASE + "/admin", { waitUntil: "networkidle" });
check("forged admin cookie rejected", ap.url().endsWith("/admin/login"));
await ap.goto(BASE + `/orders/${orderNumber}`, { waitUntil: "networkidle" });
check("order number alone does not expose an order", (await ap.locator("main").innerText()).includes("not recognized"));
const unsigned = await fetch(BASE + "/api/webhooks/demo", { method: "POST", body: "{}", headers: { "content-type": "application/json" } });
check("unsigned webhook rejected (400)", unsigned.status === 400);
const badSig = await fetch(BASE + "/api/webhooks/demo", {
  method: "POST",
  body: "{}",
  headers: { "x-formora-signature": `t=${Math.floor(Date.now() / 1000)},v1=${createHmac("sha256", "wrong").update("x").digest("hex")}` },
});
check("wrongly signed webhook rejected (400)", badSig.status === 400);
const tamper = await fetch(BASE + "/api/checkout", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ idempotencyKey: crypto.randomUUID(), items: [{ productId: "creatine-hydration-lemon", quantity: 1, priceCents: 1 }], contact: { email: "x@example.com" }, address: { firstName: "a", lastName: "b", line1: "1 Main St", city: "Reno", state: "NV", zip: "89501" } }),
});
const tj = await tamper.json();
check("checkout API ignores client-sent prices", tamper.ok && tj.redirectUrl?.startsWith("/checkout/demo-pay/"));
await anon.close();

// 7. Admin workflow.
if (process.env.E2E_ADMIN_PASSWORD) {
  await page.goto(BASE + "/admin/login", { waitUntil: "networkidle" });
  await page.fill("#a-email", process.env.E2E_ADMIN_EMAIL ?? "admin@example.com");
  await page.fill("#a-password", "wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.locator("form [role=alert]").waitFor();
  check("wrong admin password rejected", (await page.locator("form [role=alert]").innerText()).includes("incorrect"));
  await page.fill("#a-password", process.env.E2E_ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(BASE + "/admin", { waitUntil: "commit" });
  await page.getByRole("heading", { name: "Orders" }).waitFor();
  check("admin login works", (await text()).includes("Orders"));
  check("synthetic orders are labelled", (await text()).includes("synthetic"));
  await page.getByRole("link", { name: orderNumber }).click();
  await page.waitForURL("**/admin/orders/**", { waitUntil: "commit" });
  await page.getByRole("heading", { name: orderNumber }).waitFor();
  check("admin order detail shows SKU → Supliful mapping", (await text()).includes("FRM-CRH-LEM") && (await text()).includes("Creatine Hydration Powder — Lemon"));
  check("admin sees full delivery address", (await text()).includes("1 Test Street"));
  await page.fill("#sid", "SUP-E2E-1");
  await page.getByRole("button", { name: "Mark as submitted to Supliful" }).click();
  await page.locator("form [role=alert]").waitFor();
  check("submission requires explicit confirmation", (await page.locator("form [role=alert]").innerText()).includes("Confirm"));
  await page.check('input[name="confirm"]');
  await page.getByRole("button", { name: "Mark as submitted to Supliful" }).click();
  await page.getByText("Submitted is not shipped").waitFor();
  check("order marked submitted (not shipped)", (await text()).includes("SUP-E2E-1"));
  await page.selectOption("#carrier", "UPS");
  await page.fill("#tn", "1Z999AA10123456784");
  await page.getByRole("button", { name: "Save tracking and mark shipped" }).click();
  await page.getByText("Updating tracking queues another shipment email").waitFor();
  check("tracking added, audit history recorded", (await text()).includes("Tracking added — marked shipped") && (await text()).includes("Marked submitted to Supliful"));
  await page.goto(BASE + "/admin/outbox", { waitUntil: "networkidle" });
  check("shipment email queued (not sent)", (await text()).includes(`Your FORMORA order ${orderNumber} has shipped`) && (await text()).includes("not sent"));
  await page.goto(BASE + "/admin/launch", { waitUntil: "networkidle" });
  check("launch checklist lists blockers", (await text()).includes("Blocker"));
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
