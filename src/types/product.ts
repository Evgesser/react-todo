// product catalog entry visible to client
export interface StoredProduct {
  name: string;
  category?: string;
  comment?: string;
  icon?: string;
}

// server-side document, includes timestamps and userId
export interface ProductDoc {
  _id?: string;
  userId: string;
  name: string;
  category?: string;
  comment?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}
