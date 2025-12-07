
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, RefreshCw, ChevronDown } from 'lucide-react';
import { Props, ScanResult } from '../types';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { fix, base } from '../utils/clean';

interface ScanProps extends Props {
  file: File | null;
  onScanSave?: (result: ScanResult) => void;
  onDiscard?: () => void;
}

const CATEGORIES = ['Top', 'Bottom', 'One Piece', 'Shoe', 'Headwear', 'Accessory', 'Bag', 'Other'];

export const Scan = ({ file, onScanSave, onDiscard }: ScanProps) => {
  const [processing, setProcessing] = useState(true);
  const [result, setResult] = useState<ScanResult>({ src: '', color: '#f4f4f5', category: 'Top' });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (file) processFile(file);
  }, [file]);

  const processFile = async (f: File) => {
    setProcessing(true);
    try {
      const { blob, color, category } = await fix(f);
      const cleanBase64 = await base(blob);
      setResult({ src: cleanBase64, color, category });
    } catch (e) {
      console.error(e);
      const b64 = await base(f);
      setResult({ src: b64, color: '#f4f4f5', category: 'Other' });
    } finally {
      setProcessing(false);
    }
  };

  useGSAP(() => {
    if (!processing && containerRef.current) {
        gsap.fromTo(containerRef.current,
            { y: '100%' },
            { y: '0%', duration: 0.5, ease: 'expo.out' }
        );
    }
  }, [processing]);

  const handleSave = () => {
    if (!containerRef.current) return;
    gsap.to(containerRef.current, {
      x: '100%',
      duration: 0.4,
      ease: 'power3.in',
      onComplete: () => onScanSave?.(result)
    });
  };

  const handleDiscard = () => {
    if (!containerRef.current) return;
    gsap.to(containerRef.current, {
      y: '100%',
      duration: 0.4,
      ease: 'power3.in',
      onComplete: () => onDiscard?.()
    });
  };

  const updateCategory = (cat: string) => {
    setResult(prev => ({ ...prev, category: cat }));
  };

  if (processing) {
     return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
             <div className="w-8 h-8 border-2 border-white/50 border-t-white rounded-full animate-spin" />
        </div>
     );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-white dark:bg-black flex flex-col"
    >
        <header className="pt-16 pb-2 px-6 flex-shrink-0 z-10">
            <div className="flex items-baseline justify-between border-b border-zinc-100 dark:border-zinc-900 pb-4">
                <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">Review</h1>
                <span className="text-zinc-400 font-mono text-xs">NEW ITEM</span>
            </div>
        </header>

        {/* Combined Container for Image and Buttons to control gap */}
        <div className="flex-1 w-full flex flex-col items-center justify-center px-6 gap-4 pb-12">
            <div className="relative w-full aspect-[4/5] max-h-[50vh] flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 rounded-[32px] overflow-hidden shadow-inner">
                <img 
                    src={result.src} 
                    className="w-full h-full object-contain p-8 select-none"
                    alt="preview" 
                    draggable={false}
                />
                
                <div className="absolute bottom-4 right-4 z-20">
                    <div className="relative flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-xl shadow-sm border border-black/5 dark:border-white/5 transition-transform active:scale-95">
                        <span className="text-xs font-bold text-black dark:text-white uppercase tracking-wide">
                           {result.category}
                        </span>
                        <ChevronDown size={12} className="text-black/50 dark:text-white/50" />

                        <select
                            value={result.category}
                            onChange={(e) => updateCategory(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="w-full flex items-center gap-3">
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
    </div>
  );
};
