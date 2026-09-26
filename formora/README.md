# FORMORA storefront (design preview)

A complete, runnable ecommerce site for **FORMORA**, a new US fitness and hydration brand with two products. It's built with Next.js 16 (App Router), TypeScript, and Tailwind CSS v4. Products are supplied and fulfilled by Supliful, and orders are placed in Supliful by hand.

> **Status: design preview.** Prices are samples, product facts are pending label verification, and checkout is simulated. Live payments can't be switched on until every launch blocker below is resolved. The code enforces this; see `src/lib/readiness.ts`.

---

## 1. Design assumptions

- **Brand.** FORMORA is a provisional name, so the site never uses ® or ™. The identity is deep evergreen for navigation and primary actions, with citrus (Lemon) and peach (Peach Mango) marking each product. Backgrounds are warm white. Headings use Bricolage Grotesque and body text uses Inter; both are self-hosted through `@fontsource`, so the site makes no Google Fonts requests. Corners are lightly rounded, borders are subtle, there are almost no shadows, and motion is limited to small transitions that respect `prefers-reduced-motion`.
- **Two products, presented as alternatives.** The copy never suggests taking both. The comparison table covers creatine, sodium, caffeine, sweetener, flavoring, serving size, net weight, servings, price, and price per serving. A row is hidden when no product has a verified value for it, and a single unknown cell shows a dash that screen readers announce as "not yet verified".
- **Product facts.** The build environment's network policy blocked supliful.com, so facts were taken from indexed copies of the Supliful listings. Every fact carries a status (`secondary-source`, `derived`, `unknown`, or `label-verified`) and a source URL in `src/config/products.ts`. The two distinctions the brief asked me to verify are handled:
  - Creatine + Hydration lists 5,000 mg creatine and 1,000 mg sodium per 10 g scoop and is sweetened with stevia. The site calls out the high sodium.
  - Hydration (Peach Mango) contains **sucralose and natural & artificial flavors**. Nothing on the site claims the whole range is free of artificial ingredients.
  - Still unknown, and therefore hidden: Peach Mango servings per container, its scoop weight, and all its nutrient amounts. Allergen statements for both products are also unknown.
- **Imagery.** No product photos exist yet, so the site uses original SVG jar renders. Each is labeled "Preview render" and carries no readable Supplement Facts. To use a real photo, add a `{ kind: "photo", src, width, height, alt, label }` entry to the product's `assets` array; nothing else needs to change.
- **Honest conversion.** There are no reviews, ratings, "bestseller" labels, countdowns, crossed-out prices, pre-selected add-ons, press logos, or signup popups. The footer email signup says plainly that it's a demo and not connected. Supplement disclaimers appear on product pages and in the footer.
- **Customer pages vs admin.** Customer pages say "our fulfillment partner". Supliful's name, product mapping, and order IDs appear only in the admin area.

## 2. Run it

```bash
cd formora
npm install
npm run setup:preview   # writes .env.local with fresh secrets; prints a one-time admin password
npm run dev             # http://localhost:3000   (admin: /admin)
```

Production build:

```bash
npm run build && npm start
```

Checks:

```bash
npm run typecheck && npm run lint
npm test                 # unit tests: totals, signatures, webhook idempotency, fulfillment rules, token access
E2E_ADMIN_EMAIL=admin@example.com E2E_ADMIN_PASSWORD=<printed password> npm run test:e2e   # needs a running server
```

The e2e suite uses the preinstalled Chromium through `playwright-core`. It checks 14 pages at 375, 768, and 1440 px for overflow and console errors, then tests the mobile menu and dialog focus, the cart, checkout validation, demo payment success and decline, access controls, webhook signature rejection, tamper-proof prices, and the admin workflow (48 checks).

### Environment variables

See [`.env.example`](.env.example). It contains no secrets. Key variables:

| Variable | Purpose |
| --- | --- |
| `FORMORA_MODE` | `preview` (default) or `live`. `live` only takes effect once no launch blockers remain. |
| `PAYMENT_PROVIDER` | `demo` or `stripe`. In preview, Stripe accepts only `sk_test_` keys. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Hosted Stripe Checkout and the signed webhook. |
| `DEMO_WEBHOOK_SECRET` | Signs events from the demo payment simulator. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` | Admin sign-in. Generate the hash with `npm run hash-password -- "<password>"`. |
| `FORMORA_UNAVAILABLE_PRODUCTS` | Comma-separated product IDs to mark unavailable. Rebuild or redeploy after changing it. |
| `DATA_DIR` | Location of the preview JSON store (defaults to `./.data`). |
| `NEXT_PUBLIC_ANALYTICS_PROVIDER` | `none` or `console`. Any provider other than `none` asks for consent first. |

## 3. Where things are configured

| Concern | File |
| --- | --- |
| Brand, business info (all `null` until supplied), mode, navigation, disclaimer | `src/config/site.ts` |
| Product facts, sources, verification status, prices, assets, supplier mapping | `src/config/products.ts` |
| Destinations, processing vs transit estimates, flat rate, tax mode, returns | `src/config/shipping.ts` |
| Payment and email providers, displayed payment methods, policy draft flags, testing documents | `src/config/commerce.ts` |
| FAQ content | `src/config/faq.ts` |
| Launch checklist and checkout gating | `src/lib/readiness.ts` |
| Totals (the one calculation shared by client and server) | `src/lib/pricing.ts` |
| Orders, payment events, fulfillment rules, audit log | `src/lib/server/orders.ts` |

## 4. Working vs demo

**Working (real code paths, tested):**

- All pages: Home (hero, range, comparison, ingredients, routine, FAQ, final CTA), Shop, two product pages, Ingredients, About, FAQ, Contact, Cart, Checkout, Success, Payment failed, Track, Order status, Shipping & Returns, and draft Privacy and Terms.
- Cart drawer and cart page, built on accessible native `<dialog>`. The cart persists across reloads and tabs, and the browser stores only product IDs and quantities.
- Guest checkout with US address validation on both client and server. Shipping and tax are shown before payment. Validation errors are announced, linked to their fields, and focus moves to the first one.
- The server recalculates every total from the catalog, so a price sent from the browser has no effect. Unavailable products are rejected. Idempotency keys stop a double-submit from creating two orders.
- Orders are marked paid only by a signed webhook: HMAC-SHA256 with a timestamp tolerance, deduplicated by event ID and by order state, with the amount checked against the server total. The success page reads the server record and never marks anything paid itself.
- Stripe hosted Checkout integration and webhook verification, written against the REST API. It is implemented but not exercised here because no test keys were available.
- Order status works through a 256-bit random token. Only the token's hash is stored, and an order number alone never reveals an order. The track form requires both order number and email, is rate-limited, and returns the same response whether or not a match exists.
- The admin area uses server-side sign-in with a scrypt password hash and an HMAC-signed, httpOnly, SameSite=strict session cookie. The proxy redirects signed-out visitors, and every page and action re-verifies the session. Admin features:
  - Order list with filters and attention flags.
  - Order detail with a SKU-to-Supliful mapping and a delivery address formatted for copying.
  - The manual workflow: verified payment → place the order in Supliful → record the Supliful ID (with a confirmation checkbox, duplicate-submission and duplicate-ID protection) → add tracking → shipment email queued.
  - Separate payment and fulfillment states. Recording a refund doesn't touch fulfillment, and there's a separate hold/cancel record.
  - Internal notes and a full audit history.
- SEO: unique titles and descriptions, canonical URLs, `sitemap.xml` and `robots.txt`, and Product JSON-LD emitted only for confirmed, label-verified data (there is no rating markup). Preview mode sets `noindex` and disallows everything; admin, checkout, and order pages are always `noindex`.
- Analytics hooks for `product_viewed`, `add_to_cart`, and `begin_checkout` on the client and `purchase_verified` on the server, gated by consent and never carrying personal data.
- Security headers, a honeypot and rate limit on the contact form, and minimal client JavaScript (native dialogs and accordions).

**Demo / not connected:**

- **Payments:** a clearly labeled simulator. It asks for no card details and moves no money, but it sends a real signed webhook to the store.
- **Prices ($39.99 and $29.99), the 7% tax rate, the $5.99 flat shipping, and the 1–3 + 3–7 business-day estimates** are all placeholders, and the site labels them that way.
- **Email:** confirmation, shipment, and order-link emails are generated into the admin **Email outbox** and marked "not sent". No provider is connected.
- **Newsletter signup:** marked as a demo; nothing is stored.
- **Data store:** a single-process JSON file (`.data/`). Replace it with a real database before launch (see the note in `src/lib/server/db.ts`).
- **Admin data:** the order list includes seeded synthetic orders labeled `FM-DEMO-*` and "synthetic".
- **Track form:** in preview only, the secure link is also shown on screen, because email isn't connected.
- **No Supliful API integration** and no stock sync. Supliful orders are placed by hand.

## 5. Launch checklist

The live version of this list, with its blocker status, is at **/admin/launch**.

- [ ] **Product verification:** check every fact against the physical labels (both products). Add the Peach Mango nutrient amounts, scoop weight, servings, and sodium. Add allergen statements. Photograph the labels. Set each fact's status to `label-verified`.
- [ ] **Prices:** confirm launch prices and set `price.confirmed: true`. Price per serving appears automatically once servings are verified.
- [ ] **Assets:** replace the preview renders with authorized packaging, label, and mixing photography or video.
- [ ] **Payments:** choose a provider whose terms allow dietary supplements and confirm merchant eligibility. Set live keys, register the webhook endpoint (`/api/webhooks/stripe`), and list only the payment methods you've actually enabled in `displayedPaymentMethods`.
- [ ] **Tax:** replace the demo rate with a real sales-tax calculation and set `tax.mode = "provider"`.
- [ ] **Business information:** legal name, support email, mailing address, hours, and response time (`src/config/site.ts`).
- [ ] **Policies:** get shipping/returns, privacy, and terms reviewed by counsel. Set the return window and the damaged-order reporting period. Clear the `draft` flags.
- [ ] **Shipping:** confirm processing and transit times, the rate, and the supported destinations with Supliful.
- [ ] **Email:** connect a transactional email provider in `src/lib/server/email.ts` and keep the outbox as a log.
- [ ] **Infrastructure:** move to a real database with unique constraints. Use a shared rate-limit store. Set strong admin credentials, preferably with SSO or 2FA.
- [ ] **Brand clearance:** complete domain and trademark checks for FORMORA and set `nameClearance` to true.
- [ ] **Analytics:** choose a provider and a consent approach that suit your target states. Keep events free of personal data.

## 6. Three conversion experiments to run after launch

Each needs real traffic, a pre-registered primary metric, and enough sample size before you call a winner. None of them comes with a promised improvement.

1. **Comparison placement.** Show the side-by-side comparison directly under the hero (variant) versus after the product cards (control). *Primary metric:* add-to-cart rate per session. *Guardrails:* returns tagged "wrong product" and support contacts asking which product to choose.
2. **Purchase-panel shipping detail.** Show the full processing and transit breakdown with the flat rate next to Add to Cart (variant) versus a one-line summary with a link (control). *Primary metric:* product-page to checkout-start rate. *Secondary metric:* checkout abandonment at the shipping step.
3. **Mobile sticky purchase bar.** Enable the bottom bar (current default) versus disable it. *Primary metric:* mobile add-to-cart rate. *Guardrails:* mobile bounce rate and any accessibility complaints about obstructed content.

## 7. Product sources

| Product | Supplier listing | Status |
| --- | --- | --- |
| FORMORA Creatine + Hydration (Lemon) | https://supliful.com/catalog/creatine-hydration-powder | Secondary source, checked 2026-09-26; label verification pending |
| FORMORA Hydration (Peach Mango) | https://supliful.com/catalog/hydration-powder-peach-mango | Secondary source, checked 2026-09-26; label verification pending |
