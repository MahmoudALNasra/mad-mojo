/** Client-side resize + WebP encode so uploads stay small (no Vercel Image Opt). */

const MAX_EDGE = 1600;
const WEBP_QUALITY = 0.82;

export async function fileToWebp(file: File): Promise<{ blob: Blob; name: string }> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create canvas context");
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("WebP encode failed"))),
        "image/webp",
        WEBP_QUALITY
      );
    });

    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    return { blob, name: `${base}.webp` };
  } finally {
    bitmap.close();
  }
}
