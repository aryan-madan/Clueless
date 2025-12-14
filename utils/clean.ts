
import { removeBackground, Config } from '@imgly/background-removal';

let initPromise: Promise<void> | null = null;


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

const resizeImage = (blob: Blob, maxWidth: number = 1024): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                let w = img.width;
                let h = img.height;
                
                if (w > maxWidth || h > maxWidth) {
                    const ratio = Math.min(maxWidth / w, maxWidth / h);
                    w = Math.floor(w * ratio);
                    h = Math.floor(h * ratio);
                }
                
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    URL.revokeObjectURL(url);
                    reject(new Error("Canvas context failed"));
                    return;
                }
                
                ctx.drawImage(img, 0, 0, w, h);
                
                canvas.toBlob((b) => {
                    URL.revokeObjectURL(url);
                    if (b) resolve(b);
                    else reject(new Error("Canvas encoding failed"));
                }, 'image/jpeg', 0.9);
            } catch (e) {
                URL.revokeObjectURL(url);
                reject(e);
            }
        };
        img.onerror = (e) => {
            URL.revokeObjectURL(url);
            reject(new Error("Image load failed"));
        };
        img.src = url;
    });
};

export const downloadModel = (onProgress: (percent: number) => void): Promise<void> => {
    if (initPromise) return initPromise;
    
    initPromise = (async () => {
        try {
            console.log("Initializing Img.ly Model...");
            const pixel = await fetch("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==").then(r => r.blob());
            
            await removeBackground(pixel, {
                progress: (key: string, current: number, total: number) => {
                    const p = Math.round((current / total) * 100);
                    onProgress(p);
                },
                debug: true
            });
            
            onProgress(100);
            console.log("Model loaded.");
        } catch (e) {
            console.error("Failed to load model:", e);
        }
    })();
    
    return initPromise;
};

export const warmup = async () => {
    if (!initPromise) {
        downloadModel(() => {});
    }
    return initPromise;
};

export const fix = async (originalBlob: Blob): Promise<{ blob: Blob; color: string; category: string }> => {
  try {
    const blob = await resizeImage(originalBlob, 1024);
    
    await warmup();

    const transparentBlob = await removeBackground(blob, {
         output: { format: 'image/png', quality: 0.8 },
         progress: (key, current, total) => {}
    });

    const imgBitmap = await createImageBitmap(transparentBlob);
    const w = imgBitmap.width;
    const h = imgBitmap.height;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error("Ctx failed");

    ctx.drawImage(imgBitmap, 0, 0);

    const pixelData = ctx.getImageData(0, 0, w, h).data;
    const buckets: Record<string, any> = {};

    const stride = 10;
    for (let i = 0; i < w * h; i += stride) {
        const r = pixelData[i * 4];
        const g = pixelData[i * 4 + 1];
        const b = pixelData[i * 4 + 2];
        const a = pixelData[i * 4 + 3];

        if (a > 128) {
            const [h, s, l] = rgbToHsl(r, g, b);
            
            if (s > 0.1 && l > 0.15 && l < 0.9) {
                const bucket = Math.floor(h * 6);
                const key = `h-${bucket}`;
                if (!buckets[key]) buckets[key] = { r:0, g:0, b:0, count:0 };
                buckets[key].r += r;
                buckets[key].g += g;
                buckets[key].b += b;
                buckets[key].count++;
            }
        }
    }

    let maxCount = 0;
    let finalHex = '#71717a';
    let dominant = null;
    
    for (const k in buckets) {
        if (buckets[k].count > maxCount) {
            maxCount = buckets[k].count;
            dominant = buckets[k];
        }
    }

    if (dominant) {
        const dr = Math.round(dominant.r / dominant.count);
        const dg = Math.round(dominant.g / dominant.count);
        const db = Math.round(dominant.b / dominant.count);
        finalHex = optimizeColorForUI(dr, dg, db);
    }

    return { 
        blob: transparentBlob, 
        color: finalHex, 
        category: 'Top' 
    };

  } catch (e) {
    console.error('AI Error Detail:', e);
    const fallback = await resizeImage(originalBlob, 1024).catch(() => originalBlob);
    return { blob: fallback, color: '#ef4444', category: 'Other' };
  }
};

export const base = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (typeof reader.result === 'string') {
            resolve(reader.result);
        } else {
            reject(new Error("Failed to convert blob to base64"));
        }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
