// Creates .env.local for the local design preview with freshly generated
// secrets and a random admin password (printed once). Never commit .env.local.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { hashPassword } from "./hash-password.mjs";

if (existsSync(".env.local")) {
  console.log(".env.local already exists — leaving it unchanged.");
  process.exit(0);
}
const password = randomBytes(12).toString("base64url");
const env = readFileSync(".env.example", "utf8")
  .replace(/^ADMIN_EMAIL=.*$/m, "ADMIN_EMAIL=admin@example.com")
  .replace(/^ADMIN_PASSWORD_HASH=.*$/m, `ADMIN_PASSWORD_HASH=${hashPassword(password)}`)
  .replace(/^ADMIN_SESSION_SECRET=.*$/m, `ADMIN_SESSION_SECRET=${randomBytes(32).toString("hex")}`)
  .replace(/^DEMO_WEBHOOK_SECRET=.*$/m, `DEMO_WEBHOOK_SECRET=${randomBytes(24).toString("hex")}`);
writeFileSync(".env.local", env, { mode: 0o600 });
console.log("Created .env.local for preview mode.");
console.log("Admin sign-in (preview only):");
console.log("  email:    admin@example.com");
console.log(`  password: ${password}`);
