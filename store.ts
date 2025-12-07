import { Item } from './types';

// db name
const name = 'clueless';
const ver = 1;

// open db
const open = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, ver);
    req.onupgradeneeded = (e: any) => {
      e.target.result.createObjectStore('items', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

// save item
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

// get all
export const read = async (): Promise<Item[]> => {
  const db = await open();
  return new Promise((resolve) => {
    const tx = db.transaction('items', 'readonly');
    const store = tx.objectStore('items');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result.sort((a: Item, b: Item) => b.at - a.at));
  });
};

// delete item
export const del = async (id: string) => {
  const db = await open();
  const tx = db.transaction('items', 'readwrite');
  const store = tx.objectStore('items');
  store.delete(id);
  
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};