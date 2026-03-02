import * as React from 'react';
import { Todo, StoredProduct } from '@/types';

export type NameOption = {
  name: string;
  category?: string;
  comment?: string;
  icon?: string;
};

/**
 * Build a de‑duplicated list of names usable by the autocomplete component.
 * Combines existing todo names with product catalog entries.
 */
export function useNameOptions(todos: Todo[], products: StoredProduct[]): NameOption[] {
  return React.useMemo(() => {
    const map = new Map<string, NameOption>();
    todos.forEach((t) => {
      if (t.name) {
        map.set(t.name, { name: t.name, category: t.category });
      }
    });
    products.forEach((p) => {
      if (p.name && !map.has(p.name)) {
        map.set(p.name, {
          name: p.name,
          category: p.category,
          comment: p.comment,
          icon: p.icon,
        });
      }
    });
    return Array.from(map.values());
  }, [todos, products]);
}
