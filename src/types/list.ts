export interface List {
  _id: string;
  name: string;
  completed: boolean;
  finishedAt?: string;
  defaultColor?: string;
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
}
