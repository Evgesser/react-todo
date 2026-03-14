export interface StoredCategory {
  value: string;
  label: string;
  icon?: string;
  /** Optional budget allocated for this category (expenses mode). */
  budget?: number;
  /** Optional currency code for this category's budget. */
  currency?: string;
  /** Optional strict budget enforcement for this category. */
  strictBudget?: boolean;
  /** Optional exchange rate to the list currency (1 list currency = X category currency). */
  exchangeRateToListCurrency?: number;
  /** Optional list scope; if provided, category is only shown for that list. */
  listId?: string;
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
