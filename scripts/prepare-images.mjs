/**
 * Copies product photos from the raw "Mad Mojo _" folder into /public/products,
 * resized and compressed for the web (max 1600px, WebP q82).
 *
 * Usage: npm run prepare-images [-- --source "C:\path\to\Mad Mojo _"]
 */
import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

const argSource = process.argv.indexOf("--source");
const SOURCE =
  argSource !== -1
    ? process.argv[argSource + 1]
    : "C:\\Users\\laalg\\Downloads\\Mad Mojo _";

const OUT = path.join(process.cwd(), "public", "products");
const MAX = 1600;

/** slug -> list of source images (relative to SOURCE), output ordered 1.jpg, 2.jpg ... */
const MAP = {
  "the-cockatoo": ["Print Photos-Mocks/Sesja MAD PRFNK-1.jpg"],
  "parrots-in-love": [
    "Print Photos-Mocks/papugii instai.jpg",
    "Print Photos-Mocks/papugi.jpg",
    "Print Photos-Mocks/papugi2.jpg",
  ],
  "the-monkey-king": [
    "Print Photos-Mocks/ma.jpg",
    "Print Photos-Mocks/malp.jpg",
  ],
  "st-pigeon": [
    "Print Photos-Mocks/gol.jpg",
    "Prints/Pigeon (St. Pigeon).jpg",
  ],
  "golden-cobra": ["Prints/(Golden Cobra).jpeg"],
  "the-tempest": ["Print Photos-Mocks/PUMA.jpeg"],
  "neba-tiger": [
    "Print Photos-Mocks/tiger.jpg",
    "Print Photos-Mocks/tig.jpg",
    "Prints/Neba Tiger (Idk what title to put).jpg",
  ],
  "the-heron": [
    "Print Photos-Mocks/CZAPLA.jpg",
    "Prints/Jungle (HUMDRUM XIV).jpg",
  ],
  "cat-eye": ["Print Photos-Mocks/kot oko.jpg"],
  "mirrors": ["Print Photos-Mocks/mirrors.jpg"],
  "the-bridge": ["Print Photos-Mocks/most.jpg"],
  "weird-boy": [
    "Print Photos-Mocks/hum V.jpg",
    "Prints/Weird Boy (HUMDRUM V).jpg",
  ],
  "yolo-cat": [
    "Print Photos-Mocks/Sesja MAD PRFNK-118.jpg",
    "Print Photos-Mocks/Sesja MAD PRFNK-116.jpg",
  ],
  "superius": ["Prints/SUPERIUS (Humdrum III).jpg"],
  "medicine": ["Prints/Medicine (HUMDRUM IV).jpg"],
  "the-rooster": ["Prints/Cock (Humdrum XVI).jpg"],
  "mustard-cat": ["Prints/Mustard Cat (Humdrum XVII).jpg"],
  "humdrum-vii": ["Prints/(HUMDRUM VII).jpg"],
  "jacket-tiger": ["Prints/Jacket Tiger.jpg"],
  "kimono-blue-ginkgo": [
    "Clothes Photos/Kimono Blue/Sesja MAD PRFNK-10.jpg",
    "Clothes Photos/Kimono Blue/Sesja MAD PRFNK-12.jpg",
    "Clothes Photos/Kimono Blue/Sesja MAD PRFNK-16.jpg",
    "Clothes Photos/Kimono Blue/Sesja MAD PRFNK-22.jpg",
    "Clothes Photos/Kimono Blue/Sesja MAD PRFNK-30.jpg",
  ],
  "kimono-crane": [
    "Clothes Photos/Kimono Crane/Sesja MAD PRFNK-87.jpg",
    "Clothes Photos/Kimono Crane/Sesja MAD PRFNK-92.jpg",
    "Clothes Photos/Kimono Crane/Sesja MAD PRFNK-97.jpg",
    "Clothes Photos/Kimono Crane/Sesja MAD PRFNK-103.jpg",
    "Clothes Photos/Kimono Crane/Sesja MAD PRFNK-110.jpg",
  ],
  "kimono-parrot": [
    "Clothes Photos/Kimono Parrot/Sesja MAD PRFNK-62.jpg",
    "Clothes Photos/Kimono Parrot/Sesja MAD PRFNK-66.jpg",
    "Clothes Photos/Kimono Parrot/Sesja MAD PRFNK-71.jpg",
    "Clothes Photos/Kimono Parrot/Sesja MAD PRFNK-77.jpg",
    "Clothes Photos/Kimono Parrot/Sesja MAD PRFNK-83.jpg",
  ],
  "jungle-heart-tee": [
    "Clothes Photos/Tshirt/Sesja MAD PRFNK-40.jpg",
    "Clothes Photos/Tshirt/Sesja MAD PRFNK-44.jpg",
    "Clothes Photos/Tshirt/Sesja MAD PRFNK-49.jpg",
    "Clothes Photos/Tshirt/Sesja MAD PRFNK-53.jpg",
    "Clothes Photos/Tshirt/Sesja MAD PRFNK-58.jpg",
  ],
  // hero / lifestyle shots used on the home page and about page
  "_site": [
    "Print Photos-Mocks/Sesja MAD PRFNK-2.jpg",
    "Print Photos-Mocks/Sesja MAD PRFNK-3.jpg",
    "Print Photos-Mocks/Sesja MAD PRFNK-115.jpg",
    "Print Photos-Mocks/Sesja MAD PRFNK-117.jpg",
    "Print Photos-Mocks/tukan.jpg",
  ],
};

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

let ok = 0;
let missing = 0;
for (const [slug, files] of Object.entries(MAP)) {
  const dir = path.join(OUT, slug);
  await mkdir(dir, { recursive: true });
  let i = 0;
  for (const rel of files) {
    i += 1;
    const src = path.join(SOURCE, rel);
    if (!(await exists(src))) {
      console.warn(`MISSING  ${src}`);
      missing += 1;
      continue;
    }
    const out = path.join(dir, `${i}.webp`);
    try {
      await sharp(src, { limitInputPixels: 1e9 })
        .rotate()
        .resize(MAX, MAX, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(out);
      ok += 1;
      console.log(`OK  ${slug}/${i}.webp`);
    } catch (err) {
      console.error(`FAIL  ${src}: ${err.message}`);
      missing += 1;
    }
  }
}
console.log(`\nDone. ${ok} images written to public/products, ${missing} skipped.`);
