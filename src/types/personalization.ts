export interface StoredCategory {
  value: string;
  label: string;
  icon?: string;
}

export interface PersonalizationDoc {
  _id?: string;
  userId: string;
  categories?: StoredCategory[];
  templates?: import('./todo').Template[];
  // mapping of item name to preferred category value
  nameCategoryMap?: Record<string, string>;
  // list of products user has seen/added
  products?: { name: string; category?: string }[];
  updatedAt?: Date;
}
