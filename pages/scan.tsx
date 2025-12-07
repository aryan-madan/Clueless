
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import { fix, base } from '../utils/clean';
import { write } from '../store';
import { Props } from '../types';

interface ScanProps extends Props {
  file: File | null;
  resetFile?: () => void;
}

export const Scan = ({ file, done, resetFile }: ScanProps) => {
  const [img, setImg] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [waitingForSave, setWaitingForSave] = useState(false);
  const [processed, setProcessed] = useState(false);
  
  const resultRef = useRef<{ blob: Blob; color: string } | null>(null);
  const processingRef = useRef(false);
  const waitingRef = useRef(false);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setImg(url);
      
      const t = setTimeout(() => {
        processFile(file);
      }, 600);
      
      return () => clearTimeout(t);
    }
    return () => {
      if (img && !img.startsWith('blob')) URL.revokeObjectURL(img);
    };
  }, []);

  const processFile = async (f: File) => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      const result = await fix(f);
      resultRef.current = result;
      
      const processedUrl = URL.createObjectURL(result.blob);
      setImg(processedUrl);
      setProcessed(true);
      
      if (waitingRef.current) {
        completeSave();
      }
    } catch (err) {
      console.error(err);
    } finally {
      processingRef.current = false;
    }
  };

  const completeSave = async () => {
    if (!resultRef.current) return;
    
    setWaitingForSave(false);
    waitingRef.current = false;
    setSaving(true);
    
    const raw = await base(resultRef.current.blob);
    const color = resultRef.current.color;
    
    setTimeout(async () => {
      await write({
        id: crypto.randomUUID(),
        src: raw,
        color: color || '#f4f4f5',
        at: Date.now()
      });
      if (done) done();
    }, 450);
  };

  const handleSave = () => {
    if (saving) return;
    
    if (!resultRef.current) {
      setWaitingForSave(true);
      waitingRef.current = true;
    } else {
      completeSave();
    }
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
        <div className="relative w-full h-full max-h-[65vh] aspect-[3/4] flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 rounded-[36px] overflow-hidden transition-all duration-700">
          {img && (
            <img 
              key={processed ? 'processed' : 'raw'}
              src={img} 
              className={`
                w-full h-full object-contain select-none p-8 transition-all duration-500
                ${processed ? 'animate-pop-in' : ''}
              `}
              alt="preview" 
              draggable={false}
            />
          )}
        </div>
      </div>

      <div 
        className="px-6 w-full z-20 flex items-center gap-4 flex-shrink-0 transition-all duration-700 delay-100 ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{ paddingBottom: 'calc(130px + env(safe-area-inset-bottom))' }}
      >
          <button 
            onClick={handleRetake}
            className="flex-1 h-14 rounded-full bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white font-medium hover:bg-zinc-200 dark:hover:bg-zinc-800 active-shrink text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw size={18} />
            Discard
          </button>
          <button 
            onClick={handleSave}
            disabled={waitingForSave}
            className="flex-1 h-14 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold flex items-center justify-center gap-2 text-sm shadow-xl active-shrink transition-colors disabled:opacity-80"
          >
            {waitingForSave ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Save Item <ArrowRight size={18} />
              </>
            )}
          </button>
      </div>
    </div>
  );
};
