import React from 'react';
import { LayoutGrid, Bookmark } from 'lucide-react';
import { Props } from '../types';

interface NavProps extends Props {
  onAdd?: () => void;
}

export const Nav = ({ tab, set }: NavProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 flex items-center justify-center pb-safe mb-8 z-40 pointer-events-none px-6">
      
      <nav className="pointer-events-auto flex items-center gap-2 p-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl rounded-full shadow-2xl border border-white/20 dark:border-white/10">
        <button 
          onClick={() => set && set('wardrobe')}
          className={`
            relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 active-shrink
            ${tab === 'wardrobe' ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white' : 'hover:bg-black/5 dark:hover:bg-white/5 text-zinc-400 dark:text-zinc-500'}
          `}
        >
          <LayoutGrid 
            strokeWidth={2} 
            size={22} 
          />
        </button>

        <button 
          onClick={() => set && set('saved')}
          className={`
            relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 active-shrink
            ${tab === 'saved' ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white' : 'hover:bg-black/5 dark:hover:bg-white/5 text-zinc-400 dark:text-zinc-500'}
          `}
        >
          <Bookmark 
            strokeWidth={2} 
            size={22} 
          />
        </button>
      </nav>

    </div>
  );
};