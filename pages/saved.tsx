import React, { useRef, useState, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Shirt, Footprints, Glasses, Watch, PackageOpen, Palette, Wand2 } from 'lucide-react';
import { Props, Item, Outfit } from '../types';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { AndroidConfirm } from '../components/ui';

const SLOTS = [
  { id: 'headwear', label: 'Headwear', icon: Glasses, categories: ['Headwear', 'Eyewear', 'Hat', 'Sunglasses'] },
  { id: 'top', label: 'Top', icon: Shirt, categories: ['Top', 'One Piece', 'Outerwear', 'Upper-clothes', 'Dress'] },
  { id: 'bottom', label: 'Bottom', icon: Shirt, categories: ['Bottom', 'Pants', 'Skirt'], rotateIcon: 180 }, 
  { id: 'shoes', label: 'Shoes', icon: Footprints, categories: ['Shoe', 'Left-shoe', 'Right-shoe'] },
  { id: 'accessory', label: 'Accessory', icon: Watch, categories: ['Bag', 'Belt', 'Scarf', 'Accessory', 'Other'] }
];

const hexToHsl = (hex: string) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
      r = parseInt("0x" + hex[1] + hex[1]);
      g = parseInt("0x" + hex[2] + hex[2]);
      b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
      r = parseInt("0x" + hex[1] + hex[2]);
      g = parseInt("0x" + hex[3] + hex[4]);
      b = parseInt("0x" + hex[5] + hex[6]);
  }
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
  return [h * 360, s, l];
};

const isCompatible = (color1: string, color2: string) => {
  const [h1, s1, l1] = hexToHsl(color1);
  const [h2, s2, l2] = hexToHsl(color2);

  const isNeutral1 = s1 < 0.15 || l1 < 0.15 || l1 > 0.85;
  const isNeutral2 = s2 < 0.15 || l2 < 0.15 || l2 > 0.85;
  if (isNeutral1 || isNeutral2) return true;

  const diff = Math.abs(h1 - h2);
  const hueDiff = Math.min(diff, 360 - diff);

  return hueDiff < 45 || (hueDiff > 160 && hueDiff < 200) || (hueDiff > 100 && hueDiff < 140); 
};

export const Saved = ({ data, outfits = [], onSaveOutfit, onDeleteOutfit, dir, isAndroid }: Props) => {
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);
  const [holding, setHolding] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  
  const prevCount = useRef(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const headerTextRef = useRef<HTMLDivElement>(null);
  const creatorRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.killTweensOf(headerTextRef.current);

    const fromVars: gsap.TweenVars = { autoAlpha: 0 };
    if (dir === 'up') {
        fromVars.y = 15;
    }

    gsap.from(headerTextRef.current, {
      ...fromVars,
      duration: 0.4, 
      ease: 'power2.out',
      clearProps: 'all'
    });
  }, { scope: containerRef, dependencies: [dir] });

  useGSAP(() => {
    if (gridRef.current && outfits.length > 0) {
      const items = gridRef.current.children;
      const currentCount = outfits.length;
      const previous = prevCount.current;
      
      if (previous === 0 && currentCount > 0) {
        gsap.killTweensOf(items);
        gsap.fromTo(items,
          { autoAlpha: 0, scale: 0.9, y: 15 },
          { 
            autoAlpha: 1, 
            scale: 1, 
            y: 0, 
            stagger: 0.05, 
            duration: 0.5, 
            ease: 'back.out(1.2)'
          }
        );
      } 
      else if (currentCount > previous) {
         if (items[0]) {
             gsap.fromTo(items[0], 
                { autoAlpha: 0, scale: 0.95 },
                { 
                  autoAlpha: 1, 
                  scale: 1, 
                  y: 0, 
                  duration: 0.3,
                  ease: 'power2.out'
                }
             );
         }
         for(let i=1; i<items.length; i++) {
             if (!gsap.isTweening(items[i])) {
                gsap.set(items[i], { autoAlpha: 1, scale: 1, y: 0 });
             }
         }
      }
      else if (currentCount === previous && currentCount > 0) {
         for(let i=0; i<items.length; i++) {
            if (!gsap.isTweening(items[i])) {
               gsap.set(items[i], { autoAlpha: 1, scale: 1, y: 0 });
            }
         }
      }
      
      prevCount.current = currentCount;
    }
  }, { scope: containerRef, dependencies: [outfits] });

  useGSAP(() => {
    if (mode === 'create' && creatorRef.current) {
      gsap.set(creatorRef.current, { y: '100%', autoAlpha: 0 });
      // We need to use querySelectorAll on the ref because scope:containerRef won't work on portal
      const slots = creatorRef.current.querySelectorAll('.slot-anim');
      gsap.set(slots, { scale: 0.5, autoAlpha: 0 });

      gsap.to(creatorRef.current, 
        { y: '0%', autoAlpha: 1, duration: 0.5, ease: 'expo.out' }
      );

      gsap.to(slots, { 
        scale: 1, 
        autoAlpha: 1, 
        duration: 0.5, 
        stagger: 0.08, 
        ease: 'back.out(1.2)', 
        delay: 0.2
      });
    }
  }, { dependencies: [mode] }); // Global scope for portal

  useGSAP(() => {
    if (activeSlot && drawerRef.current) {
        gsap.fromTo(drawerRef.current,
            { y: '100%' },
            { y: '0%', duration: 0.4, ease: 'power3.out' }
        );
    }
  }, { dependencies: [activeSlot] }); // Global scope for portal

  const currentInventory = useMemo(() => {
    if (!data || !activeSlot) return [];
    const slotDef = SLOTS.find(s => s.id === activeSlot);
    if (!slotDef) return [];
    
    let items = data.filter(item => slotDef.categories.includes(item.category || 'Other'));

    if (showSuggestions) {
      const otherColors = Object.entries(selections)
        .filter(([key]) => key !== activeSlot)
        .map(([, id]) => data.find(i => i.id === id)?.color)
        .filter(Boolean) as string[];

      if (otherColors.length > 0) {
        items = items.filter(item => {
          if (!item.color) return true;
          return otherColors.some(refColor => isCompatible(item.color!, refColor));
        });
      }
    }

    return items;
  }, [data, activeSlot, showSuggestions, selections]);

  const hasReferenceItems = useMemo(() => {
    if (!activeSlot) return false;
    return Object.keys(selections).some(key => key !== activeSlot);
  }, [selections, activeSlot]);

  const executeDelete = (id: string) => {
    setDeleting(id);
    const element = document.getElementById(`fit-wrapper-${id}`);
    if (element) {
        gsap.to(element, {
            scale: 0, 
            autoAlpha: 0, 
            duration: 0.3,
            onComplete: () => {
                onDeleteOutfit?.(id);
                setDeleting(null);
            }
        });
    } else {
        onDeleteOutfit?.(id);
        setDeleting(null);
    }
  };

  const startPress = (id: string) => {
    isLongPress.current = false;
    setHolding(id);
    timer.current = setTimeout(() => {
      isLongPress.current = true;
      if (navigator.vibrate) navigator.vibrate(50);
      
      if (isAndroid) {
          setPendingDelete(id);
      } else {
          if (window.confirm('Delete outfit?')) {
            executeDelete(id);
          }
      }
      setHolding(null);
    }, 400); 
  };

  const endPress = () => {
    if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
    }
    setHolding(null);
  };

  const handleTapFit = (fit: Outfit) => {
      if (isLongPress.current) return;
      
      const map: Record<string, string> = {};
      fit.items.forEach(itemId => {
          const item = data?.find(i => i.id === itemId);
          if (item) {
              const slot = SLOTS.find(s => s.categories.includes(item.category || 'Other'));
              if (slot) {
                  map[slot.id] = itemId;
              } else if (item.category === 'Other') {
                  map['accessory'] = itemId; 
              }
          }
      });
      
      setSelections(map);
      setEditingId(fit.id);
      setMode('create');
  };

  const generateThumbnail = async (): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const width = 600;
    const height = 800; 
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.src = src;
    });

    const drawOrder = ['headwear', 'top', 'bottom', 'shoes', 'accessory'];
    const layoutConfig: Record<string, { x: number, y: number, w: number, rot: number }> = {
      headwear: { x: 300, y: 150, w: 200, rot: -5 },
      top:      { x: 300, y: 320, w: 280, rot: 2 },
      bottom:   { x: 300, y: 500, w: 260, rot: -2 },
      shoes:    { x: 300, y: 680, w: 220, rot: 4 },
      accessory:{ x: 480, y: 400, w: 180, rot: 15 } 
    };

    for (const slotId of drawOrder) {
      const itemId = selections[slotId];
      if (itemId) {
        const item = data?.find(i => i.id === itemId);
        if (item) {
          const img = await loadImage(item.src);
          const cfg = layoutConfig[slotId];
          
          ctx.save();
          ctx.translate(cfg.x, cfg.y);
          ctx.rotate(cfg.rot * Math.PI / 180);
          
          ctx.shadowColor = "rgba(0,0,0,0.1)";
          ctx.shadowBlur = 20;
          ctx.shadowOffsetY = 10;
          
          const aspect = img.width / img.height;
          const drawH = cfg.w / aspect;
          
          ctx.drawImage(img, -cfg.w/2, -drawH/2, cfg.w, drawH);
          ctx.restore();
        }
      }
    }

    return canvas.toDataURL('image/png');
  };

  const handleSave = async () => {
    const itemIds = Object.values(selections) as string[];
    if (itemIds.length === 0) return;

    const thumbnail = await generateThumbnail();
    const id = editingId || crypto.randomUUID();
    
    const at = editingId 
        ? (outfits.find(o => o.id === editingId)?.at || Date.now()) 
        : Date.now();

    const newOutfit: Outfit = {
      id,
      items: itemIds,
      thumbnail,
      at
    };

    if (onSaveOutfit) onSaveOutfit(newOutfit);
    closeCreator();
  };

  const handleAutoGenerate = () => {
    if (!data || data.length === 0) return;

    const topSlot = SLOTS.find(s => s.id === 'top');
    const tops = data.filter(i => topSlot?.categories.includes(i.category || ''));
    
    if (tops.length === 0) {
        alert("Add some tops first!");
        return;
    }

    const randomTop = tops[Math.floor(Math.random() * tops.length)];
    const newSelections: Record<string, string> = { 'top': randomTop.id };
    
    const colorsToCheck = randomTop.color ? [randomTop.color] : [];

    const pickCompatible = (slotId: string) => {
       const slotDef = SLOTS.find(s => s.id === slotId);
       if(!slotDef) return;
       const candidates = data.filter(i => slotDef.categories.includes(i.category || ''));
       if(candidates.length === 0) return;
       
       let chosen = candidates[Math.floor(Math.random() * candidates.length)];
       
       if (colorsToCheck.length > 0) {
           const compatible = candidates.filter(item => {
               if (!item.color) return true;
               return colorsToCheck.some(c => isCompatible(item.color!, c));
           });
           
           if (compatible.length > 0) {
               chosen = compatible[Math.floor(Math.random() * compatible.length)];
           }
       }
       
       newSelections[slotId] = chosen.id;
       if (chosen.color) colorsToCheck.push(chosen.color);
    };

    pickCompatible('bottom');
    pickCompatible('shoes');
    
    if (Math.random() > 0.6) pickCompatible('headwear');

    setSelections(newSelections);
    setEditingId(null);
    setMode('create');
  };

  const closeCreator = () => {
    if (creatorRef.current) {
      gsap.to(creatorRef.current, {
        y: '100%',
        autoAlpha: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          setMode('list');
          setSelections({});
          setEditingId(null);
          setActiveSlot(null);
          setShowSuggestions(false);
        }
      });
    } else {
      setMode('list');
    }
  };

  const closeDrawer = () => {
    if (drawerRef.current) {
        gsap.to(drawerRef.current, {
            y: '100%',
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                setActiveSlot(null);
                setShowSuggestions(false);
            }
        });
    } else {
        setActiveSlot(null);
        setShowSuggestions(false);
    }
  };

  const toggleSelection = (itemId: string) => {
    if (!activeSlot) return;
    setSelections(prev => {
      if (prev[activeSlot] === itemId) {
        const next = { ...prev };
        delete next[activeSlot];
        return next;
      }
      return { ...prev, [activeSlot]: itemId };
    });
    closeDrawer();
  };

  return (
    <div ref={containerRef} className="min-h-full pb-32 bg-white dark:bg-black relative overflow-hidden select-none">
      
      <header className="pt-16 pb-4 sticky top-0 z-20 transition-all duration-300 bg-white/80 dark:bg-black/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-black/60">
        <div className="px-6 flex items-baseline justify-between pb-2">
          <div ref={headerTextRef} className="flex items-baseline justify-between w-full">
            <div className="flex items-baseline gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
                Saved
              </h1>
              <span className="text-zinc-400 font-mono text-xs">
                {outfits.length} FITS
              </span>
            </div>
            
            <div className="flex items-center gap-1 -mr-2">
                {data && data.length > 2 && (
                    <button 
                        onClick={handleAutoGenerate}
                        className="p-2 text-zinc-800 dark:text-white active-shrink"
                        aria-label="Auto-generate outfit"
                    >
                        <Wand2 size={22} strokeWidth={2} />
                    </button>
                )}
                <button 
                  onClick={() => {
                      setSelections({});
                      setEditingId(null);
                      setMode('create');
                  }}
                  className="p-2 text-zinc-800 dark:text-white active-shrink"
                >
                  <Plus size={24} strokeWidth={2} />
                </button>
            </div>
          </div>
        </div>
      </header>

      <div className="will-change-transform">
        {outfits.length === 0 ? (
          <div className="px-6 flex flex-col items-center justify-center mt-32 gap-6">
            <div 
              onClick={() => setMode('create')}
              className="w-20 h-20 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform active:scale-95"
            >
              <Plus size={32} strokeWidth={1.5} className="text-zinc-300 dark:text-zinc-700" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-zinc-500 dark:text-zinc-400 font-medium">No saved outfits</p>
              <p className="text-zinc-300 dark:text-zinc-600 text-sm max-w-[200px] leading-relaxed">
                Tap the + to create your first fit.
              </p>
            </div>
          </div>
        ) : (
          <div ref={gridRef} className="px-6 grid grid-cols-2 gap-4 mt-2">
            {outfits.map(fit => (
              <div key={fit.id} id={`fit-wrapper-${fit.id}`} className="opacity-0 select-none" style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }} onContextMenu={(e) => e.preventDefault()}>
                <div 
                  className={`
                    group relative aspect-[3/4] bg-zinc-50 dark:bg-zinc-900 rounded-[32px] overflow-hidden cursor-pointer isolate
                    transition-transform backface-hidden transform-gpu select-none
                    ${holding === fit.id 
                        ? 'scale-90 duration-200 ease-out' 
                        : 'scale-100 hover:scale-[1.03] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]'
                    }
                  `}
                  onMouseDown={() => startPress(fit.id)}
                  onMouseUp={() => { endPress(); handleTapFit(fit); }}
                  onMouseLeave={endPress}
                  onTouchStart={() => startPress(fit.id)}
                  onTouchEnd={() => { endPress(); handleTapFit(fit); }}
                  onTouchMove={endPress}
                >
                    <div 
                       className={`
                          absolute inset-0 z-0 transition-transform duration-[400ms] ease-in pointer-events-none
                          ${holding === fit.id ? 'translate-y-0' : 'translate-y-full'}
                       `}
                       style={{
                          background: 'linear-gradient(to top, #71717aCC, transparent)' 
                       }}
                    />
  
                    <div className="relative z-10 w-full h-full pointer-events-none">
                        {fit.thumbnail ? (
                            <img src={fit.thumbnail} className="w-full h-full object-cover select-none" alt="outfit" draggable={false} />
                        ) : (
                            <div className="grid grid-cols-2 gap-1 h-full w-full p-2">
                                {fit.items.slice(0, 4).map(itemId => {
                                    const item = data?.find(i => i.id === itemId);
                                    if (!item) return null;
                                    return (
                                        <img key={itemId} src={item.src} className="w-full h-full object-contain bg-white dark:bg-zinc-800 rounded-lg" alt="" />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {mode === 'create' && createPortal(
        <div 
          ref={creatorRef} 
          className="fixed inset-0 z-[100] bg-white dark:bg-black flex flex-col pointer-events-none"
          style={{ pointerEvents: 'auto' }}
        >
           <header className="pt-16 pb-2 px-6 flex-shrink-0 z-10 bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-900">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center pb-4">
              <button onClick={closeCreator} className="justify-self-start p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X size={24} className="text-zinc-500" />
              </button>
              <h2 className="text-lg font-bold truncate">
                  {editingId ? 'Edit Fit' : 'New Fit'}
              </h2>
              <button 
                onClick={handleSave}
                disabled={Object.keys(selections).length === 0}
                className="justify-self-end text-sm font-bold bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-full disabled:opacity-50 transition-opacity"
              >
                Save
              </button>
            </div>
          </header>

          <div className="flex-1 flex flex-col relative overflow-hidden">
            
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative bg-zinc-50/50 dark:bg-zinc-900/30 pb-32">
              <div className="flex flex-col items-center pt-8 pb-12 w-full max-w-md mx-auto relative px-6">

                <div className="z-10 slot-anim w-full flex justify-center will-change-transform invisible">
                  <Slot 
                     def={SLOTS[0]} 
                     selectedId={selections['headwear']} 
                     data={data} 
                     onClick={() => setActiveSlot('headwear')}
                     className="rotate-[-3deg]"
                  />
                </div>

                <div className="-mt-4 z-20 w-[90%] slot-anim flex justify-center will-change-transform invisible">
                  <Slot 
                     def={SLOTS[1]} 
                     selectedId={selections['top']} 
                     data={data} 
                     onClick={() => setActiveSlot('top')}
                     className="rotate-[2deg] w-full"
                     isBig
                  />
                </div>

                <div className="-mt-6 z-30 w-[85%] slot-anim flex justify-center will-change-transform invisible">
                  <Slot 
                     def={SLOTS[2]} 
                     selectedId={selections['bottom']} 
                     data={data} 
                     onClick={() => setActiveSlot('bottom')}
                     className="rotate-[-2deg] w-full"
                     isBig
                  />
                </div>

                 <div className="-mt-6 z-40 w-[70%] slot-anim flex justify-center will-change-transform invisible">
                   <Slot 
                     def={SLOTS[3]} 
                     selectedId={selections['shoes']} 
                     data={data} 
                     onClick={() => setActiveSlot('shoes')}
                     className="rotate-[3deg] w-full"
                  />
                 </div>

                 <div className="absolute right-4 top-[40%] z-50 slot-anim will-change-transform invisible">
                    <Slot 
                        def={SLOTS[4]} 
                        selectedId={selections['accessory']} 
                        data={data} 
                        onClick={() => setActiveSlot('accessory')}
                        className="rotate-[12deg] w-24 h-24"
                        isFloating
                    />
                 </div>

              </div>
            </div>

            {activeSlot && (
                <div 
                    ref={drawerRef}
                    className="absolute inset-x-0 bottom-0 top-[40%] bg-white dark:bg-zinc-950 rounded-t-[32px] shadow-2xl flex flex-col z-50 border-t border-zinc-100 dark:border-zinc-900 will-change-transform transform-gpu"
                >
                    <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between shrink-0">
                        <span className="font-semibold text-lg">{SLOTS.find(s => s.id === activeSlot)?.label}</span>
                        
                        <div className="flex items-center gap-2">
                          {hasReferenceItems && (
                            <button 
                                onClick={() => setShowSuggestions(!showSuggestions)}
                                className={`
                                  p-2 rounded-full transition-all duration-300 flex items-center gap-2
                                  ${showSuggestions 
                                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' 
                                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800'}
                                `}
                            >
                                <Palette size={18} />
                            </button>
                          )}
                          <button onClick={closeDrawer} className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                              <X size={18} />
                          </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4">
                        {currentInventory.length === 0 ? (
                             <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-4">
                                <PackageOpen size={48} strokeWidth={1} className="text-zinc-300 dark:text-zinc-700" />
                                <p>{showSuggestions ? 'No matching items found.' : 'No items in this category.'}</p>
                             </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3">
                                {currentInventory.map(item => (
                                    <button 
                                        key={item.id}
                                        onClick={() => toggleSelection(item.id)}
                                        className={`
                                            aspect-square rounded-2xl bg-zinc-50 dark:bg-zinc-900 p-2 relative overflow-hidden active:scale-95 transition-transform
                                            ${selections[activeSlot] === item.id ? 'ring-2 ring-black dark:ring-white' : ''}
                                        `}
                                    >
                                        <img src={item.src} className="w-full h-full object-contain" alt="" loading="lazy" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {activeSlot && (
                <div 
                    className="absolute inset-0 bg-black/20 z-40 transition-opacity duration-300" 
                    onClick={closeDrawer}
                />
            )}

          </div>
        </div>,
        document.body
      )}
      {isAndroid && (
          <AndroidConfirm 
             isOpen={!!pendingDelete}
             title="Delete Outfit?"
             description="Are you sure you want to delete this outfit? This action cannot be undone."
             onConfirm={() => {
                 if(pendingDelete) executeDelete(pendingDelete);
                 setPendingDelete(null);
             }}
             onCancel={() => setPendingDelete(null)}
          />
      )}
    </div>
  );
};

const Slot = memo(({ def, selectedId, data, onClick, className, isBig, isFloating }: any) => {
    const item = data?.find((i: Item) => i.id === selectedId);
    
    return (
        <button
            onClick={onClick}
            className={`
                relative bg-white dark:bg-zinc-800 shadow-lg border-4 border-white dark:border-zinc-700
                flex items-center justify-center overflow-hidden transition-transform active:scale-95
                ${isFloating ? 'rounded-2xl' : 'rounded-[32px]'}
                ${isBig ? 'aspect-[4/3] max-w-[300px]' : 'aspect-square w-40'}
                ${className}
            `}
        >
            {item ? (
                <img src={item.src} className="w-full h-full object-contain p-2" alt="" />
            ) : (
                <div className="flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-600 gap-2">
                     <def.icon 
                        size={isBig ? 40 : 32} 
                        strokeWidth={1.5} 
                        style={def.rotateIcon ? { transform: `rotate(${def.rotateIcon}deg)` } : undefined}
                     />
                </div>
            )}
            
            {!item && (
                 <div className="absolute inset-0 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-transparent transition-colors" />
            )}
        </button>
    );
});