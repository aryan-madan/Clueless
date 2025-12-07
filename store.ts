
import { Item, Outfit } from './types';

const name = 'clueless';
const ver = 2; 

const open = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, ver);
    req.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('items')) {
        db.createObjectStore('items', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('outfits')) {
        db.createObjectStore('outfits', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const write = async (item: Item) => {
  const db = await open();
  const tx = db.transaction('items', 'readwrite');
  const store = tx.objectStore('items');
  store.put(item);
  
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const read = async (): Promise<Item[]> => {
  const db = await open();
  return new Promise((resolve) => {
    const tx = db.transaction('items', 'readonly');
    const store = tx.objectStore('items');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result.sort((a: Item, b: Item) => b.at - a.at));
  });
};

export const del = async (id: string) => {
  const db = await open();
  const tx = db.transaction(['items', 'outfits'], 'readwrite');
  const itemStore = tx.objectStore('items');
  const outfitStore = tx.objectStore('outfits');
  
  itemStore.delete(id);
  
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const saveOutfit = async (outfit: Outfit) => {
  const db = await open();
  const tx = db.transaction('outfits', 'readwrite');
  const store = tx.objectStore('outfits');
  store.put(outfit);
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getOutfits = async (): Promise<Outfit[]> => {
  const db = await open();
  return new Promise((resolve) => {
    if (!db.objectStoreNames.contains('outfits')) {
      resolve([]);
      return;
    }
    const tx = db.transaction('outfits', 'readonly');
    const store = tx.objectStore('outfits');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result.sort((a: Outfit, b: Outfit) => b.at - a.at));
  });
};

export const deleteOutfit = async (id: string) => {
  const db = await open();
  const tx = db.transaction('outfits', 'readwrite');
  const store = tx.objectStore('outfits');
  store.delete(id);
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};