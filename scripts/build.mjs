import { rmSync } from "node:fs";
import { spawnSync } from "node:child_process";

const nextBin = "node_modules/next/dist/bin/next";

function runBuild() {
  const result = spawnSync(process.execPath, [nextBin, "build"], {
    encoding: "utf8",
    env: process.env,
  });

  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
  return result;
}

let result = runBuild();
const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

// Next.js can occasionally race while cleaning its generated export directory.
// Retry only this known transient error; all real build failures still fail fast.
if (result.status !== 0 && output.includes("ENOTEMPTY") && output.includes(".next/export")) {
  console.warn("[build] Retrying after transient .next/export cleanup race");
  rmSync(".next", { recursive: true, force: true });
  result = runBuild();
}

process.exit(result.status ?? 1);
