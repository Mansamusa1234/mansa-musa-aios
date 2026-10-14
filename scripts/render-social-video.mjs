// Free fallback video renderer: turns a script into a 1080x1920 captioned MP4 with ffmpeg.
// Used when HeyGen credits are unavailable. No network access, no paid services.
// Usage: node scripts/render-social-video.mjs --script script.txt --out out.mp4 [--cta "mansamusainitiative.com"]
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, all) => (v.startsWith("--") ? [...acc, [v.slice(2), all[i + 1]]] : acc), []));
if (!args.script || !args.out) { console.error("Usage: --script <file> --out <file.mp4> [--cta text]"); process.exit(2); }

const FONTS = ["/usr/share/fonts/noto/NotoSans-Bold.ttf", "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf", "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf"];
const font = FONTS.find(existsSync);
if (!font) { console.error("No bold sans font found (install fonts-dejavu or noto)"); process.exit(2); }

const wrap = (text, width = 20) => text.split(/\s+/).reduce((lines, word) => {
  const last = lines[lines.length - 1];
  if (last && (last + " " + word).length <= width) lines[lines.length - 1] = last + " " + word; else lines.push(word);
  return lines;
}, []).join("\n");

// One caption card per sentence; timing follows reading speed (~2.6 words/s, min 2.2 s).
const sentences = readFileSync(args.script, "utf8").replace(/\s+/g, " ").match(/[^.!?]+[.!?]*/g).map((s) => s.trim()).filter(Boolean);
const cta = args.cta ?? "mansamusainitiative.com";
const cards = [...sentences, `Start free\n${cta}`];
const dir = mkdtempSync(join(tmpdir(), "mm-render-"));
let t = 0;
const filters = cards.map((text, i) => {
  const words = text.split(/\s+/).length;
  const dur = i === cards.length - 1 ? 3.5 : Math.max(2.2, words / 2.6);
  const file = join(dir, `card${i}.txt`);
  writeFileSync(file, i === cards.length - 1 ? text : wrap(text));
  const [a, b] = [t.toFixed(2), (t + dur).toFixed(2)];
  t += dur;
  const alpha = `if(lt(t,${a}+0.25),(t-${a})/0.25,if(gt(t,${b}-0.25),(${b}-t)/0.25,1))`;
  const size = i === cards.length - 1 ? 60 : 74;
  return `drawtext=fontfile=${font}:textfile=${file}:fontsize=${size}:text_align=C:fontcolor=white:line_spacing=18:box=1:boxcolor=0x0b1020@0.55:boxborderw=36:x=(w-text_w)/2:y=(h-text_h)/2:alpha='${alpha}':enable='between(t,${a},${b})'`;
});
const brand = `drawtext=fontfile=${font}:text='MANSA MUSA AI':fontsize=46:fontcolor=0xf5c542:x=(w-text_w)/2:y=170`;
const total = t.toFixed(2);

const ff = spawnSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error",
  "-f", "lavfi", "-i", `gradients=s=1080x1920:c0=0x0b1020:c1=0x3b2a06:x0=0:y0=0:x1=1080:y1=1920:d=${total}:r=30`,
  "-f", "lavfi", "-i", `anullsrc=channel_layout=stereo:sample_rate=44100`,
  "-vf", [brand, ...filters].join(","), "-t", total,
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-profile:v", "high", "-preset", "veryfast", "-crf", "21",
  "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart", args.out], { stdio: "inherit" });
rmSync(dir, { recursive: true, force: true });
if (ff.status !== 0) process.exit(ff.status ?? 1);
console.log(JSON.stringify({ out: args.out, seconds: Number(total), cards: cards.length }));
