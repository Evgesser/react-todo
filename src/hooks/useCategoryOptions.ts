import * as React from 'react';
import { Category } from '@/constants';
import { Todo } from '@/types';

export interface CategoryOptionsResult {
  categoryOptions: Category[];
  displayedCategory: string;
}

interface UseCategoryOptionsParams {
  name: string;
  todos: Todo[];
  availableCategories: Category[];
  nameCategoryMap: Record<string, string>;
  category: string;
  clearedForName: string | null;
}

/**
 * Compute the list of categories to show in the category autocomplete, giving
 * priority to ones previously used with the same name and saved mappings.
 * Also calculate what text should currently be shown in the input field.
 */
export function useCategoryOptions({
  name,
  todos,
  availableCategories,
  nameCategoryMap,
  category,
  clearedForName,
}: UseCategoryOptionsParams): CategoryOptionsResult {
  const options = React.useMemo(() => {
    const lowerName = name.trim().toLowerCase();
    const priority: Category[] = [];
    if (lowerName) {
      const mapped = nameCategoryMap[lowerName];
      if (mapped !== undefined) {
        const cat = availableCategories.find((c) => c.value === mapped);
        if (cat) priority.push(cat);
      }
      const matches = todos.filter(
        (t) => t.name.trim().toLowerCase() === lowerName && t.category !== undefined
      );
      const seen = new Set<string>(priority.map((c) => c.value));
      matches.forEach((t) => {
        const val = t.category || '';
        if (!seen.has(val)) {
          seen.add(val);
          const cat = availableCategories.find((c) => c.value === val);
          if (cat) priority.push(cat);
        }
      });
    }
    const full = [...priority];
    availableCategories.forEach((c) => {
      if (!full.find((x) => x.value === c.value)) full.push(c);
    });
    if (category === '' && clearedForName === lowerName) {
      return full.filter((c) => c.value !== '');
    }
    return full;
  }, [name, todos, availableCategories, nameCategoryMap, category, clearedForName]);

  const displayed = React.useMemo(() => {
    if (category === '' && clearedForName === name.trim().toLowerCase()) {
      return '';
    }
    const found = availableCategories.find((c) => c.value === category);
    return found ? found.label : category;
  }, [availableCategories, category, name, clearedForName]);

  return { categoryOptions: options, displayedCategory: displayed };
}
