import * as ort from 'onnxruntime-web';
import { removeBackground } from '@imgly/background-removal';

const WASM_PATH = (typeof window !== 'undefined' ? window.location.origin : '') + '/wasm/';
ort.env.wasm.wasmPaths = WASM_PATH;

ort.env.wasm.numThreads = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 4;

(ort.env as any).webgpu = {
  powerPreference: 'high-performance',
};

const MODEL_URL = '/ml/onnx/model.onnx';

const isMobile = () => {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const MODEL_INPUT_SIZE = 1024;

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

const getCanvas = (w: number, h: number) => {
    if (typeof OffscreenCanvas !== 'undefined') {
        return new OffscreenCanvas(w, h);
    }
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
};

class ModelManager {
  private static instance: ModelManager;
  private session: ort.InferenceSession | null = null;
  private initPromise: Promise<void> | null = null;
  private queue: Promise<any> = Promise.resolve();

  private constructor() {}

  public static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }

  public async init(onProgress: (percent: number) => void) {
    if (this.session) {
      onProgress(100);
      return;
    }
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const response = await fetch(MODEL_URL);
        if (!response.ok) throw new Error(`Failed to fetch model: ${response.statusText}`);
        
        const contentLength = +response.headers.get('Content-Length')!;
        const reader = response.body?.getReader();
        
        if (!reader) throw new Error("No body reader");

        let receivedLength = 0;
        const chunks = [];

        while(true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
              chunks.push(value);
              receivedLength += value.length;
              if (contentLength) {
                  const progress = Math.min(99, Math.round((receivedLength / contentLength) * 100));
                  onProgress(progress);
              }
          }
        }

        const modelArrayBuffer = new Uint8Array(receivedLength);
        let position = 0;
        for(const chunk of chunks) {
          modelArrayBuffer.set(chunk, position);
          position += chunk.length;
        }

        const providers = isMobile() ? ['wasm'] : ['webgpu', 'wasm'];

        try {
            this.session = await ort.InferenceSession.create(modelArrayBuffer, {
                executionProviders: providers,
                graphOptimizationLevel: 'all'
            });
        } catch (error) {
            console.error(error);
            if (providers.includes('webgpu')) {
                 this.session = await ort.InferenceSession.create(modelArrayBuffer, {
                    executionProviders: ['wasm'],
                    graphOptimizationLevel: 'all'
                });
            } else {
                throw error;
            }
        }
        
        onProgress(100);

      } catch (e) {
        this.initPromise = null;
        throw e;
      }
    })();

    return this.initPromise;
  }

  public getSession() {
    return this.session;
  }

  public async run(feeds: Record<string, ort.Tensor>): Promise<ort.InferenceSession.OnnxValueMapType> {
      if (!this.session) throw new Error("Model not initialized");

      const result = this.queue.then(async () => {
          return await this.session!.run(feeds);
      });

      this.queue = result.catch(() => {});
      return result;
  }
}

const getImageData = (image: ImageBitmap | HTMLImageElement, width: number, height: number): ImageData => {
  const canvas = getCanvas(width, height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true }) as any; 
  if (!ctx) throw new Error("Canvas context failed");
  ctx.drawImage(image, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
};

const preprocess = (imageData: ImageData): ort.Tensor => {
  const { data, width, height } = imageData;
  const size = width * height;
  const tensorData = new Float32Array(1 * 3 * size);

  for (let i = 0; i < size; i++) {
    const r = data[i * 4] / 255.0;
    const g = data[i * 4 + 1] / 255.0;
    const b = data[i * 4 + 2] / 255.0;

    tensorData[i] = (r - 0.5) / 0.5;
    tensorData[i + size] = (g - 0.5) / 0.5;
    tensorData[i + 2 * size] = (b - 0.5) / 0.5;
  }

  return new ort.Tensor('float32', tensorData, [1, 3, height, width]);
};

export const downloadModel = async (onProgress: (percent: number) => void): Promise<void> => {
    await ModelManager.getInstance().init(onProgress);
};

export const warmup = async () => {
    downloadModel(() => {});
};

const analyzeColor = async (blob: Blob): Promise<string> => {
    const bitmap = await createImageBitmap(blob);
    const w = bitmap.width;
    const h = bitmap.height;
    
    const max = 256;
    let rw = w, rh = h;
    if (w > max || h > max) {
        const r = Math.min(max / w, max / h);
        rw = Math.floor(w * r);
        rh = Math.floor(h * r);
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = rw;
    canvas.height = rh;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return '#f4f4f5';

    ctx.drawImage(bitmap, 0, 0, rw, rh);
    const data = ctx.getImageData(0, 0, rw, rh).data;
    
    const buckets: Record<string, any> = {};
    const stride = 4;
    
    for (let i = 0; i < data.length; i += 4 * stride) {
        const a = data[i + 3];
        if (a < 128) continue; 

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        const [h, s, l] = rgbToHsl(r, g, b);
        
        if (s > 0.05 && l > 0.1 && l < 0.95) {
            const bucket = Math.floor(h * 12); 
            const key = `h-${bucket}`;
            if (!buckets[key]) buckets[key] = { r:0, g:0, b:0, count:0 };
            buckets[key].r += r;
            buckets[key].g += g;
            buckets[key].b += b;
            buckets[key].count++;
        }
    }
    
    let maxCount = 0;
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
        return optimizeColorForUI(dr, dg, db);
    }
    
    return '#71717a';
};

const fixOnnx = async (originalBlob: Blob): Promise<{ blob: Blob; color: string }> => {
  const manager = ModelManager.getInstance();
  let session = manager.getSession();

  if (!session) {
      try {
        await manager.init(() => {}); 
        session = manager.getSession();
      } catch (e) {
          console.error(e);
      }
      if (!session) throw new Error("Model not initialized");
  }

  const imgBitmap = await createImageBitmap(originalBlob);
  const modelInputData = getImageData(imgBitmap, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
  
  const inputTensor = preprocess(modelInputData);
  const feeds = { [session.inputNames[0]]: inputTensor };
  
  const results = await manager.run(feeds);
  const mask = results[session.outputNames[0]]; 
  const maskData = mask.data as Float32Array;

  const MAX_OUTPUT_SIZE = 1024;
  let outW = imgBitmap.width;
  let outH = imgBitmap.height;
  
  if (outW > MAX_OUTPUT_SIZE || outH > MAX_OUTPUT_SIZE) {
      const ratio = Math.min(MAX_OUTPUT_SIZE / outW, MAX_OUTPUT_SIZE / outH);
      outW = Math.floor(outW * ratio);
      outH = Math.floor(outH * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if(!ctx) throw new Error("Canvas init failed");

  ctx.drawImage(imgBitmap, 0, 0, outW, outH);

  const imageData = ctx.getImageData(0, 0, outW, outH);
  const pixelData = imageData.data;

  for (let y = 0; y < outH; y++) {
      for (let x = 0; x < outW; x++) {
          const mx = Math.floor((x / outW) * MODEL_INPUT_SIZE);
          const my = Math.floor((y / outH) * MODEL_INPUT_SIZE);
          
          const maskIdx = my * MODEL_INPUT_SIZE + mx;
          let alpha = maskData[maskIdx];
          
          if (alpha < 0.1) alpha = 0;
          else if (alpha > 0.8) alpha = 1;
          
          const imgIdx = (y * outW + x) * 4;
          pixelData[imgIdx + 3] = Math.floor(alpha * 255);
      }
  }

  ctx.putImageData(imageData, 0, 0);
  
  const finalBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png');
  });

  const color = await analyzeColor(finalBlob);
  return { blob: finalBlob, color };
};

const fixImgly = async (originalBlob: Blob): Promise<{ blob: Blob; color: string }> => {
    const blob = await removeBackground(originalBlob, {
        progress: (key, current, total) => {},
    });
    const color = await analyzeColor(blob);
    return { blob, color };
};

export const fix = async (originalBlob: Blob, engine: 'onnx' | 'imgly' = 'onnx'): Promise<{ blob: Blob; color: string; category: string }> => {
  try {
    const processor = engine === 'imgly' ? fixImgly : fixOnnx;
    const result = await processor(originalBlob);
    return { ...result, category: 'Top' };
  } catch (e) {
    console.error(e);
    return { blob: originalBlob, color: '#ef4444', category: 'Other' };
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