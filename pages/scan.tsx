
import React, { useState, useRef } from 'react';
import { Camera } from 'lucide-react';
import { fix, base } from '../utils/clean';
import { write } from '../store';
import { Props } from '../types';

export const Scan = ({ done }: Props) => {
  const [img, set] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    set(url);

    try {
      // process silently
      const blob = await fix(file);
      const raw = await base(blob);
      
      await write({
        id: crypto.randomUUID(),
        src: raw,
        at: Date.now()
      });
      
      // small delay to show off animation
      setTimeout(() => {
        if (done) done();
      }, 1500);
    } catch (err) {
      console.error(err);
      set(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-stone-50">
      <header className="px-6 pt-16 pb-2 sticky top-0 z-10">
        <h1 className="text-4xl font-bold tracking-tight text-stone-900">New Item</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 -mt-20">
        {img ? (
          <div className="relative w-full max-w-sm aspect-[3/4] bg-white rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-black/5">
            <img 
              src={img} 
              className="w-full h-full object-cover" 
              alt="preview" 
            />
            
            <div className="absolute inset-0 bg-black/10" />
            
            {/* Laser Scan Effect */}
            <div className="absolute inset-0 animate-scan z-10 pointer-events-none">
              <div className="w-full h-1/2 bg-gradient-to-b from-transparent to-blue-400/20" />
              <div className="w-full h-0.5 bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)]" />
            </div>
          </div>
        ) : (
          <button 
            onClick={() => ref.current?.click()}
            className="group w-full max-w-sm aspect-[3/4] bg-white rounded-[2rem] flex flex-col items-center justify-center gap-6 transition-all active:scale-95 shadow-[0_4px_20px_rgba(0,0,0,0.03)] ring-1 ring-black/5 hover:shadow-lg"
          >
            <div className="w-24 h-24 rounded-full bg-stone-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <Camera size={40} className="text-stone-800" strokeWidth={1.2} />
            </div>
          </button>
        )}
      </div>

      <input 
        ref={ref}
        type="file" 
        accept="image/*" 
        capture="environment"
        onChange={pick}
        className="hidden" 
      />
    </div>
  );
};
