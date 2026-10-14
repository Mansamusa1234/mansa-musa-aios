// Release gate: fails if a tracked file contains something that looks like a real credential.
// Dependency-free so it can run anywhere. Prints file:line and the pattern name, never the match itself.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const PATTERNS = [
  ["Stripe live key", /\b[sr]k_live_[0-9A-Za-z]{20,}/],
  ["Stripe test key", /\b[sr]k_test_[0-9A-Za-z]{24,}/],
  ["Stripe webhook secret", /\bwhsec_[0-9A-Za-z]{32,}/],
  ["Anthropic key", /\bsk-ant-[0-9A-Za-z_-]{20,}/],
  ["OpenAI key", /\bsk-(proj-)?[0-9A-Za-z]{32,}/],
  ["GitHub token", /\b(ghp|gho|ghs|ghu)_[0-9A-Za-z]{36}\b|\bgithub_pat_[0-9A-Za-z_]{50,}/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["Slack token", /\bxox[abprs]-[0-9A-Za-z-]{10,}/],
  ["Meta access token", /\bEAA[0-9A-Za-z]{100,}/],
  ["Vercel Blob token", /\bvercel_blob_rw_[0-9A-Za-z_]{20,}/],
  ["Private key", /-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/],
  ["Database URL with password", /\bpostgres(ql)?:\/\/[^:\s/'"]+:[^@\s'"]{6,}@(?!127\.0\.0\.1|localhost|host|HOST|\[::1\])[^\s'"]+/],
];
const SKIP = /\.(png|jpe?g|gif|webp|ico|mp4|mp3|woff2?|ttf|otf|pdf|zip|lock)$|package-lock\.json$/;
const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter((f) => f && !SKIP.test(f));
const findings = [];
for (const file of files) {
  let text;
  try { text = readFileSync(file, "utf8"); } catch { continue; }
  text.split("\n").forEach((line, i) => {
    for (const [name, re] of PATTERNS) if (re.test(line) && !/secret-scan:\s*allow/.test(line)) findings.push(`${file}:${i + 1}  ${name}`);
  });
}
if (findings.length) {
  console.error(`Secret scan FAILED: ${findings.length} possible credential(s) in tracked files:\n${findings.join("\n")}`);
  process.exit(1);
}
console.log(`Secret scan passed: ${files.length} tracked files, ${PATTERNS.length} patterns.`);
