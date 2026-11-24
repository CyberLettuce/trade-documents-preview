const imageTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
const uploadLimit = 20 * 1024 * 1024;
const storedLimit = 600 * 1024;

export const dashboardImageHint = 'PNG, JPEG or WebP · up to 20 MB';
export const featureDashboardImageLabel = 'Feature on Exporter dashboard';

export function dashboardImageIsValid(value) {
  const comma = typeof value === 'string' ? value.indexOf(',') : -1;
  if (comma < 0) return false;
  const type = value.slice(0, comma), data = value.slice(comma + 1);
  return /^data:image\/(png|jpeg|webp);base64$/.test(type || '') && !!data &&
    data.length <= Math.ceil(storedLimit / 3) * 4 && /^[A-Za-z0-9+/]+={0,2}$/.test(data);
}

export function featuredDashboardImage(blocks) {
  return blocks.find(block => block.type === 'image' && block.featured && dashboardImageIsValid(block.image));
}

export function featureDashboardImage(blocks, id, selected) {
  return blocks.map(block => block.type !== 'image' ? block : block.id === id || (selected && block.featured)
    ? {...block, featured: selected && block.id === id}
    : block);
}

function dataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function prepareDashboardImage(file) {
  if (!imageTypes.has(file.type) || file.size > uploadLimit) throw Error('Choose a PNG, JPEG or WebP image up to 20 MB.');
  const url = URL.createObjectURL(file);
  const image = new Image();
  try {
    image.src = url;
    await image.decode();
    const {naturalWidth: width, naturalHeight: height} = image;
    if (!width || !height) throw Error();
    if (file.size <= storedLimit && Math.max(width, height) <= 2560) return await dataUrl(file);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const type = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp';
    let scale = Math.min(1, 2560 / Math.max(width, height));
    for (let attempt = 0; attempt < 6; attempt++, scale *= 0.76) {
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.9, 0.75, 0.6]) {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, type, quality));
        if (blob && blob.size <= storedLimit) return await dataUrl(blob);
        if (blob?.type === 'image/png') break;
      }
    }
  } catch {
    throw Error('This image could not be opened. Please choose another image.');
  } finally {
    URL.revokeObjectURL(url);
  }
  throw Error('This image could not be made small enough to save. Try a less detailed image.');
}
