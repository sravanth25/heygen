// Usage: node tests/e2e/shoot.mjs <outDir> <path> [widths...] [--full]
import { chromium } from "playwright-core";
const [out, path, ...rest] = process.argv.slice(2);
const full = rest.includes("--full");
const widths = rest.filter((r) => r !== "--full").map(Number);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const w of widths.length ? widths : [375, 768, 1440]) {
  const page = await browser.newPage({ viewport: { width: w, height: w < 500 ? 812 : 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle" });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const name = `${out}/${path.replace(/[^a-z0-9]+/gi, "_") || "home"}-${w}.png`;
  await page.screenshot({ path: name, fullPage: full });
  console.log(name, "overflow:", overflow, errors.length ? "ERRORS: " + errors.join(" | ") : "");
  await page.close();
}
await browser.close();
