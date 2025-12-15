import React, { useRef } from 'react';
import { Check } from 'lucide-react';
import { Props } from '../types';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface SettingsProps extends Props {
  engine: 'onnx' | 'imgly';
  setEngine: (e: 'onnx' | 'imgly') => void;
}

export const Settings = ({ engine, setEngine }: SettingsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(headerRef.current, {
        y: -10,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out'
    });

    if (contentRef.current) {
        gsap.from(contentRef.current.children, {
            y: 20,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
            delay: 0.1
        });
    }
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="min-h-full pb-32 bg-[#F2F2F7] dark:bg-black relative select-none">
      <header ref={headerRef} className="pt-16 pb-2 sticky top-0 z-20 transition-all duration-300 bg-[#F2F2F7]/80 dark:bg-black/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5">
        <div className="px-5">
           <h1 className="text-[34px] font-bold tracking-tight text-black dark:text-white leading-tight">Settings</h1>
        </div>
      </header>

      <div ref={contentRef} className="px-4 mt-6 space-y-8">
        
        <div className="space-y-2">
          <h2 className="text-[13px] font-normal text-zinc-500 uppercase tracking-wide pl-4">Processing Engine</h2>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800 shadow-sm">
             <button
               onClick={() => setEngine('onnx')}
               className="w-full flex items-center justify-between p-4 active:bg-zinc-50 dark:active:bg-[#2C2C2E] transition-colors"
             >
                <div className="flex flex-col items-start text-left gap-0.5">
                   <span className="text-[17px] font-normal text-black dark:text-white">Local Model</span>
                   <span className="text-[13px] text-zinc-400">Relatively faster (~10s)</span>
                </div>
                {engine === 'onnx' && <Check size={20} className="text-[#007AFF]" strokeWidth={2.5} />}
             </button>

             <button
               onClick={() => setEngine('imgly')}
               className="w-full flex items-center justify-between p-4 active:bg-zinc-50 dark:active:bg-[#2C2C2E] transition-colors"
             >
                <div className="flex flex-col items-start text-left gap-0.5">
                   <span className="text-[17px] font-normal text-black dark:text-white">High Quality</span>
                   <span className="text-[13px] text-zinc-400">Precise edges (~15s)</span>
                </div>
                {engine === 'imgly' && <Check size={20} className="text-[#007AFF]" strokeWidth={2.5} />}
             </button>
          </div>
          <p className="px-4 text-[13px] text-zinc-400 leading-relaxed">
            Local Model is faster but may have rough edges. High Quality uses a larger model for better precision.
          </p>
        </div>

        <div className="space-y-2">
           <h2 className="text-[13px] font-normal text-zinc-500 uppercase tracking-wide pl-4">App Info</h2>
           <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800 shadow-sm">
              <div className="w-full flex items-center justify-between p-4">
                  <span className="text-[17px] text-black dark:text-white">Version</span>
                  <span className="text-[17px] text-zinc-500">2.0.2</span>
              </div>
              <div className="w-full flex items-center justify-between p-4">
                  <span className="text-[17px] text-black dark:text-white">Compatibility</span>
                  <span className="text-[17px] text-zinc-500">iOS & Android</span>
              </div>
           </div>
        </div>
        
        <div className="pt-8 flex flex-col items-center gap-4 opacity-40">
             <img src="/logo_foreground.png" className="w-16 h-16 grayscale opacity-50" alt="" />
             <span className="text-xs text-zinc-500">Made with 🤍 by Aryan Madan</span>
        </div>

      </div>
    </div>
  );
};