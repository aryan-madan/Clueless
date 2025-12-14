import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Check } from 'lucide-react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const vibrate = async (type: 'light' | 'medium' | 'heavy' | 'warning' = 'medium') => {
    try {
        if (type === 'warning') {
            await Haptics.notification({ type: NotificationType.Warning });
        } else {
            const style = type === 'light' ? ImpactStyle.Light : 
                          type === 'heavy' ? ImpactStyle.Heavy : ImpactStyle.Medium;
            await Haptics.impact({ style });
        }
    } catch (e) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(type === 'warning' ? 50 : 10);
        }
    }
};

export const AndroidConfirm = ({ isOpen, title, description, onConfirm, onCancel }: { 
    isOpen: boolean; 
    title: string; 
    description: string; 
    onConfirm: () => void; 
    onCancel: () => void; 
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (isOpen && containerRef.current) {
            vibrate('warning');
            gsap.fromTo(containerRef.current, 
                { autoAlpha: 0, scale: 0.9, y: 0 },
                { autoAlpha: 1, scale: 1, y: 0, duration: 0.3, ease: 'back.out(1.2)' }
            );
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 isolate select-none touch-none">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity" onClick={onCancel} />
            <div 
                ref={containerRef} 
                className="relative w-[320px] max-w-[85vw] bg-[#1C1C1E] rounded-[32px] overflow-hidden shadow-2xl flex flex-col items-center"
            >
                <div className="w-full p-6 pt-8 pb-8 text-center space-y-2">
                    <h3 className="text-[19px] font-semibold text-white tracking-tight leading-snug">{title}</h3>
                    {description && <p className="text-[13px] text-zinc-400 leading-relaxed px-2">{description}</p>}
                </div>
                
                <div className="w-full flex items-center gap-3 px-6 pb-6">
                    <button 
                        onClick={onCancel} 
                        className="flex-1 h-[52px] rounded-full bg-[#2C2C2E] flex items-center justify-center text-[17px] font-semibold text-white active:bg-[#3A3A3C] transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => { vibrate('medium'); onConfirm(); }}
                        className="flex-1 h-[52px] rounded-full bg-[#2C2C2E] flex items-center justify-center text-[17px] font-semibold text-[#FF453A] active:bg-[#3A3A3C] transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export const AndroidSelect = ({ isOpen, options, selected, onSelect, onClose }: {
    isOpen: boolean;
    options: string[];
    selected: string;
    onSelect: (val: string) => void;
    onClose: () => void;
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const bgRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (isOpen && containerRef.current && bgRef.current) {
            vibrate('medium');
            gsap.fromTo(bgRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
            gsap.fromTo(containerRef.current, 
                { y: '100%' }, 
                { y: '0%', duration: 0.4, ease: 'expo.out' }
            );
        }
    }, [isOpen]);

    const close = () => {
        if (containerRef.current && bgRef.current) {
            gsap.to(bgRef.current, { opacity: 0, duration: 0.25 });
            gsap.to(containerRef.current, { 
                y: '100%', 
                duration: 0.25, 
                ease: 'power2.in',
                onComplete: onClose
            });
        } else {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex flex-col justify-end isolate text-left select-none">
            <div ref={bgRef} className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={close} />
            
            <div 
                ref={containerRef} 
                className="relative w-full bg-[#1C1C1E] rounded-t-[24px] pb-safe shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
                <div className="w-full flex justify-center pt-4 pb-2" onClick={close}>
                    <div className="w-10 h-1 bg-zinc-600/50 rounded-full" />
                </div>
                
                <div className="overflow-y-auto px-4 pb-8 pt-2 space-y-1">
                    {options.map(opt => {
                         const isSelected = opt === selected;
                         return (
                            <button
                                key={opt}
                                onClick={() => { 
                                    vibrate('light');
                                    onSelect(opt); 
                                    close(); 
                                }}
                                className={`
                                    w-full py-4 px-5 rounded-[16px] flex items-center justify-between transition-colors
                                    ${isSelected 
                                        ? 'bg-[#2C2C2E]' 
                                        : 'active:bg-[#2C2C2E]'}
                                `}
                            >
                                <span className={`text-[17px] ${isSelected ? 'font-semibold text-white' : 'font-medium text-zinc-300'}`}>
                                    {opt}
                                </span>
                                {isSelected && (
                                    <Check size={20} className="text-[#0A84FF]" strokeWidth={2.5} />
                                )}
                            </button>
                         );
                    })}
                </div>
            </div>
        </div>
    );
};