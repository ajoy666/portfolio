const MAX_FILE_SIZE = 3 * 1024 * 1024;
const MAX_DIMENSION = 2000;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

/**
 * Downscale + re-encode gambar sampai ukurannya di bawah maxSize.
 * PNG tetap PNG (biar transparansi gak ilang), tipe lain di-convert
 * ke JPEG karena kompresinya jauh lebih efisien untuk foto/screenshot.
 */
export async function compressImageFile(file, maxSize = MAX_FILE_SIZE) {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file; // bukan raster image, skip
  }

  if (file.size <= maxSize) {
    return file; // udah muat, gak perlu diapa-apain
  }

  const img = await loadImage(file);
  URL.revokeObjectURL(img.src);

  const keepPng = file.type === 'image/png';
  const outputType = keepPng ? 'image/png' : 'image/jpeg';
  const outputExt = keepPng ? 'png' : 'jpg';

  let scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  let quality = 0.9;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, outputType, keepPng ? undefined : quality);

    if (blob && (blob.size <= maxSize || attempt === 7)) {
      const newName = file.name.replace(/\.[^.]+$/, '') + `.${outputExt}`;
      return new File([blob], newName, { type: outputType, lastModified: Date.now() });
    }

    // Belum cukup kecil: PNG cuma bisa dikecilin dimensinya,
    // JPEG bisa juga diturunin quality-nya dulu.
    if (keepPng) {
      scale *= 0.8;
    } else if (quality > 0.4) {
      quality -= 0.15;
    } else {
      scale *= 0.8;
      quality = 0.7;
    }
  }

  return file; // fallback, harusnya gak pernah kesampe sini
}

export async function compressImageFiles(files, maxSize = MAX_FILE_SIZE) {
  const results = [];
  for (const file of files) {
    results.push(await compressImageFile(file, maxSize));
  }
  return results;
}
