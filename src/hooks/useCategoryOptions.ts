import * as React from 'react';
import { Category, iconMap, iconChoices, categoryKeywords } from '@/constants';
import type { TranslationKeys } from '@/locales/ru';
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
  t: TranslationKeys;
  language: string;
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
  t,
  language,
}: UseCategoryOptionsParams): CategoryOptionsResult {
  const options = React.useMemo(() => {
    const lowerName = name.trim().toLowerCase();
    const priority: Category[] = [];
    if (lowerName) {
      const mapped = nameCategoryMap[lowerName];
      if (mapped !== undefined) {
        const cat = availableCategories.find((c) => c.value === mapped);
        if (cat) priority.push(cat);
      } else {
        // heuristics: try to match known keywords to icon keys and suggest that category
        // Use bi-directional substring checks so short user input ("снек") matches
        // plural/extended keywords ("снеки"). This is a lightweight fallback
        // to a proper morphological stemmer.
        const langKeywords = categoryKeywords[language] || categoryKeywords.en; // fallback to en
        for (const [iconKey, kws] of Object.entries(langKeywords)) {
          if (
            kws.some((k) => {
              const kw = (k || '').toLowerCase();
              return (
                lowerName.includes(kw) ||
                kw.includes(lowerName) ||
                lowerName.startsWith(kw) ||
                kw.startsWith(lowerName)
              );
            })
          ) {
            const cat = availableCategories.find((c) => c.value === iconKey);
            if (cat) priority.push(cat);
            else {
              const label = (t.categoryLabels as Record<string, string>)?.[iconKey] || iconChoices.find((x) => x.key === iconKey)?.label || iconKey;
              const ic = iconMap[iconKey] || null;
              priority.push({ value: iconKey, label, icon: ic });
            }
            break;
          }
        }
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
  }, [name, todos, availableCategories, nameCategoryMap, category, clearedForName, t, language]);

  const displayed = React.useMemo(() => {
    if (category === '' && clearedForName === name.trim().toLowerCase()) {
      return '';
    }
    const found = availableCategories.find((c) => c.value === category);
    return found ? found.label : category;
  }, [availableCategories, category, name, clearedForName]);

  return { categoryOptions: options, displayedCategory: displayed };
}
