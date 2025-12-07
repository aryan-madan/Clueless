import { pipeline, env, RawImage } from '@xenova/transformers';

// config
env.allowLocalModels = false;
env.useBrowserCache = true;

let pipe: any = null;

export const fix = async (blob: Blob): Promise<Blob> => {
  try {
    if (!pipe) {
      // specialized model for clothes segmentation
      // this is public and works well for wardrobe apps
      pipe = await pipeline('image-segmentation', 'Xenova/segformer_b2_clothes', {
        quantized: true,
      });
    }

    const url = URL.createObjectURL(blob);
    const img = await RawImage.fromURL(url);
    
    // run inference
    const output = await pipe(img);
    
    // canvas setup
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('ctx');

    // draw original
    ctx.drawImage(img.toCanvas(), 0, 0);
    const data = ctx.getImageData(0, 0, img.width, img.height);
    const pixels = data.data;

    // create a combined mask for all clothing items
    // we want to keep clothes, but remove background (0) and body parts (face, arms, legs)
    const combined = new Uint8Array(img.width * img.height);
    let found = false;

    // valid labels for wardrobe
    const keep = [
      'Upper-clothes', 'Skirt', 'Pants', 'Dress', 'Belt', 
      'Left-shoe', 'Right-shoe', 'Bag', 'Scarf', 'Hat', 'Sunglasses'
    ];

    // iterate through all segments
    for (const seg of output) {
      if (keep.includes(seg.label)) {
        found = true;
        const mask = seg.mask;
        // merge mask
        for (let i = 0; i < combined.length; i++) {
          if (mask.data[i] > 0) combined[i] = 255;
        }
      }
    }

    // if no clothes detected, return original (fallback)
    if (!found) {
      URL.revokeObjectURL(url);
      return blob;
    }

    // apply mask to alpha channel
    for (let i = 0; i < combined.length; i++) {
      const idx = i * 4;
      // smooth edges slightly by taking the raw mask value if needed, 
      // but here we have a binary map from the accumulation
      pixels[idx + 3] = combined[i];
    }

    ctx.putImageData(data, 0, 0);
    
    // cleanup
    URL.revokeObjectURL(url);
    
    return new Promise(r => canvas.toBlob(b => r(b || blob), 'image/png'));

  } catch (e) {
    console.error('bg removal error', e);
    return blob;
  }
};

export const base = (blob: Blob): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
};