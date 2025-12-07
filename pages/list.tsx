
import React, { useRef, useState } from 'react';
import { Props } from '../types';
import { Trash2, Plus } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export const List = ({ data, onRemove, onAdd, native, dir }: Props) => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holding, setHolding] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [intro, setIntro] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const headerTextRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.killTweensOf(headerTextRef.current);
    
    if (dir === 'down') {
      gsap.fromTo(headerTextRef.current, 
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
      );
    } else {
      gsap.fromTo(headerTextRef.current,
        { opacity: 0, y: 0 },
        { opacity: 1, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, { scope: containerRef, dependencies: [dir] });

  useGSAP(() => {
    if (data && data.length > 0) {
      const items = gridRef.current?.children;
      if (items) {
        gsap.killTweensOf(items);
        
        setIntro(false);

        gsap.fromTo(items,
          { opacity: 0, scale: 0.9, y: 15 },
          { 
            opacity: 1, 
            scale: 1, 
            y: 0, 
            stagger: 0.04, 
            duration: 0.4, 
            ease: 'back.out(1.2)',
            onComplete: () => setIntro(true) 
          }
        );
      }
    }
  }, { scope: containerRef, dependencies: [data] });

  const start = (id: string) => {
    setHolding(id);
    timer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      
      if (window.confirm('Remove item?')) {
        setDeleting(id);
        const element = document.getElementById(`item-${id}`);
        if (element) {
          gsap.to(element, { 
            scale: 0, 
            opacity: 0, 
            duration: 0.3, 
            onComplete: () => {
               if (onRemove) onRemove(id);
               setDeleting(null);
            }
          });
        }
      }
      setHolding(null);
    }, 600);
  };

  const end = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setHolding(null);
  };

  return (
    <div ref={containerRef} className="min-h-full pb-32 bg-white dark:bg-black px-6">
      <header className="pt-16 pb-8 sticky top-0 bg-white/90 dark:bg-black/90 backdrop-blur-xl z-20">
        <div className="flex items-baseline justify-between border-b border-zinc-100 dark:border-zinc-900 pb-4">
          <div ref={headerTextRef} className="flex items-baseline gap-3 opacity-0">
            <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
              Closet
            </h1>
            <span className="text-zinc-400 font-mono text-xs">
              {data?.length || 0} ITEMS
            </span>
          </div>
          
          {native && (
            <button 
              onClick={onAdd}
              className="p-2 -mr-2 text-zinc-800 dark:text-white active-shrink"
            >
              <Plus size={24} strokeWidth={2} />
            </button>
          )}
        </div>
      </header>

      {!data || data.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-24 gap-4">
          <div className="w-16 h-1 bg-zinc-100 dark:bg-zinc-900 rounded-full mb-4" />
          <p className="text-zinc-400 text-sm font-medium">Your wardrobe is empty.</p>
          <p className="text-zinc-300 dark:text-zinc-600 text-xs text-center max-w-[200px]">
            Tap the + button to add your first item.
          </p>
        </div>
      ) : (
        <div ref={gridRef} className="grid grid-cols-2 gap-4 mt-2">
          {data.map((item) => (
            <div 
              id={`item-${item.id}`}
              key={item.id} 
              className={`
                group relative aspect-[3/4] cursor-pointer rounded-[36px] overflow-hidden 
                ${intro ? 'transition-transform duration-300 active-shrink' : ''}
                ${holding === item.id ? 'scale-95' : 'hover:opacity-100'}
                opacity-0 will-change-transform
              `}
              style={{ 
                backgroundColor: item.color ? `${item.color}33` : 'rgba(244, 244, 245, 1)',
              }}
              onTouchStart={() => start(item.id)}
              onTouchEnd={end}
              onMouseDown={() => start(item.id)}
              onMouseUp={end}
              onMouseLeave={end}
            >
              {holding === item.id && (
                <div 
                  className="absolute inset-0 z-0"
                  style={{
                    background: `linear-gradient(to top, ${item.color || '#71717a'}E6, transparent)`
                  }}
                />
              )}

              <img 
                src={item.src} 
                className="absolute inset-0 w-full h-full object-contain p-6 mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-105 z-10" 
                alt="cloth"
                draggable={false}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
