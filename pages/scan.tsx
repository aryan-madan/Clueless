
import React, { useState, useEffect } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { fix, base } from '../utils/clean';
import { write } from '../store';
import { Props } from '../types';

interface ScanProps extends Props {
  file: File | null;
  resetFile?: () => void;
}

export const Scan = ({ file, done, resetFile }: ScanProps) => {
  const [img, setImg] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true); 
  const [closing, setClosing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (file) {
      processFile(file);
    }
    return () => {
      if (img) URL.revokeObjectURL(img);
    };
  }, []);

  const processFile = async (f: File) => {
    const url = URL.createObjectURL(f);
    setImg(url);
    setProcessing(true);
    setSuccess(false);

    const start = Date.now();

    try {
      const result = await fix(f);
      const raw = await base(result.blob);
      const processedUrl = URL.createObjectURL(result.blob);
      
      const elapsed = Date.now() - start;
      const minTime = 1500;
      if (elapsed < minTime) {
        await new Promise(r => setTimeout(r, minTime - elapsed));
      }
      
      setImg(processedUrl); 
      setProcessing(false);
      setSuccess(true);
      
      (window as any).tempProcessedImage = raw; 
      (window as any).tempProcessedColor = result.color;

    } catch (err) {
      console.error(err);
      setProcessing(false);
    }
  };

  const handleSave = async () => {
    if (processing) return;
    setSaving(true);
    const raw = (window as any).tempProcessedImage;
    const color = (window as any).tempProcessedColor;
    
    setTimeout(async () => {
      if (raw) {
        await write({
          id: crypto.randomUUID(),
          src: raw,
          color: color || '#f4f4f5',
          at: Date.now()
        });
        if (done) done();
      }
    }, 450);
  };

  const handleRetake = () => {
    setClosing(true);
    setTimeout(() => {
      if (resetFile) resetFile();
    }, 450);
  };

  if (!file) return null;

  return (
    <div 
      className={`
        fixed inset-0 z-50 bg-white dark:bg-black overflow-hidden flex flex-col
        ${closing ? 'animate-slide-out-down' : ''}
        ${saving ? 'animate-slide-out-right' : ''}
        ${!closing && !saving ? 'animate-slide-up' : ''}
      `}
    >
      <header className="pt-16 pb-2 px-6 flex-shrink-0 z-10 bg-white/50 dark:bg-black/50 backdrop-blur-sm">
        <div className="flex items-baseline justify-between border-b border-zinc-100 dark:border-zinc-900 pb-4">
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
            Review
          </h1>
          <span className="text-zinc-400 font-mono text-xs">
            NEW ITEM
          </span>
        </div>
      </header>

      <div className="flex-1 w-full min-h-0 flex flex-col items-center justify-center relative px-6 py-4">
        <div className={`
          relative w-full h-full max-h-[65vh] aspect-[3/4] flex items-center justify-center 
          transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
          ${processing ? 'rounded-none bg-transparent scale-95' : 'bg-zinc-50 dark:bg-zinc-900 rounded-[36px] scale-100'}
        `}>
          {img && (
            <img 
              src={img} 
              className={`
                w-full h-full object-contain select-none transition-all duration-500
                ${processing ? 'animate-pulse-soft opacity-80' : 'p-8'}
                ${success ? 'animate-pop-in' : ''}
              `}
              alt="preview" 
              draggable={false}
            />
          )}
        </div>
      </div>

      <div className={`
        px-6 pb-safe mb-6 w-full z-20 flex items-center gap-4 flex-shrink-0 
        transition-all duration-700 delay-100 ease-[cubic-bezier(0.23,1,0.32,1)]
        ${!processing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}
      `}>
          <button 
            onClick={handleRetake}
            className="flex-1 h-14 rounded-full bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white font-medium hover:bg-zinc-200 dark:hover:bg-zinc-800 active-shrink text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw size={18} />
            Discard
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 h-14 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold flex items-center justify-center gap-2 text-sm shadow-xl active-shrink transition-colors"
          >
            Save Item <ArrowRight size={18} />
          </button>
      </div>
    </div>
  );
};