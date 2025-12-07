
export interface Item {
  id: string;
  src: string;
  color?: string;
  category?: string;
  at: number;
}

export interface Outfit {
  id: string;
  items: string[]; 
  at: number;
  name?: string;
  description?: string;
}

export interface ScanResult {
  src: string;
  category: string;
  color: string;
}

export interface Props {
  tab?: string;
  set?: (val: string) => void;
  data?: Item[];
  outfits?: Outfit[];
  done?: () => void;
  isOpen?: boolean;
  close?: () => void;
  onAdd?: () => void;
  onRemove?: (id: string) => void;
  onSaveOutfit?: (outfit: Outfit) => void;
  onDeleteOutfit?: (id: string) => void;
  onScanSave?: (result: ScanResult) => void; 
  native?: boolean;
  dir?: 'up' | 'down';
}
