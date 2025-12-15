import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, RefreshCw, ChevronDown, Timer } from 'lucide-react';
import { Props, ScanResult } from '../types';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { fix, base } from '../utils/clean';
import { AndroidSelect } from '../components/ui';

interface ScanProps extends Props {
  file: File | null;
  onScanSave?: (result: ScanResult, future?: Promise<ScanResult>) => void;
  onDiscard?: () => void;
  engine?: 'onnx' | 'imgly';
}

const CATEGORIES = ['Top', 'Bottom', 'One Piece', 'Shoe', 'Headwear', 'Accessory', 'Bag', 'Other'];

export const Scan: React.FC<ScanProps> = ({ file, onScanSave, onDiscard, isAndroid, engine = 'onnx' }) => {
  const [result, setResult] = useState<ScanResult>(() => ({ 
    src: file ? URL.createObjectURL(file) : '', 
    color: '#f4f4f5', 
    category: 'Top' 
  }));

  const [showAndroidSelect, setShowAndroidSelect] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [processTime, setProcessTime] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const processedRef = useRef<string | null>(null);
  const aiTaskRef = useRef<Promise<ScanResult> | null>(null);

  useEffect(() => {
    return () => {
      if (result.src.startsWith('blob:')) {
        URL.revokeObjectURL(result.src);
      }
    };
  }, []);

  useEffect(() => {
    let interval: any;
    if (isAiProcessing) {
        const start = Date.now();
        interval = setInterval(() => {
            setProcessTime((Date.now() - start) / 1000);
        }, 50);
    }
    return () => clearInterval(interval);
  }, [isAiProcessing]);

  useEffect(() => {
    if (file) {
        const fileKey = `${file.name}-${file.lastModified}`;
        if (processedRef.current === fileKey) return;
        processedRef.current = fileKey;
        
        setProcessTime(0);
        setIsAiProcessing(true);
        
        const task = (async () => {
             await new Promise(r => setTimeout(r, 300));

             try {
                const { blob, color } = await fix(file, engine);
                const b64 = await base(blob);
                return { src: b64, color, category: 'Top' }; 
             } catch (e) {
                console.error(e);
                const raw = await base(file);
                return { src: raw, color: '#f4f4f5', category: 'Other' };
             }
        })();
        
        aiTaskRef.current = task;

        task.then(res => {
             if (containerRef.current) { 
                 setIsAiProcessing(false);
                 setResult(prev => ({ 
                     ...prev, 
                     src: res.src, 
                     color: res.color 
                 }));
             }
        });
    }
  }, [file]);

  useGSAP(() => {
    if (containerRef.current) {
        gsap.fromTo(containerRef.current,
            { y: '100%' },
            { y: '0%', duration: 0.5, ease: 'expo.out' }
        );
    }
  }, []); 

  const handleSave = () => {
    if (!containerRef.current) return;
    
    gsap.to(containerRef.current, {
      x: '100%',
      duration: 0.4,
      ease: 'power3.in',
      onComplete: async () => {
         let finalResult = result;
         if (result.src.startsWith('blob:') && file) {
             try {
                 const b64 = await base(file);
                 finalResult = { ...result, src: b64 };
             } catch(e) {
                 console.error(e);
             }
         }
         onScanSave?.(finalResult, isAiProcessing ? aiTaskRef.current : undefined);
      }
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

  if (!result.src) return null;

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

        <div className="flex-1 w-full flex flex-col items-center justify-center px-6 gap-4 pb-12">
            <div 
                className="relative w-full aspect-[4/5] max-h-[50vh] flex items-center justify-center rounded-[32px] overflow-hidden shadow-inner transition-colors duration-1000"
                style={{ backgroundColor: result.color ? `${result.color}33` : 'rgba(244,244,245,0.5)' }}
            >
                <img 
                    src={result.src} 
                    className={`
                        w-full h-full object-contain p-8 select-none transition-all duration-500
                        ${isAiProcessing ? 'animate-pulse opacity-80' : 'opacity-100'}
                    `}
                    alt="preview" 
                    draggable={false}
                />

                {(isAiProcessing || processTime > 0) && (
                     <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-xl shadow-sm border border-black/5 dark:border-white/5 h-10 transition-all">
                        <Timer size={14} className={`text-zinc-500 ${isAiProcessing ? 'animate-spin' : ''}`} />
                        <span className="text-xs font-bold text-black dark:text-white tabular-nums">
                            {processTime.toFixed(1)}s
                        </span>
                    </div>
                )}
                
                <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
                    
                    <div className="relative flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-xl shadow-sm border border-black/5 dark:border-white/5 transition-transform active:scale-95 h-10">
                        <span className="text-xs font-bold text-black dark:text-white uppercase tracking-wide truncate max-w-[80px]">
                           {result.category}
                        </span>
                        <ChevronDown size={12} className="text-black/50 dark:text-white/50" />

                        {isAndroid ? (
                            <button
                                onClick={() => setShowAndroidSelect(true)}
                                className="absolute inset-0 w-full h-full opacity-0"
                            />
                        ) : (
                            <select
                                value={result.category}
                                onChange={(e) => updateCategory(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        )}
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

        {isAndroid && (
            <AndroidSelect 
                isOpen={showAndroidSelect}
                options={CATEGORIES}
                selected={result.category}
                onSelect={updateCategory}
                onClose={() => setShowAndroidSelect(false)}
            />
        )}
    </div>
  );
};