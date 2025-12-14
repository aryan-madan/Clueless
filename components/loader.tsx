
import React from 'react';
import { Loader2 } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export const Loader = ({ progress }: { progress: number }) => {
  const barRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (barRef.current) {
        gsap.to(barRef.current, {
            width: `${progress}%`,
            duration: 0.3,
            ease: 'power2.out'
        });
    }
  }, [progress]);

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-black flex flex-col items-center justify-center p-8">
       <div className="flex flex-col items-center gap-6 max-w-[240px] w-full">
           <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
                <Loader2 size={48} className="text-black dark:text-white animate-spin relative z-10" />
           </div>
           
           <div className="text-center space-y-1">
               <h3 className="font-bold text-lg text-black dark:text-white">Preparing AI</h3>
               <p className="text-sm text-zinc-400">Downloading models ({progress}%)</p>
           </div>

           <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
               <div 
                  ref={barRef}
                  className="h-full bg-black dark:bg-white rounded-full w-0"
               />
           </div>
           
           <p className="text-xs text-zinc-300 dark:text-zinc-600 text-center max-w-[200px]">
               This happens only once. Models are stored locally on your device.
           </p>
       </div>
    </div>
  );
};
