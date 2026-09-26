// Usage: npm run hash-password -- "your strong password"
import { randomBytes, scryptSync } from "node:crypto";

export function hashPassword(pw) {
  const salt = randomBytes(16);
  return `scrypt:${salt.toString("hex")}:${scryptSync(pw, salt, 64).toString("hex")}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pw = process.argv[2];
  if (!pw || pw.length < 12) {
    console.error("Provide a password of at least 12 characters.");
    process.exit(1);
  }
  console.log(hashPassword(pw));
}
