import crypto from "crypto";

const APP_NAME = "MansaMusaAI";
const DIGITS = 6;
const STEP = 30;
const WINDOW = 1;

function base32Decode(encoded: string): Buffer {
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = encoded.toUpperCase().replace(/=+$/, "");
  let bits = 0, value = 0;
  const output: number[] = [];
  for (const char of cleaned) {
    const idx = ALPHABET.indexOf(char);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) { bits -= 8; output.push((value >> bits) & 0xff); }
  }
  return Buffer.from(output);
}

function base32Encode(buf: Buffer): string {
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0, value = 0, output = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) { bits -= 5; output += ALPHABET[(value >> bits) & 31]; }
  }
  if (bits > 0) output += ALPHABET[(value << (5 - bits)) & 31];
  while (output.length % 8) output += "=";
  return output;
}

function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  const hi = Math.floor(counter / 0x100000000);
  const lo = counter >>> 0;
  buf.writeUInt32BE(hi, 0);
  buf.writeUInt32BE(lo, 4);
  const hmac = crypto.createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac[offset] & 0x7f) << 24 | hmac[offset + 1] << 16 | hmac[offset + 2] << 8 | hmac[offset + 3]) % Math.pow(10, DIGITS);
  return String(code).padStart(DIGITS, "0");
}

export function generateTotpSecret(): string {
  return base32Encode(crypto.randomBytes(20)).replace(/=/g, "");
}

export function getTotpUri(email: string, secret: string): string {
  const encoded = encodeURIComponent(email);
  const issuer = encodeURIComponent(APP_NAME);
  return `otpauth://totp/${issuer}:${encoded}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=${DIGITS}&period=${STEP}`;
}

export function verifyTotp(token: string, secret: string): boolean {
  try {
    const key = base32Decode(secret);
    const t = Math.floor(Date.now() / 1000 / STEP);
    for (let i = -WINDOW; i <= WINDOW; i++) {
      if (hotp(key, t + i) === token) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function generateBackupCodes(): string[] {
  return Array.from({ length: 8 }, () => crypto.randomBytes(4).toString("hex").toUpperCase());
}

export function hashBackupCodes(codes: string[]): string {
  return JSON.stringify(codes.map((c) => crypto.createHash("sha256").update(c).digest("hex")));
}

export function verifyBackupCode(code: string, hashedCodesJson: string): { valid: boolean; remaining: string[] } {
  const hashed: string[] = JSON.parse(hashedCodesJson);
  const inputHash = crypto.createHash("sha256").update(code.toUpperCase()).digest("hex");
  const idx = hashed.indexOf(inputHash);
  if (idx === -1) return { valid: false, remaining: hashed };
  return { valid: true, remaining: hashed.filter((_, i) => i !== idx) };
}
