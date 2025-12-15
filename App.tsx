import React, { useState, useEffect, useRef } from 'react';
import { Nav } from './components/nav';
import { List } from './pages/list';
import { Scan } from './pages/scan';
import { Saved } from './pages/saved';
import { Settings } from './pages/settings';
import { Loader } from './components/loader';
import { read, del, write, getOutfits, saveOutfit, deleteOutfit } from './store';
import { Item, Outfit, ScanResult } from './types';
import { Device } from '@capacitor/device';
import { SystemBars, SystemBarsStyle } from '@capacitor/core';
import { TabsBar } from 'stay-liquid';
import { downloadModel } from './utils/clean';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  
  const [tab, setTab] = useState('wardrobe');
  const [data, list] = useState<Item[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [native, setNative] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [navigated, setNavigated] = useState(false);
  const [engine, setEngine] = useState<'onnx' | 'imgly'>('onnx');
  
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanKey, setScanKey] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const info = await Device.getInfo();
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Restore engine preference
        const savedEngine = localStorage.getItem('clueless-engine');
        if (savedEngine === 'imgly' || savedEngine === 'onnx') {
            setEngine(savedEngine);
        }

        if (info.platform === 'android') {
          setIsAndroid(true);
          document.body.classList.add('android');
          await SystemBars.setStyle({ 
            style: isDark ? SystemBarsStyle.Dark : SystemBarsStyle.Light 
          });
        }

        if (info.platform === 'ios') {
          await TabsBar.configure({
            visible: true,
            initialId: 'wardrobe',
            items: [
              { id: 'wardrobe', title: 'Closet', systemIcon: 'tshirt' },
              { id: 'saved', title: 'Saved', systemIcon: 'bookmark' },
              { id: 'settings', title: 'Settings', systemIcon: 'gear' },
            ],
            selectedIconColor: isDark ? '#FFFFFF' : '#000000', 
            unselectedIconColor: '#9ca3af'
          });

          setNative(true);
          await TabsBar.addListener('selected', async ({ id }: any) => {
            setTab(id);
            if (id === 'saved') setNavigated(true);
            if (id === 'wardrobe') load();
          });
        }
      } catch (e) {
        setNative(false);
      }
      
      await load();

      try {
          await downloadModel((p) => setProgress(p));
      } catch(e) {
          console.error("Model download failed", e);
      }
      
      setLoading(false);
    };

    init();
  }, []);

  useEffect(() => {
    if (!loading && tab === 'saved') setNavigated(true);
  }, [tab, loading]);

  const updateEngine = (newEngine: 'onnx' | 'imgly') => {
      setEngine(newEngine);
      localStorage.setItem('clueless-engine', newEngine);
  };

  const load = async () => {
    const [items, fits] = await Promise.all([read(), getOutfits()]);
    list(items);
    setOutfits(fits);
  };

  const handleRemove = async (id: string) => {
    await del(id);
    load();
  };

  const handleSaveOutfit = async (outfit: Outfit) => {
    await saveOutfit(outfit);
    load();
  };

  const handleDeleteOutfit = async (id: string) => {
    await deleteOutfit(id);
    load();
  };

  const handleInputTrigger = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; 
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScanFile(file);
      setScanKey(prev => prev + 1); 
    }
  };

  const handleScanSave = async (result: ScanResult, future?: Promise<ScanResult>) => {
    setScanFile(null);

    const id = crypto.randomUUID();
    const newItem: Item = {
      id,
      src: result.src,
      category: result.category,
      color: result.color,
      at: Date.now()
    };

    list(prev => [newItem, ...prev]);
    await write(newItem);

    if (future) {
        try {
            const better = await future;
            const updatedItem: Item = {
                ...newItem,
                src: better.src,
                color: better.color,
            };
            
            list(prev => prev.map(i => i.id === id ? updatedItem : i));
            await write(updatedItem);
        } catch (e) {
            console.error("Background processing failed", e);
        }
    }
  };

  const handleScanDiscard = () => {
    setScanFile(null);
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-white dark:bg-black text-black dark:text-white overflow-hidden">
      <Loader progress={progress} />
      
      <main className="flex-1 relative z-10 h-full overflow-y-auto scroll-smooth no-scrollbar">
        {tab === 'wardrobe' && (
          <List 
            data={data} 
            onRemove={handleRemove} 
            onAdd={handleInputTrigger} 
            native={native} 
            isAndroid={isAndroid}
            dir={navigated ? 'down' : undefined}
          />
        )}

        {tab === 'saved' && (
          <Saved 
            data={data} 
            outfits={outfits} 
            onSaveOutfit={handleSaveOutfit} 
            onDeleteOutfit={handleDeleteOutfit}
            dir="up"
            isAndroid={isAndroid}
          />
        )}

        {tab === 'settings' && (
            <Settings engine={engine} setEngine={updateEngine} />
        )}
        
        {scanFile && (
          <Scan 
            key={scanKey} 
            file={scanFile}
            onDiscard={handleScanDiscard}
            onScanSave={handleScanSave}
            isAndroid={isAndroid}
            engine={engine}
          />
        )}
      </main>
      
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        onChange={handleFileChange}
        className="opacity-0 pointer-events-none absolute inset-0 -z-10 w-0 h-0"
        tabIndex={-1}
        aria-hidden="true"
      />
      
      {!native && tab !== 'add' && (
        <Nav tab={tab} set={setTab} onAdd={handleInputTrigger} />
      )}
    </div>
  );
}
