import * as React from 'react';
import { iconMap, iconChoices, Category } from '@/constants';
import type { UseTodoFormParams, UseTodoFormReturn } from '@/types/hooks';

export function useTodoForm({
  todoActions,
  availableCategories,
  setAvailableCategories,
  updateNameCategory,
  t,
}: UseTodoFormParams): UseTodoFormReturn {
  const [tempIconKey, setTempIconKey] = React.useState('');

  const ensureCategoryExists = React.useCallback(
    async (val: string, iconKey?: string) => {
      const v = val.trim();
      if (!v) return;
      setAvailableCategories((prev) => {
        if (prev.find((c) => c.value === v)) return prev;
        let finalKey = iconKey;
        if (!finalKey) {
          finalKey = Object.keys(iconMap).find((k) => k.toLowerCase() === v.toLowerCase());
        }
        const newCat: Category = {
          value: v,
          label: (t.categoryLabels as Record<string, string>)?.[v] || iconChoices.find((x) => x.key === v)?.label || v,
          icon: finalKey ? iconMap[finalKey] : null,
        };
        return [...prev, newCat];
      });
      return;
    },
    [setAvailableCategories, t]
  );

  const displayedCategory = React.useMemo(() => {
    if (
      todoActions.category === '' &&
      todoActions.clearedForName === todoActions.name.trim().toLowerCase()
    ) {
      return '';
    }
    const found = availableCategories.find((c) => c.value === todoActions.category);
    return found ? found.label : todoActions.category;
  }, [availableCategories, todoActions.category, todoActions.name, todoActions.clearedForName]);

  const handleAdd = React.useCallback(async () => {
    await ensureCategoryExists(todoActions.category, tempIconKey || undefined);
    await todoActions.addItem();
    updateNameCategory(todoActions.name, todoActions.category, todoActions.comment);
    setTempIconKey('');
  }, [ensureCategoryExists, todoActions, tempIconKey, updateNameCategory]);

  React.useEffect(() => {
    const exist = availableCategories.find((c) => c.value === todoActions.category);
    if (exist) {
      const key = Object.keys(iconMap).find((k) => iconMap[k] === exist.icon) || '';
      setTempIconKey(key);
    } else {
      setTempIconKey('');
    }
  }, [todoActions.category, availableCategories]);

  return {
    tempIconKey,
    setTempIconKey,
    ensureCategoryExists,
    displayedCategory,
    handleAdd,
  };
}
