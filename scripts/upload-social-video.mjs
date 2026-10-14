// Uploads the rendered daily video to Vercel Blob at a fixed public path: social/<day>.mp4.
// Needs BLOB_READ_WRITE_TOKEN. Usage: node scripts/upload-social-video.mjs <file.mp4> <YYYY-MM-DD>
import { readFileSync } from "node:fs";
const [file, day] = process.argv.slice(2);
if (!file || !/^\d{4}-\d{2}-\d{2}$/.test(day ?? "")) { console.error("Usage: <file.mp4> <YYYY-MM-DD>"); process.exit(2); }
if (!process.env.BLOB_READ_WRITE_TOKEN) { console.error("BLOB_READ_WRITE_TOKEN is not set"); process.exit(2); }
const { put } = await import("@vercel/blob");
const blob = await put(`social/${day}.mp4`, readFileSync(file), { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "video/mp4" });
console.log(JSON.stringify({ url: blob.url }));
