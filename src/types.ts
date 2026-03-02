export interface Todo {
  _id: string;
  name: string;
  description: string;
  quantity: number;
  completed: boolean;
  // mark item as missing / unavailable in the store
  missing?: boolean;
  comment?: string;
  color?: string;
  category?: string;
  order?: number;
}

export interface TemplateItem {
  name: string;
  description?: string;
  quantity?: number;
  comment?: string;
  color?: string;
  category?: string;
}

export interface Template {
  name: string;
  items: TemplateItem[];
}

// global product catalog entry, used for autocomplete across all lists
export interface StoredProduct {
  name: string;
  category?: string;
}

export interface List {
  _id: string;
  name: string;
  completed: boolean;
  finishedAt?: string;
  defaultColor?: string;
  // random token used for password‑less sharing
  shareToken?: string;
}