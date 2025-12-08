
import { removeBackground } from '@imgly/background-removal';

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

const optimizeColorForUI = (r: number, g: number, b: number) => {
  const [h, s, l] = rgbToHsl(r, g, b);

  const newS = Math.max(s, 0.6);
  
  const newL = 0.6; 
  
  const [nR, nG, nB] = hslToRgb(h, newS, newL);
  return rgbToHex(nR, nG, nB);
};

export const fix = async (blob: Blob): Promise<{ blob: Blob; color: string; category: string }> => {
  try {
    const processedBlob = await removeBackground(blob, {
       model: 'medium',
       progress: (key, current, total) => {
       }
    });

    const url = URL.createObjectURL(processedBlob);
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('ctx');

    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, img.width, img.height);
    const pixels = data.data;

    const buckets: Record<string, { r: number, g: number, b: number, count: number }> = {};
    const grayscale = { r:0, g:0, b:0, count:0 };
    
    for (let i = 0; i < pixels.length; i += 4) {
      const alpha = pixels[i + 3];
      if (alpha < 128) continue;

      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const [h, s, l] = rgbToHsl(r, g, b);

      if (s < 0.15 || l < 0.15 || l > 0.85) {
        grayscale.r += r;
        grayscale.g += g;
        grayscale.b += b;
        grayscale.count++;
      } else {
        const bucketIndex = Math.floor(h * 18);
        const key = `h-${bucketIndex}`;
        
        if (!buckets[key]) buckets[key] = { r: 0, g: 0, b: 0, count: 0 };
        buckets[key].r += r;
        buckets[key].g += g;
        buckets[key].b += b;
        buckets[key].count++;
      }
    }

    URL.revokeObjectURL(url);

    let maxCount = 0;
    let dominantColor = null;

    for (const key in buckets) {
      if (buckets[key].count > maxCount) {
        maxCount = buckets[key].count;
        dominantColor = buckets[key];
      }
    }

    let finalHex = '#71717a'; 

    const totalColored = Object.values(buckets).reduce((acc, v) => acc + v.count, 0);
    const totalOpaque = totalColored + grayscale.count;

    if (dominantColor && (dominantColor.count > totalOpaque * 0.05)) {
        const avgR = Math.round(dominantColor.r / dominantColor.count);
        const avgG = Math.round(dominantColor.g / dominantColor.count);
        const avgB = Math.round(dominantColor.b / dominantColor.count);
        finalHex = optimizeColorForUI(avgR, avgG, avgB);
    } else {
        finalHex = '#71717a';
    }

    return { 
      blob: processedBlob, 
      color: finalHex,
      category: 'Top' 
    };

  } catch (e) {
    console.error('bg removal error', e);
    return { blob, color: '#71717a', category: 'Other' };
  }
};

export const base = (blob: Blob): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
};
