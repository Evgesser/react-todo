export interface Todo {
  _id: string;
  name: string;
  description: string;
  quantity: number;
  completed: boolean;
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

export interface List {
  _id: string;
  name: string;
  completed: boolean;
  finishedAt?: string;
  defaultColor?: string;
}