
import React from 'react';
import { LayoutGrid, Plus, Bookmark } from 'lucide-react';
import { Props } from '../types';

interface NavProps extends Props {
  onAdd?: () => void;
}

export const Nav = ({ tab, set, onAdd }: NavProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 flex items-center justify-center gap-4 pb-safe mb-6 z-40 pointer-events-none px-6">
      
      <nav className="pointer-events-auto flex items-center gap-1 p-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl rounded-full shadow-2xl border border-white/20 dark:border-white/10">
        <button 
          onClick={() => set && set('wardrobe')}
          className={`
            relative px-5 py-3 rounded-full flex items-center gap-2 transition-all duration-300 active-shrink
            ${tab === 'wardrobe' ? 'bg-black/5 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}
          `}
        >
          <LayoutGrid 
            strokeWidth={2} 
            size={20} 
            className={`transition-colors duration-300 ${tab === 'wardrobe' ? 'text-black dark:text-white' : 'text-zinc-400 dark:text-zinc-500'}`} 
          />
          {tab === 'wardrobe' && (
            <span className="text-xs font-semibold text-black dark:text-white animate-fade-in">
              Closet
            </span>
          )}
        </button>

        <button 
          onClick={() => set && set('saved')}
          className={`
            relative px-5 py-3 rounded-full flex items-center gap-2 transition-all duration-300 active-shrink
            ${tab === 'saved' ? 'bg-black/5 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}
          `}
        >
          <Bookmark 
            strokeWidth={2} 
            size={20} 
            className={`transition-colors duration-300 ${tab === 'saved' ? 'text-black dark:text-white' : 'text-zinc-400 dark:text-zinc-500'}`} 
          />
          {tab === 'saved' && (
            <span className="text-xs font-semibold text-black dark:text-white animate-fade-in">
              Saved
            </span>
          )}
        </button>
      </nav>

      <div className="pointer-events-auto">
        <button 
          onClick={onAdd}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-black dark:bg-white text-white dark:text-black hover:scale-105 transition-transform active-shrink shadow-2xl border border-white/10"
        >
          <Plus strokeWidth={2.5} size={24} />
        </button>
      </div>

    </div>
  );
};
