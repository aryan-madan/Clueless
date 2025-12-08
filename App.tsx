
import React, { useState, useEffect, useRef } from 'react';
import { Nav } from './components/nav';
import { List } from './pages/list';
import { Scan } from './pages/scan';
import { Saved } from './pages/saved';
import { read, del, write, getOutfits, saveOutfit, deleteOutfit } from './store';
import { Item, Outfit, ScanResult } from './types';
import { Device } from '@capacitor/device';   
import { TabsBar } from 'stay-liquid';

export default function App() {
  const [tab, setTab] = useState('wardrobe');
  const [data, list] = useState<Item[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [native, setNative] = useState(false);
  const [navigated, setNavigated] = useState(false);
  
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanKey, setScanKey] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
    if (tab === 'saved') setNavigated(true);
  }, [tab]);

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

  const handleScanSave = async (result: ScanResult) => {
    setScanFile(null);

    const newItem: Item = {
      id: crypto.randomUUID(),
      src: result.src,
      category: result.category,
      color: result.color,
      at: Date.now()
    };

    list(prev => [newItem, ...prev]);

    await write(newItem);
  };

  const handleScanDiscard = () => {
    setScanFile(null);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const info = await Device.getInfo();
        if (info.platform !== 'ios') return;

        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        await TabsBar.configure({
          visible: true,
          initialId: 'wardrobe',
          items: [
            { id: 'wardrobe', title: 'Closet', systemIcon: 'tshirt' },
            { id: 'saved', title: 'Saved', systemIcon: 'bookmark' },
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

      } catch (e) {
        setNative(false);
      }
    };

    init();
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-white dark:bg-black text-black dark:text-white overflow-hidden">
      <main className="flex-1 relative z-10 h-full overflow-y-auto scroll-smooth no-scrollbar">
        {tab === 'wardrobe' && (
          <List 
            data={data} 
            onRemove={handleRemove} 
            onAdd={handleInputTrigger} 
            native={native} 
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
          />
        )}
        
        {scanFile && (
          <Scan 
            key={scanKey} 
            file={scanFile}
            onDiscard={handleScanDiscard}
            onScanSave={handleScanSave}
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
