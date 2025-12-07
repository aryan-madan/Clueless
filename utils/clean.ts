
import { pipeline, env, RawImage } from '@xenova/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

let pipe: any = null;

const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
};

const hslToRgb = (h: number, s: number, l: number) => {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

const optimizeColor = (r: number, g: number, b: number) => {
  const [h, s, l] = rgbToHsl(r, g, b);

  if (s < 0.15 || l < 0.15 || l > 0.9) {
    return "#A1A1AA"; 
  }

  const newL = 0.6;
  const newS = Math.max(s, 0.4); 
  
  const [nR, nG, nB] = hslToRgb(h, newS, newL);
  return rgbToHex(nR, nG, nB);
};

export const fix = async (blob: Blob): Promise<{ blob: Blob; color: string }> => {
  try {
    if (!pipe) {
      pipe = await pipeline('image-segmentation', 'Xenova/segformer_b2_clothes', {
        quantized: true,
      });
    }

    const url = URL.createObjectURL(blob);
    const img = await RawImage.fromURL(url);
    
    const output = await pipe(img);
    
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('ctx');

    ctx.drawImage(img.toCanvas(), 0, 0);
    const data = ctx.getImageData(0, 0, img.width, img.height);
    const pixels = data.data;

    const combined = new Uint8Array(img.width * img.height);
    let found = false;

    const keep = [
      'Upper-clothes', 'Skirt', 'Pants', 'Dress', 'Belt', 
      'Left-shoe', 'Right-shoe', 'Bag', 'Scarf', 'Hat', 'Sunglasses'
    ];

    let rSum = 0, gSum = 0, bSum = 0, count = 0;

    for (const seg of output) {
      if (keep.includes(seg.label)) {
        found = true;
        const mask = seg.mask;
        for (let i = 0; i < combined.length; i++) {
          if (mask.data[i] > 0) combined[i] = 255;
        }
      }
    }

    if (!found) {
      URL.revokeObjectURL(url);
      return { blob, color: '#A1A1AA' };
    }

    for (let i = 0; i < combined.length; i++) {
      const idx = i * 4;
      const alpha = combined[i];
      pixels[idx + 3] = alpha;

      if (alpha > 200) {
        rSum += pixels[idx];
        gSum += pixels[idx + 1];
        bSum += pixels[idx + 2];
        count++;
      }
    }

    let hex = '#A1A1AA'; 
    if (count > 0) {
      const r = Math.round(rSum / count);
      const g = Math.round(gSum / count);
      const b = Math.round(bSum / count);
      hex = optimizeColor(r, g, b);
    }

    ctx.putImageData(data, 0, 0);
    
    URL.revokeObjectURL(url);
    
    const processedBlob = await new Promise<Blob | null>(r => canvas.toBlob(b => r(b), 'image/png'));
    
    return { 
      blob: processedBlob || blob, 
      color: hex 
    };

  } catch (e) {
    console.error('bg removal error', e);
    return { blob, color: '#A1A1AA' };
  }
};

export const base = (blob: Blob): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
};