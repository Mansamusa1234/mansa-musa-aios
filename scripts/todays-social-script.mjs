// Writes today's social script (same rotation as the app's daily cron) for the video renderer.
// Usage: node scripts/todays-social-script.mjs <out-dir>  -> script.txt, meta.json
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
const require = createRequire(import.meta.url);
const ts = require("typescript");
const out = process.argv[2] ?? ".";
const source = ts.transpileModule(readFileSync(new URL("../src/lib/social-automation.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const mod = { exports: {} };
// The script data needs no database or network: stub those imports.
vm.runInNewContext(source, { module: mod, exports: mod.exports, require: (n) => (n === "@/lib/db" ? { db: {} } : n === "crypto" ? require("node:crypto") : {}), Date, console, process });
const script = mod.exports.getTodaysScript();
const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
mkdirSync(out, { recursive: true });
writeFileSync(`${out}/script.txt`, script.script);
writeFileSync(`${out}/meta.json`, JSON.stringify({ day, title: script.title }));
console.log(JSON.stringify({ day, title: script.title }));
