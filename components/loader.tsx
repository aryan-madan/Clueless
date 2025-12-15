import React from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export const Loader = ({ progress }: { progress: number }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
      if (progress >= 100 && containerRef.current) {
          gsap.to(containerRef.current, {
              opacity: 0,
              duration: 0.8,
              ease: "power2.inOut",
              onComplete: () => {
                  if (containerRef.current) {
                      containerRef.current.style.display = 'none';
                  }
              }
          });
      }
  }, [progress]);

  return (
    <div 
        ref={containerRef}
        className="fixed inset-0 z-[200] bg-[#8d0000] flex items-center justify-center pointer-events-none select-none"
        style={{ pointerEvents: 'auto' }}
    >
       <div className="flex flex-col items-center">
           <img 
             src="/logo_foreground.png" 
             alt="Clueless" 
             className="w-24 h-24 object-contain"
           />
       </div>
    </div>
  );
};