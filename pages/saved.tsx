
import React from 'react';
import { Bookmark } from 'lucide-react';
import { Props } from '../types';

export const Saved = ({ data }: Props) => {
  return (
    <div className="min-h-full pb-32 bg-white dark:bg-black px-6">
      <header className="pt-16 pb-8 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl z-20">
        <div className="flex items-baseline justify-between border-b border-zinc-100 dark:border-zinc-900 pb-4">
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
            Saved
          </h1>
          <span className="text-zinc-400 font-mono text-xs">
            0 FITS
          </span>
        </div>
      </header>

      <div className="flex flex-col items-center justify-center mt-32 gap-6 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
          <Bookmark size={32} strokeWidth={1.5} className="text-zinc-300 dark:text-zinc-700" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">No saved outfits</p>
          <p className="text-zinc-300 dark:text-zinc-600 text-sm max-w-[200px] leading-relaxed">
            Mix and match items from your closet to create and save looks here.
          </p>
        </div>
      </div>
    </div>
  );
};