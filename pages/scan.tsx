
import React, { useState, useEffect } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { Props } from '../types';

interface ScanProps extends Props {
  file: File | null;
  onSave?: () => void;
  onDiscard?: () => void;
}

export const Scan = ({ file, onSave, onDiscard }: ScanProps) => {
  const [img, setImg] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setImg(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      if (onSave) onSave();
    }, 400); // Wait for exit animation
  };

  const handleDiscard = () => {
    setClosing(true);
    setTimeout(() => {
      if (onDiscard) onDiscard();
    }, 400); // Wait for exit animation
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
        <div className="relative w-full h-full max-h-[65vh] aspect-[3/4] flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 rounded-[36px] overflow-hidden">
          {img && (
            <img 
              src={img} 
              className="w-full h-full object-contain select-none p-8"
              alt="preview" 
              draggable={false}
            />
          )}
        </div>
      </div>

      <div 
        className="px-6 w-full z-20 flex items-center gap-4 flex-shrink-0 transition-opacity duration-300"
        style={{ paddingBottom: 'calc(130px + env(safe-area-inset-bottom))' }}
      >
          <button 
            onClick={handleDiscard}
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
