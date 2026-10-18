/**
 * Shrinks a photo in the browser before it is uploaded, so a 6 MB phone photo goes up as a
 * few hundred KB (much faster on mobile data). The server still does the final resize/crop;
 * this only caps the long edge. Falls back to the original file if the browser can't decode it.
 */
const MAX_EDGE = 2000;
const SKIP_BELOW_BYTES = 400 * 1024;

export async function shrinkImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.size < SKIP_BELOW_BYTES) {
    return file;
  }
  try {
    // imageOrientation: "from-image" applies EXIF rotation so the canvas is upright.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const keepAlpha = file.type === "image/png" || file.type === "image/webp";
    const type = keepAlpha ? "image/webp" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
    if (!blob || blob.size >= file.size) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.${type === "image/webp" ? "webp" : "jpg"}`, { type });
  } catch {
    return file;
  }
}
