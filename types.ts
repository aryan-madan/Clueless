
export interface Item {
  id: string;
  src: string;
  color?: string;
  at: number;
}

export interface Outfit {
  id: string;
  items: string[]; 
  at: number;
}

export interface Props {
  tab?: string;
  set?: (val: string) => void;
  data?: Item[];
  done?: () => void;
  isOpen?: boolean;
  close?: () => void;
  onAdd?: () => void;
  onRemove?: (id: string) => void;
}