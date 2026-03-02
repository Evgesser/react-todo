import * as React from 'react';
import { Category, iconMap, categories as defaultCategories, templates as defaultTemplates } from '@/constants';
import type { Template, StoredProduct } from '@/types';
import { fetchPersonalization, fetchProducts, savePersonalization, saveProduct } from '@/lib/api';
import type { TranslationKeys } from '@/locales/ru';

// hook that wraps all of the "personalization" state and side effects
export function usePersonalization(
  userId: string | null,
  t: TranslationKeys
) {
  const [availableCategories, setAvailableCategories] = React.useState<Category[]>(
    defaultCategories
  );
  const [availableTemplates, setAvailableTemplates] = React.useState<Template[]>(
    defaultTemplates
  );
  const [nameCategoryMap, setNameCategoryMap] = React.useState<
    Record<string, string>
  >({});
  const [products, setProducts] = React.useState<StoredProduct[]>([]);
  const [personalDialogOpen, setPersonalDialogOpen] = React.useState(false);

  // load any categories the user added while offline (stored locally)
  React.useEffect(() => {
    if (userId) return;
    try {
      const raw = localStorage.getItem('availCats');
      if (raw) {
        const arr = JSON.parse(raw) as Array<{
          value: string;
          label: string;
          icon?: string;
        }>;
        if (Array.isArray(arr)) {
          const cats: Category[] = arr.map((c) => ({
            value: c.value,
            label: c.label,
            icon: c.icon && iconMap[c.icon] ? iconMap[c.icon] : null,
          }));
          setAvailableCategories((prev) => {
            const merged: Category[] = defaultCategories.map((d) => ({ ...d }));
            cats.forEach((c) => {
              if (!merged.find((m) => m.value === c.value)) merged.push(c);
            });
            return merged;
          });
          localStorage.removeItem('availCats');
        }
      }
    } catch {
      /* ignore malformed local cache */
    }
  }, [userId]);

  // persist categories locally when unauthenticated so they survive reloads
  React.useEffect(() => {
    if (userId) return;
    try {
      const toStore = availableCategories.map((c) => ({
        value: c.value,
        label: c.label,
        icon: Object.keys(iconMap).find((k) => iconMap[k] === c.icon) || '',
      }));
      localStorage.setItem('availCats', JSON.stringify(toStore));
    } catch {
      // ignore
    }
  }, [availableCategories, userId]);

  // load personalization from server when user logs in
  const loadPersonalization = React.useCallback(async () => {
    if (!userId) return;
    try {
      const [data, prods] = await Promise.all([
        fetchPersonalization(userId),
        fetchProducts(userId),
      ]);
      if (data) {
        if (Array.isArray(data.categories)) {
          // start with defaults, override or append from personalization
          const merged: Category[] = defaultCategories.map((d) => ({ ...d }));
          data.categories.forEach((c) => {
            const idx = merged.findIndex((m) => m.value === c.value);
            const iconFromPersonal = c.icon && iconMap[c.icon] ? iconMap[c.icon] : null;
            const cat: Category = {
              value: c.value,
              label: c.label,
              icon: iconFromPersonal || merged[idx]?.icon || null,
            };
            if (idx !== -1) {
              merged[idx] = cat;
            } else {
              merged.push(cat);
            }
          });
          setAvailableCategories(merged);
        }
        if (Array.isArray(data.templates)) {
          setAvailableTemplates(data.templates);
        }
        if (data.nameCategoryMap && typeof data.nameCategoryMap === 'object') {
          setNameCategoryMap(data.nameCategoryMap as Record<string, string>);
        }
        if (Array.isArray(data.products)) {
          const oldProds =
            data.products as Array<{ name: string; category?: string; comment?: string; icon?: string }>;
          setProducts(oldProds);
          // migrate each old product to new collection
          if (userId) {
            oldProds.forEach((p) => {
              saveProduct(userId!, { name: p.name, category: p.category }).catch(() => {});
            });
          }
          // also populate nameCategoryMap from old products
          setNameCategoryMap((prev) => {
            const next = { ...prev };
            oldProds.forEach((p) => {
              if (p.name && p.category && next[p.name] !== p.category) {
                next[p.name] = p.category;
              }
            });
            return next;
          });
        }
      }
      if (Array.isArray(prods)) {
        setProducts((prev) => {
          const seen = new Set(prev.map((p) => p.name));
          const merged = [...prev];
          prods.forEach((p) => {
            if (!seen.has(p.name)) merged.push(p);
          });
          return merged;
        });
      }
    } catch {
      // ignore invalid personalization
    }
  }, [userId]);

  React.useEffect(() => {
    if (userId) loadPersonalization();
  }, [userId, loadPersonalization]);

  // persist personalization whenever any of the pieces change
  React.useEffect(() => {
    if (!userId) return;
    savePersonalization(
      userId,
      availableCategories.map((c) => ({
        value: c.value,
        label: c.label,
        icon: Object.keys(iconMap).find((k) => iconMap[k] === c.icon) || '',
      })),
      availableTemplates,
      nameCategoryMap,
      products
    ).catch(() => {});
  }, [userId, availableCategories, availableTemplates, nameCategoryMap, products]);

  const updateNameCategory = React.useCallback(
    async (name: string, category: string, comment?: string) => {
      const n = name.trim();
      if (!n) return;
      setProducts((prev) => {
        if (prev.find((p) => p.name === n)) return prev;
        const added: StoredProduct = { name: n };
        if (category) added.category = category;
        if (comment) added.comment = comment;
        return [...prev, added];
      });
      if (userId) {
        saveProduct(userId, { name: n, category: category || undefined, comment: comment || undefined }).catch(
          () => {}
        );
      }
      setNameCategoryMap((prev) => {
        if (prev[n] === category) return prev;
        const next = { ...prev, [n]: category };
        if (userId) {
          savePersonalization(
            userId,
            availableCategories.map((c) => ({
              value: c.value,
              label: c.label,
              icon: Object.keys(iconMap).find((k) => iconMap[k] === c.icon) || '',
            })),
            availableTemplates,
            next,
            products
          ).catch(() => {});
        }
        return next;
      });
    },
    [userId, availableCategories, availableTemplates, products]
  );

  return {
    availableCategories,
    setAvailableCategories,
    availableTemplates,
    setAvailableTemplates,
    nameCategoryMap,
    setNameCategoryMap,
    products,
    setProducts,
    personalDialogOpen,
    setPersonalDialogOpen,
    updateNameCategory,
  };
}
