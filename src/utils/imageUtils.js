/**
 * Client-side image preprocessing for profile photos.
 *
 * Phones routinely produce 3-5 MB camera photos with way more pixels than
 * a 44 px avatar will ever need. We resize down to a sensible max edge and
 * re-encode as JPEG so:
 *   * upload is fast even on weak connections
 *   * the backend disk footprint stays tiny
 *   * we strip EXIF (including GPS) for privacy
 *
 * On any decode failure (HEIC/unrecognised format, etc.) we fall back to
 * the original file rather than blocking the upload — the backend still
 * validates content type and size.
 */
export async function compressImage(
  file,
  { maxEdge = 800, quality = 0.85 } = {}
) {
  if (!file || !file.type?.startsWith('image/')) return file;

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Some browsers/codecs (HEIC on desktop) refuse to decode — let the
    // backend deal with the original.
    return file;
  }

  const { width: w0, height: h0 } = bitmap;
  let w = w0;
  let h = h0;
  if (Math.max(w, h) > maxEdge) {
    if (w >= h) {
      h = Math.round((maxEdge / w) * h);
      w = maxEdge;
    } else {
      w = Math.round((maxEdge / h) * w);
      h = maxEdge;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality)
  );
  if (!blob) return file;

  return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
}
