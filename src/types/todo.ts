export type TodoStatus = 'pending' | 'in_progress' | 'done';

export interface Todo {
  _id: string;
  name: string;
  description: string;
  quantity: number;
  unit?: string;
  completed: boolean;
  status?: TodoStatus; // new status field
  // mark item as missing / unavailable in the store
  missing?: boolean;
  comment?: string;
  category?: string;
  color?: string;
  order?: number;
  // optional base64-encoded image attachment
  image?: string;
  // expense-specific
  amount?: number;
  spentAt?: string; // ISO date string
  // todo-specific
  dueDate?: string; // ISO date string
  priority?: 'low' | 'medium' | 'high';
  reminderAt?: string; // ISO date/time string
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
