import React, { useRef } from 'react';
import { Shirt, ScanLine, Github, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const textSectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (navRef.current) {
        gsap.from(navRef.current, {
            yPercent: -100,
            duration: 0.8,
            ease: 'power3.out'
        });
    }

    const heroLines = heroRef.current?.querySelectorAll('.hero-mask');
    if (heroLines && heroLines.length > 0) {
        gsap.fromTo(heroLines, 
            { yPercent: 100, autoAlpha: 0 },
            {
                yPercent: 0,
                autoAlpha: 1,
                duration: 1,
                stagger: 0.1,
                ease: 'power3.out',
                delay: 0.1
            }
        );
    }

    if (buttonsRef.current) {
        gsap.fromTo(buttonsRef.current,
            { y: 20, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.8, ease: 'power2.out', delay: 0.6 }
        );
    }

    if (imageRef.current) {
        gsap.fromTo(imageRef.current,
            { y: 60, autoAlpha: 0, scale: 0.9 },
            { y: 0, autoAlpha: 1, scale: 1, duration: 1.2, ease: 'power3.out', delay: 0.4 }
        );
    }

    const featureLines = textSectionRef.current?.querySelectorAll('.feature-mask');
    if (featureLines && featureLines.length > 0) {
        gsap.fromTo(featureLines, 
            { yPercent: 100, autoAlpha: 0 },
            {
                yPercent: 0,
                autoAlpha: 1,
                duration: 0.8,
                stagger: 0.05,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: textSectionRef.current,
                    start: "top 80%",
                }
            }
        );
    }
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white overflow-x-hidden">
      
      <nav 
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5"
      >
        <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth'})}>
             <div className="relative overflow-hidden rounded-lg">
                <img 
                    src="/logo.png" 
                    alt="Clueless" 
                    className="w-8 h-8 object-contain transition-transform duration-500 group-hover:scale-110" 
                />
             </div>
             <div className="text-xl font-bold tracking-tight">Clueless</div>
          </div>
          
          <div className="flex items-center gap-6">
            <a href="mailto:aryan@example.com" className="hidden md:block text-sm font-medium text-zinc-500 hover:text-black transition-colors">Contact</a>
            <a href="https://github.com" target="_blank" className="hidden md:block text-sm font-medium text-zinc-500 hover:text-black transition-colors">GitHub</a>
            
            <a 
                href="https://github.com/aryan-madan/Clueless/releases"
                target="_blank"
                rel="noreferrer"
                className="bg-black text-white px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-zinc-800 active:scale-95 transition-all group overflow-hidden"
            >
                <Github size={16} className="transition-all duration-300 group-hover:-translate-x-full group-hover:w-0 group-hover:opacity-0" />
                <span className="hidden sm:inline">Download</span>
                <span className="sm:hidden">Download</span>
                <ArrowRight size={16} className="w-0 opacity-0 -translate-x-full transition-all duration-300 group-hover:w-4 group-hover:translate-x-0 group-hover:opacity-100" />
            </a>
          </div>
        </div>
      </nav>

      <section ref={heroRef} className="relative z-10 pt-32 md:pt-40 pb-16 md:pb-20 px-4 max-w-[1200px] mx-auto flex flex-col items-center text-center">
        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.95] md:leading-[0.9] max-w-5xl mx-auto flex flex-col gap-0 cursor-default select-none">
          <span className="block overflow-hidden pb-4 -mb-4">
              <span className="invisible hero-mask block">The minimal <span className="inline-flex align-middle justify-center bg-zinc-100 rounded-[12px] p-1 md:p-3 mx-1 hover:scale-110 transition-transform duration-300"><Shirt className="w-6 h-6 sm:w-8 sm:h-8 md:w-16 md:h-16 text-zinc-900" strokeWidth={1.5} /></span> wardrobe</span>
          </span>
          <span className="block overflow-hidden pb-4 -mb-4">
              <span className="invisible hero-mask block">manager to digitize</span>
          </span>
          <span className="block overflow-hidden pb-4 -mb-4">
              <span className="invisible hero-mask block"><span className="inline-flex align-middle justify-center bg-zinc-100 rounded-[12px] p-1 md:p-3 mx-1 hover:scale-110 transition-transform duration-300"><ScanLine className="w-6 h-6 sm:w-8 sm:h-8 md:w-16 md:h-16 text-zinc-900" strokeWidth={1.5} /></span> your closet.</span>
          </span>
        </h1>

        <div ref={buttonsRef} className="mt-10 md:mt-14 mb-16 flex flex-row items-center gap-3 md:gap-4 w-full justify-center">
            <a 
                href="https://github.com/aryan-madan/Clueless/releases"
                target="_blank"
                rel="noreferrer"
                className="group bg-black text-white px-5 md:px-6 py-3 rounded-full text-sm md:text-base font-medium flex items-center justify-center gap-2 hover:bg-zinc-800 active:scale-95 transition-all overflow-hidden"
            >
                <Github size={20} className="transition-all duration-300 group-hover:-translate-x-full group-hover:w-0 group-hover:opacity-0" />
                <span>Download</span>
                <ArrowRight size={20} className="w-0 opacity-0 -translate-x-full transition-all duration-300 group-hover:w-5 group-hover:translate-x-0 group-hover:opacity-100" />
            </a>

            <a href="https://hackclub.com" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 py-2 px-4 rounded-full hover:bg-zinc-50 transition-colors duration-200 cursor-pointer">
                <img 
                  src="https://assets.hackclub.com/flag-standalone-wtransparent.svg" 
                  alt="Hack Club Flag" 
                  className="w-8 h-8 object-contain brightness-0" 
                />
                <div className="text-xs font-medium leading-tight text-zinc-500 text-left hover:text-black transition-colors">
                    Built with<br/>
                    <span className="text-sm font-semibold text-black font-sans">Hack Club</span>
                </div>
            </a>
        </div>
      </section>

      <section className="relative z-10 px-4 w-full max-w-[1400px] mx-auto mb-20 md:mb-32">
        <div className="relative flex justify-center">
            <img 
                ref={imageRef}
                src="/screenshot.png" 
                alt="App Screenshot" 
                className="w-full max-w-[420px] md:max-w-[480px] h-auto drop-shadow-2xl rounded-[36px] md:rounded-[48px] select-none"
            />
        </div>
      </section>

      <section ref={textSectionRef} className="relative z-10 px-4 py-16 md:py-24 max-w-[1000px] mx-auto text-center mb-10 md:mb-20">
        <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1] md:leading-[0.95] mb-12 md:mb-16 cursor-default select-none">
          <span className="block overflow-hidden pb-2"><span className="invisible feature-mask block">Privacy first.</span></span>
          <span className="block overflow-hidden pb-2"><span className="invisible feature-mask block">Data stays on device.</span></span>
          <span className="block overflow-hidden pb-2"><span className="invisible feature-mask block text-zinc-400">Secure. Private. Yours.</span></span>
        </h2>
        
        <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1] md:leading-[0.95] cursor-default select-none">
          <span className="block overflow-hidden pb-2"><span className="invisible feature-mask block text-zinc-400">Styled by science.</span></span>
          <span className="block overflow-hidden pb-2"><span className="invisible feature-mask block">Matches based on</span></span>
          <span className="block overflow-hidden pb-2"><span className="invisible feature-mask block">real color theory.</span></span>
          <span className="block overflow-hidden pb-2"><span className="invisible feature-mask block"><span className="text-zinc-400">Not magic.</span> Just math.</span></span>
        </h2>
      </section>

      <footer className="relative z-10 py-16 md:py-20 flex flex-col items-center justify-center bg-white border-t border-zinc-100">
        <div className="flex flex-col items-center gap-8">
            <div className="flex items-center gap-3 hover:scale-105 transition-transform duration-300 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth'})}>
                <img src="/logo.png" alt="Clueless" className="w-12 h-12 object-contain rounded-xl" />
                <div className="text-3xl font-bold tracking-tight">Clueless</div>
            </div>
            
            <a 
                href="https://github.com/aryan-madan/Clueless/releases"
                target="_blank"
                rel="noreferrer"
                className="group bg-black text-white px-6 py-3 rounded-full text-base font-medium flex items-center gap-2 hover:bg-zinc-800 active:scale-95 transition-all overflow-hidden"
            >
                <Github size={20} className="transition-all duration-300 group-hover:-translate-x-full group-hover:w-0 group-hover:opacity-0" />
                <span>Download from GitHub</span>
                <ArrowRight size={20} className="w-0 opacity-0 -translate-x-full transition-all duration-300 group-hover:w-5 group-hover:translate-x-0 group-hover:opacity-100" />
            </a>
            
            <div className="flex flex-col items-center gap-2 mt-4">
                <p className="text-zinc-400 text-sm">© {new Date().getFullYear()} Aryan Madan. All rights reserved.</p>
                <div className="flex gap-4">
                    <a href="#" className="text-xs font-medium text-zinc-500 hover:text-black transition-colors">Privacy</a>
                    <a href="#" className="text-xs font-medium text-zinc-500 hover:text-black transition-colors">Terms</a>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}