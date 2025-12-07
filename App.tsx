
import React, { useState, useEffect, useRef } from 'react';
import { Nav } from './components/nav';
import { List } from './pages/list';
import { Scan } from './pages/scan';
import { Saved } from './pages/saved';
import { read, del, write } from './store';
import { Item } from './types';
import { Device } from '@capacitor/device';   
import { TabsBar } from 'stay-liquid';
import { fix, base } from './utils/clean';

export default function App() {
  const [tab, setTab] = useState('wardrobe');
  const [data, list] = useState<Item[]>([]);
  const [native, setNative] = useState(false);
  
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanKey, setScanKey] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tab === 'wardrobe') load();
  }, [tab]);

  const load = async () => {
    const items = await read();
    list(items);
  };

  const handleRemove = async (id: string) => {
    await del(id);
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

  const handleScanSave = async () => {
    if (!scanFile) return;
    const file = scanFile;
    
    // Close Scan UI immediately
    setScanFile(null);

    // Generate ID and Prep Optimistic Item
    const id = crypto.randomUUID();
    const tempUrl = URL.createObjectURL(file);
    const tempItem: Item = {
      id,
      src: tempUrl,
      at: Date.now(),
      color: '#f4f4f5'
    };

    // Optimistic Update: Show raw item immediately
    list(prev => [tempItem, ...prev]);

    // Background Processing
    try {
      // 1. Convert Raw to Base64 & Persist
      // We do this first so the data is saved even if bg removal fails
      const rawBase64 = await base(file);
      const rawItem = { ...tempItem, src: rawBase64 };
      await write(rawItem);

      // 2. Run AI Background Removal
      const { blob, color } = await fix(file);
      const cleanBase64 = await base(blob);

      // 3. Update Item with Clean Image & Color
      const finalItem = { ...rawItem, src: cleanBase64, color };
      await write(finalItem);

      // 4. Update UI with Clean Image
      list(prev => prev.map(item => item.id === id ? finalItem : item));

      // Cleanup
      URL.revokeObjectURL(tempUrl);

    } catch (error) {
      console.error("Processing failed", error);
      // Even if processing fails, we saved the raw item, so we just keep that.
    }
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
            { id: 'add', title: 'Add', systemIcon: 'plus.circle.fill' },
            { id: 'saved', title: 'Saved', systemIcon: 'bookmark' },
          ],
          selectedIconColor: isDark ? '#FFFFFF' : '#000000', 
          unselectedIconColor: '#9ca3af'
        });

        setNative(true);

        await TabsBar.addListener('selected', async ({ id }: any) => {
          if (id === 'add') {
             handleInputTrigger();
             return;
          }
          setTab(id);
          if (id === 'wardrobe') load();
        });

      } catch (e) {
        setNative(false);
      }
    };

    init();
  }, []);

  return (
    <div className="flex flex-col h-screen w-full bg-white dark:bg-black text-black dark:text-white overflow-hidden">
      <main className="flex-1 relative z-10 overflow-y-auto scroll-smooth no-scrollbar h-full">
        {tab === 'wardrobe' && <List data={data} onRemove={handleRemove} />}
        {tab === 'saved' && <Saved data={data} />}
        
        {scanFile && (
          <Scan 
            key={scanKey} 
            file={scanFile}
            onDiscard={handleScanDiscard}
            onSave={handleScanSave}
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
