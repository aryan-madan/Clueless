
import React, { useRef, useState } from 'react';
import { Props } from '../types';
import { Trash2 } from 'lucide-react';

export const List = ({ data, onRemove }: Props) => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holding, setHolding] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const start = (id: string) => {
    setHolding(id);
    timer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      
      if (window.confirm('Remove item?')) {
        setDeleting(id);
        setTimeout(() => {
          if (onRemove) onRemove(id);
          setDeleting(null);
        }, 300);
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
    <div className="min-h-full pb-32 bg-white dark:bg-black px-6">
      <header className="pt-16 pb-8 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl z-20 transition-all">
        <div className="flex items-baseline justify-between border-b border-zinc-100 dark:border-zinc-900 pb-4">
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
            Closet
          </h1>
          <span className="text-zinc-400 font-mono text-xs">
            {data?.length || 0} ITEMS
          </span>
        </div>
      </header>

      {!data || data.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-24 gap-4 animate-fade-in">
          <div className="w-16 h-1 bg-zinc-100 dark:bg-zinc-900 rounded-full mb-4" />
          <p className="text-zinc-400 text-sm font-medium">Your wardrobe is empty.</p>
          <p className="text-zinc-300 dark:text-zinc-600 text-xs text-center max-w-[200px]">
            Tap the + button to add your first item.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mt-2">
          {data.map((item, index) => (
            <div 
              key={item.id} 
              className={`
                group relative aspect-[3/4] cursor-pointer rounded-[36px] overflow-hidden transition-all duration-300 active-shrink animate-enter
                ${holding === item.id ? 'scale-95 opacity-80' : 'hover:opacity-100'}
                ${deleting === item.id ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}
              `}
              style={{ 
                backgroundColor: item.color ? `${item.color}33` : 'rgba(244, 244, 245, 1)',
                animationDelay: `${index * 0.05}s`
              }}
              onTouchStart={() => start(item.id)}
              onTouchEnd={end}
              onMouseDown={() => start(item.id)}
              onMouseUp={end}
              onMouseLeave={end}
            >
              <img 
                src={item.src} 
                className="absolute inset-0 w-full h-full object-contain p-6 mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-105" 
                alt="cloth"
                draggable={false}
                loading="lazy"
              />
              
              {holding === item.id && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center animate-fade-in">
                  <Trash2 className="text-white" size={24} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};