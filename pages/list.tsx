
import React, { useRef, useState } from 'react';
import { Props } from '../types';
import { del } from '../store';
import { Trash2 } from 'lucide-react';

export const List = ({ data }: Props) => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holding, setHolding] = useState<string | null>(null);

  const start = (id: string) => {
    setHolding(id);
    timer.current = setTimeout(async () => {
      if (navigator.vibrate) navigator.vibrate(50);
      
      if (window.confirm('Delete this item?')) {
        await del(id);
        window.location.reload();
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
    <div className="min-h-full bg-stone-50 pb-32">
      <header className="pt-16 pb-2 px-6 sticky top-0 bg-stone-50/90 backdrop-blur-md z-20 transition-all">
        <h1 className="text-4xl font-bold tracking-tight text-stone-900">Wardrobe</h1>
        <p className="text-stone-400 font-medium text-sm mt-1">{data?.length || 0} items</p>
      </header>

      {!data || data.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-32 opacity-20 gap-4">
          <div className="w-24 h-24 bg-stone-300 rounded-3xl" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 px-6 mt-4">
          {data.map((item) => (
            <div 
              key={item.id} 
              className={`relative aspect-[3/4] bg-white rounded-3xl shadow-sm ring-1 ring-black/5 overflow-hidden transition-all duration-300 select-none ${holding === item.id ? 'scale-90 opacity-80' : 'active:scale-95'}`}
              onTouchStart={() => start(item.id)}
              onTouchEnd={end}
              onMouseDown={() => start(item.id)}
              onMouseUp={end}
              onMouseLeave={end}
            >
              <img 
                src={item.src} 
                className="w-full h-full object-contain p-4" 
                alt="cloth"
                draggable={false}
                loading="lazy"
              />
              
              {holding === item.id && (
                <div className="absolute inset-0 bg-stone-100/50 flex items-center justify-center backdrop-blur-sm">
                  <Trash2 className="text-red-500 opacity-80" size={32} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
