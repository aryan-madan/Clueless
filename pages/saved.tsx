
import React, { useRef } from 'react';
import { Bookmark } from 'lucide-react';
import { Props } from '../types';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export const Saved = ({ data, dir }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerTextRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (dir === 'up') {
      gsap.fromTo(headerTextRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
    } else {
      gsap.fromTo(headerTextRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
    }

    gsap.fromTo(contentRef.current,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.5, delay: 0.1, ease: 'power2.out' }
    );

  }, { scope: containerRef, dependencies: [dir] });

  return (
    <div ref={containerRef} className="min-h-full pb-32 bg-white dark:bg-black px-6">
      <header className="pt-16 pb-8 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl z-20">
        <div className="flex items-baseline justify-between border-b border-zinc-100 dark:border-zinc-900 pb-4">
          <div ref={headerTextRef} className="flex items-baseline justify-between w-full opacity-0">
            <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
              Saved
            </h1>
            <span className="text-zinc-400 font-mono text-xs">
              0 FITS
            </span>
          </div>
        </div>
      </header>

      <div ref={contentRef} className="flex flex-col items-center justify-center mt-32 gap-6 opacity-0">
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
