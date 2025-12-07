
import React, { useRef, useState, useMemo } from 'react';
import { Bookmark, Plus, X, ArrowRight, Trash2 } from 'lucide-react';
import { Props, Item, Outfit } from '../types';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const CATEGORY_MAP: Record<string, string[]> = {
  Headwear: ['Headwear', 'Eyewear', 'Hat', 'Sunglasses'],
  Tops: ['Top', 'One Piece', 'Outerwear', 'Upper-clothes', 'Dress'],
  Bottoms: ['Bottom', 'Pants', 'Skirt'],
  Shoes: ['Shoe', 'Left-shoe', 'Right-shoe'],
  Accessories: ['Bag', 'Belt', 'Scarf', 'Accessory']
};

export const Saved = ({ data, outfits = [], onSaveOutfit, onDeleteOutfit, dir }: Props) => {
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [selections, setSelections] = useState<Record<string, string>>({});
  
  const containerRef = useRef<HTMLDivElement>(null);
  const headerTextRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const creatorRef = useRef<HTMLDivElement>(null);

  const inventory = useMemo(() => {
    if (!data) return {};
    const inv: Record<string, Item[]> = {};
    Object.keys(CATEGORY_MAP).forEach(key => {
      inv[key] = data.filter(item => 
        CATEGORY_MAP[key].includes(item.category || 'Other')
      );
    });
    return inv;
  }, [data]);

  useGSAP(() => {
    if (mode === 'list') {
      gsap.killTweensOf([headerTextRef.current, contentRef.current]);

      if (dir === 'up') {
        gsap.fromTo(headerTextRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
        );
      } else {
        gsap.fromTo(headerTextRef.current,
          { opacity: 0, y: 0 },
          { opacity: 1, duration: 0.4, ease: 'power2.out' }
        );
      }

      gsap.fromTo(contentRef.current,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.5, delay: 0.05, ease: 'power2.out' }
      );
    }
  }, { scope: containerRef, dependencies: [mode, dir] });

  useGSAP(() => {
    if (mode === 'create' && creatorRef.current) {
      gsap.fromTo(creatorRef.current, 
        { y: '100%' },
        { y: '0%', duration: 0.5, ease: 'expo.out' }
      );
    }
  }, { scope: containerRef, dependencies: [mode] });

  const handleSave = () => {
    const items = Object.values(selections);
    if (items.length === 0) return;

    const newOutfit: Outfit = {
      id: crypto.randomUUID(),
      items,
      at: Date.now()
    };

    if (onSaveOutfit) onSaveOutfit(newOutfit);
    
    gsap.to(creatorRef.current, {
      y: '100%',
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        setMode('list');
        setSelections({});
      }
    });
  };

  const handleCancel = () => {
    gsap.to(creatorRef.current, {
      y: '100%',
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        setMode('list');
        setSelections({});
      }
    });
  };

  const toggleSelection = (category: string, id: string) => {
    setSelections(prev => {
      const next = { ...prev };
      if (next[category] === id) {
        delete next[category];
      } else {
        next[category] = id;
      }
      return next;
    });
  };

  const getOutfitImages = (itemIds: string[]) => {
    return itemIds.map(id => data?.find(i => i.id === id)).filter(Boolean) as Item[];
  };

  return (
    <div ref={containerRef} className="min-h-full pb-32 bg-white dark:bg-black px-6 relative overflow-hidden">
      
      {/* HEADER */}
      <header className="pt-16 pb-8 sticky top-0 bg-white/90 dark:bg-black/90 backdrop-blur-xl z-20">
        <div className="flex items-baseline justify-between border-b border-zinc-100 dark:border-zinc-900 pb-4">
          <div ref={headerTextRef} className="flex items-baseline justify-between w-full opacity-0">
            <div className="flex items-baseline gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
                Saved
              </h1>
              <span className="text-zinc-400 font-mono text-xs">
                {outfits.length} FITS
              </span>
            </div>
            {mode === 'list' && (
              <button 
                onClick={() => setMode('create')}
                className="p-2 -mr-2 text-zinc-800 dark:text-white active-shrink"
              >
                <Plus size={24} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* LIST VIEW */}
      {mode === 'list' && (
        <div ref={contentRef} className="opacity-0 will-change-transform">
          {outfits.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-32 gap-6">
              <div 
                onClick={() => setMode('create')}
                className="w-20 h-20 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform active:scale-95"
              >
                <Plus size={32} strokeWidth={1.5} className="text-zinc-300 dark:text-zinc-700" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">No saved outfits</p>
                <p className="text-zinc-300 dark:text-zinc-600 text-sm max-w-[200px] leading-relaxed">
                  Tap the + to mix and match items from your closet.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 mt-2">
              {outfits.map(fit => {
                const images = getOutfitImages(fit.items);
                return (
                  <div 
                    key={fit.id} 
                    className="group relative aspect-[3/4] bg-zinc-50 dark:bg-zinc-900 rounded-[32px] overflow-hidden p-3 cursor-pointer"
                  >
                    <div className="grid grid-cols-2 gap-2 h-full w-full">
                      {images.slice(0, 4).map((img, i) => (
                        <div key={img.id} className="relative w-full h-full bg-white dark:bg-black/20 rounded-xl overflow-hidden">
                           <img src={img.src} className="w-full h-full object-contain p-1" alt="" loading="lazy" />
                        </div>
                      ))}
                    </div>
                    
                    <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         if(confirm('Delete outfit?')) onDeleteOutfit?.(fit.id);
                       }}
                       className="absolute top-2 right-2 p-2 bg-black/5 dark:bg-white/10 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} className="text-black dark:text-white" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATOR VIEW */}
      {mode === 'create' && (
        <div 
          ref={creatorRef} 
          className="fixed inset-0 z-50 bg-white dark:bg-black flex flex-col"
        >
           <header className="pt-16 pb-2 px-6 flex-shrink-0 z-10 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-900">
            <div className="flex items-center justify-between pb-4">
              <button onClick={handleCancel} className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X size={24} className="text-zinc-500" />
              </button>
              <h2 className="text-lg font-bold">New Fit</h2>
              <button 
                onClick={handleSave}
                disabled={Object.keys(selections).length === 0}
                className="text-sm font-bold bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full disabled:opacity-50 transition-opacity"
              >
                Save
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto pb-safe">
            {/* PREVIEW */}
            <div className="w-full aspect-square max-h-[40vh] bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center p-8 mb-4">
               {Object.keys(selections).length === 0 ? (
                 <span className="text-zinc-300 dark:text-zinc-700 font-medium text-sm">Select items below</span>
               ) : (
                 <div className="relative w-full h-full max-w-xs flex flex-col items-center justify-center -space-y-4">
                    {/* Simplified stacking visualization */}
                    {['Headwear', 'Accessories', 'Tops', 'Bottoms', 'Shoes'].map(cat => {
                      const id = selections[cat];
                      const item = data?.find(i => i.id === id);
                      if (!item) return null;
                      return (
                        <img 
                          key={cat} 
                          src={item.src} 
                          className="w-32 h-32 object-contain drop-shadow-lg z-10 first:z-40 last:z-10" 
                          style={{ 
                            zIndex: cat === 'Headwear' ? 50 : cat === 'Accessories' ? 40 : cat === 'Tops' ? 30 : cat === 'Bottoms' ? 20 : 10,
                            marginBottom: cat === 'Headwear' ? -20 : 0
                          }}
                          alt={cat}
                        />
                      );
                    })}
                 </div>
               )}
            </div>

            {/* SELECTORS */}
            <div className="space-y-8 px-6 pb-32">
              {Object.entries(inventory).map(([category, items]) => (
                <div key={category} className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">{category}</h3>
                  {items.length === 0 ? (
                     <div className="h-20 flex items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                       <span className="text-xs text-zinc-400">No {category.toLowerCase()} found</span>
                     </div>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
                      {items.map(item => {
                        const isSelected = selections[category] === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => toggleSelection(category, item.id)}
                            className={`
                              relative flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-900
                              transition-all duration-200 active:scale-95
                              ${isSelected ? 'ring-2 ring-black dark:ring-white scale-95' : 'ring-1 ring-zinc-100 dark:ring-zinc-800'}
                            `}
                          >
                            <img src={item.src} className="w-full h-full object-contain p-2" alt="" loading="lazy" />
                            {isSelected && (
                              <div className="absolute inset-0 bg-black/5 dark:bg-white/10" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
