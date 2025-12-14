import React, { useRef, useState } from 'react';
import { Props } from '../types';
import { Plus } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { AndroidConfirm } from '../components/ui';

export const List = ({ data, onRemove, onAdd, native, dir, isAndroid }: Props) => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holding, setHolding] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const headerTextRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  
  const prevCount = useRef(0);

  useGSAP(() => {
    gsap.killTweensOf(headerTextRef.current);
    
    const fromVars: gsap.TweenVars = { autoAlpha: 0 };
    if (dir === 'down') {
      fromVars.y = -15;
    }
    
    gsap.from(headerTextRef.current, {
      ...fromVars,
      duration: 0.4, 
      ease: 'power2.out',
      clearProps: 'all'
    });
  }, { scope: containerRef, dependencies: [dir] });

  useGSAP(() => {
    if (!data || !gridRef.current) return;
    
    const items = gridRef.current.children;
    const currentCount = data.length;
    const previous = prevCount.current;
    
    if (previous === 0 && currentCount > 0) {
      gsap.killTweensOf(items);
      gsap.fromTo(items,
        { autoAlpha: 0, scale: 0.9, y: 15 },
        { 
          autoAlpha: 1, 
          scale: 1, 
          y: 0, 
          stagger: 0.04, 
          duration: 0.4, 
          ease: 'back.out(1.2)',
        }
      );
    } 
    else if (currentCount > previous) {
      if (items[0]) {
        gsap.fromTo(items[0],
          { autoAlpha: 0, scale: 0.9, y: 15 },
          { 
            autoAlpha: 1, 
            scale: 1, 
            y: 0, 
            duration: 0.4, 
            ease: 'back.out(1.2)'
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

  }, { scope: containerRef, dependencies: [data] });

  const executeDelete = (id: string) => {
    setDeleting(id);
    const element = document.getElementById(`item-wrapper-${id}`);
    if (element) {
        gsap.to(element, { 
        scale: 0, 
        autoAlpha: 0, 
        duration: 0.3, 
        onComplete: () => {
            if (onRemove) onRemove(id);
            setDeleting(null);
        }
        });
    }
  };

  const start = (id: string) => {
    setHolding(id);
    timer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      
      if (isAndroid) {
          setPendingDelete(id);
          setHolding(null);
      } else {
          if (window.confirm('Remove item?')) {
            executeDelete(id);
          }
          setHolding(null);
      }
    }, 400);
  };

  const end = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setHolding(null);
  };

  return (
    <div ref={containerRef} className="min-h-full pb-32 bg-white dark:bg-black select-none">
      <header className="pt-16 pb-4 sticky top-0 z-20 transition-all duration-300 bg-white/80 dark:bg-black/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-black/60">
        <div className="px-6 flex items-baseline justify-between pb-2">
          <div ref={headerTextRef} className="flex items-baseline gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
              Closet
            </h1>
            <span className="text-zinc-400 font-mono text-xs">
              {data?.length || 0} ITEMS
            </span>
          </div>
          
          <button 
            onClick={onAdd}
            className="p-2 -mr-2 text-zinc-800 dark:text-white active-shrink"
          >
            <Plus size={24} strokeWidth={2} />
          </button>
        </div>
      </header>
      
      {!data || data.length === 0 ? (
        <div className="px-6 flex flex-col items-center justify-center mt-24 gap-4">
          <div className="w-16 h-1 bg-zinc-100 dark:bg-zinc-900 rounded-full mb-4" />
          <p className="text-zinc-400 text-sm font-medium">Your wardrobe is empty.</p>
          <p className="text-zinc-300 dark:text-zinc-600 text-xs text-center max-w-[200px]">
            Tap the + button to add your first item.
          </p>
        </div>
      ) : (
        <div ref={gridRef} className="px-6 grid grid-cols-2 gap-4 mt-2">
          {data.map((item) => (
            <div 
              key={item.id} 
              id={`item-wrapper-${item.id}`}
              className="opacity-0 select-none"
              style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <div 
                className={`
                  group relative aspect-[3/4] cursor-pointer rounded-[36px] overflow-hidden 
                  transition-transform backface-hidden transform-gpu select-none
                  ${holding === item.id 
                    ? 'scale-90 duration-200 ease-out' 
                    : 'scale-100 hover:scale-[1.03] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]'
                  }
                `}
                style={{ 
                  backgroundColor: item.color ? `${item.color}33` : 'rgba(244, 244, 245, 1)',
                }}
                onTouchStart={() => start(item.id)}
                onTouchEnd={end}
                onTouchMove={end}
                onMouseDown={() => start(item.id)}
                onMouseUp={end}
                onMouseLeave={end}
              >
                 <div 
                   className={`
                      absolute inset-0 z-0 pointer-events-none transition-transform duration-[400ms] ease-in
                      ${holding === item.id ? 'translate-y-0' : 'translate-y-full'}
                   `}
                   style={{
                      background: `linear-gradient(to top, ${item.color || '#71717a'}E6, transparent)`
                   }}
                 />
  
                <img 
                  src={item.src} 
                  className="absolute inset-0 w-full h-full object-contain p-6 mix-blend-multiply dark:mix-blend-normal z-10 pointer-events-none" 
                  alt="cloth"
                  draggable={false}
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>
      )}
      
      {isAndroid && (
          <AndroidConfirm 
            isOpen={!!pendingDelete}
            title="Remove Item?"
            description="This item will be permanently deleted from your closet."
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