export type ListType = 'shopping' | 'expenses' | 'todo';

export interface List {
  _id: string;
  name: string;
  completed: boolean;
  finishedAt?: string;
  defaultColor?: string;
  type?: ListType;
  budget?: number; // for expenses mode
  currency?: string; // currency code for budget display (e.g. USD, EUR, RUB)
  strictBudget?: boolean; // if set, prevent spending beyond budgets
  // random token used for password‑less sharing
  shareToken?: string;
}

// ``ShoppingList`` is the server-side document shape for lists.
export interface ShoppingList {
  _id: string; // serialized ObjectId
  userId: string;
  name: string;
  completed: boolean;
  createdAt: Date;
  finishedAt?: Date;
  type?: ListType;
}
