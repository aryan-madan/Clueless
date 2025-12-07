import React, { useState, useEffect } from 'react';
import { Nav } from './components/nav';
import { List } from './pages/list';
import { Scan } from './pages/scan';
import { read } from './store';
import { Item } from './types';
import { Device } from '@capacitor/device';
import { TabsBar } from 'stay-liquid';

export default function App() {
  const [tab, set] = useState('wardrobe');
  const [data, list] = useState<Item[]>([]);
  const [native, setNative] = useState(false);

  // init data
  useEffect(() => {
    read().then(list);
  }, [tab]);

  // sync data
  const load = async () => {
    const items = await read();
    list(items);
  };

  // init native tabs
  useEffect(() => {
    const init = async () => {
      try {
        const info = await Device.getInfo();
        
        // check for ios
        if (info.platform !== 'ios') return;

        // check version as per plugin docs
        const ver = (info as any).iOSVersion || 0;
        
        await TabsBar.configure({
          visible: true,
          initialId: 'wardrobe',
          items: [
            { id: 'wardrobe', title: 'Wardrobe', systemIcon: 'square.grid.2x2' },
            { id: 'scan', title: 'New', systemIcon: 'plus' },
          ],
          selectedIconColor: '#1c1917',
          unselectedIconColor: '#a8a29e'
        });

        // if we get here, native tabs are active
        setNative(true);

        // listen for native taps
        await TabsBar.addListener('selected', ({ id }: any) => {
          set(id);
          if (id === 'wardrobe') load();
        });

      } catch (e) {
        // fallback to web nav if native fails
        console.log('Native tabs not available:', e);
        setNative(false);
      }
    };

    init();
  }, []);

  // sync react state to native tabs
  useEffect(() => {
    if (native) {
      TabsBar.select({ id: tab }).catch(() => {});
    }
  }, [tab, native]);

  return (
    <div className="flex flex-col h-screen w-full bg-white selection:bg-stone-200">
      <main className="flex-1 overflow-y-auto scroll-smooth no-scrollbar">
        {tab === 'wardrobe' && <List data={data} />}
        {tab === 'scan' && <Scan done={() => { set('wardrobe'); load(); }} />}
      </main>
      
      {!native && <Nav tab={tab} set={set} />}
    </div>
  );
}