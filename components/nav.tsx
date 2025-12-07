import React from 'react';
import { Grid2X2, Plus } from 'lucide-react';
import { Props } from '../types';

export const Nav = ({ tab, set }: Props) => {
  return (
    <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none">
      <nav className="pointer-events-auto flex items-center gap-1 p-1.5 bg-white/90 backdrop-blur-2xl rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-black/5">
        <button 
          onClick={() => set && set('wardrobe')}
          className={`h-11 w-14 rounded-full flex items-center justify-center transition-all duration-300 ${tab === 'wardrobe' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
        >
          <Grid2X2 strokeWidth={1.5} size={20} />
        </button>

        <div className="w-px h-4 bg-stone-200/50 mx-1" />

        <button 
          onClick={() => set && set('scan')}
          className={`h-11 w-14 rounded-full flex items-center justify-center transition-all duration-300 ${tab === 'scan' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
        >
          <Plus strokeWidth={1.5} size={24} />
        </button>
      </nav>
    </div>
  );
};