
import React, { useState, useEffect, useRef } from 'react';
import { Nav } from './components/nav';
import { List } from './pages/list';
import { Scan } from './pages/scan';
import { Saved } from './pages/saved';
import { read, del } from './store';
import { Item } from './types';
import { Device } from '@capacitor/device';   
import { TabsBar } from 'stay-liquid';

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

  const handleScanDone = () => {
    load();
    setTimeout(() => {
      setScanFile(null);
    }, 600);
  };

  const handleScanDiscard = () => {
    setTimeout(() => {
      setScanFile(null);
    }, 600);
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
            resetFile={handleScanDiscard}
            done={handleScanDone} 
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
