// Turns full-resolution exports into web-sized JPEGs under photos/.
//
//   npm run photos -- "C:\path\to\folder" [more folders or files...]
//
// Originals stay where they are; only the optimized copies go in the repo.

import { readdir, stat, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT_DIR = path.resolve(import.meta.dirname, "..", "photos");
// Wide enough for full-bleed panoramas on high-DPI screens; portraits are
// capped by height since they never display more than ~half the page width.
const MAX_WIDTH = 3840;
const MAX_HEIGHT = 2560;
const QUALITY = 90;

async function collect(input) {
  const info = await stat(input);
  if (info.isFile()) return [input];
  const entries = await readdir(input);
  return entries.filter(f => /\.jpe?g$/i.test(f)).map(f => path.join(input, f));
}

async function main() {
  const inputs = process.argv.slice(2);
  if (inputs.length === 0) {
    console.error('Usage: npm run photos -- "<folder or file>" [...]');
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const files = (await Promise.all(inputs.map(collect))).flat();

  for (const file of files) {
    const name = path.basename(file).replace(/\.jpe?g$/i, ".jpg");
    const out = path.join(OUT_DIR, name);

    const before = (await stat(file)).size;
    await sharp(file)
      .rotate() // bake in EXIF orientation before metadata is stripped
      .resize(MAX_WIDTH, MAX_HEIGHT, { fit: "inside", withoutEnlargement: true })
      .withIccProfile("srgb")
      // 4:4:4 keeps fine colour detail (moss, foliage) that 4:2:0 smears
      .jpeg({ quality: QUALITY, mozjpeg: true, chromaSubsampling: "4:4:4" })
      .toFile(out);
    const after = (await stat(out)).size;

    const mb = n => (n / 1024 / 1024).toFixed(1);
    console.log(`${name.padEnd(28)} ${mb(before).padStart(6)} MB → ${mb(after)} MB`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
