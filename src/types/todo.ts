export interface Todo {
  _id: string;
  name: string;
  description: string;
  quantity: number;
  unit?: string;
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
  unit?: string;
  comment?: string;
  color?: string;
  category?: string;
}

export interface Template {
  // optional key to identify built-in templates for localization
  key?: string;
  name: string;
  items: TemplateItem[];
}
