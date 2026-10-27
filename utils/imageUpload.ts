/**
 * Prepares a photo for upload. Normal photos go up untouched: the server does the one and only
 * resize/compress, and keeps the photo's colours. Re-saving in the browser first would compress
 * twice and drop the colour profile, which is what made uploads look soft and dull.
 *
 * The browser only steps in for files the server can't take as they are:
 *  - iPhone HEIC/HEIF photos (converted to a high-quality JPEG)
 *  - very large files (over 12 MB; the server limit is 15 MB)
 * Falls back to the original file if the browser can't decode it.
 */
const CONVERT_ABOVE_BYTES = 12 * 1024 * 1024;
const MAX_EDGE = 3200;

const isHeic = (file: File) => /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);

export async function shrinkImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/") && !isHeic(file)) return file;
  if (file.type === "image/gif") return file;
  if (!isHeic(file) && file.size <= CONVERT_ABOVE_BYTES) return file;

  try {
    // imageOrientation: "from-image" applies EXIF rotation so the canvas is upright.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    // Draw in the wide (Display P3) colour space where the browser supports it, so phone
    // photos keep their colours through the conversion.
    const ctx = (canvas.getContext("2d", { colorSpace: "display-p3" } as CanvasRenderingContext2DSettings) ||
      canvas.getContext("2d")) as CanvasRenderingContext2D | null;
    if (!ctx) return file;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const keepAlpha = file.type === "image/png" || file.type === "image/webp";
    const type = keepAlpha ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.95));
    if (!blob) return file;
    if (!isHeic(file) && blob.size >= file.size) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.${type === "image/png" ? "png" : "jpg"}`, { type });
  } catch {
    return file;
  }
}
