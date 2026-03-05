import * as React from 'react';
import { Category, iconMap, categories as defaultCategories, templates as defaultTemplates, iconChoices, categoryKeywords } from '@/constants';
import type { Template, StoredProduct } from '@/types';
import { fetchPersonalization, fetchProducts, savePersonalization, saveProduct } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

// hook that wraps all of the "personalization" state and side effects
export function usePersonalization(
  userId: string | null
) {
  const { t } = useLanguage();

  const [availableCategories, setAvailableCategories] = React.useState<Category[]>(
    () => defaultCategories.map((d) => ({ ...d, label: (t.categoryLabels as Record<string, string>)?.[d.value] || d.label }))
  );

  const [availableTemplates, setAvailableTemplates] = React.useState<Template[]>(
    () => {
      const defs = t.defaultTemplates as Record<string, Template> | undefined;
      if (defs && typeof defs === 'object') {
        return Object.keys(defs).map((k) => ({ key: k, ...(defs[k] as Template) }));
      }
      return defaultTemplates;
    }
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
          setAvailableCategories(() => {
            const merged: Category[] = defaultCategories.map((d) => ({ ...d }));
            cats.forEach((c) => {
              if (!merged.find((m) => m.value === c.value)) merged.push(c);
            });
            // enrich merged by matching labels to known keywords
            const mergedLower = merged.map((c) => c.label.toLowerCase());
            const mergedValues = new Set(merged.map((c) => c.value));
            Object.keys(categoryKeywords).forEach((iconKey) => {
              if (mergedValues.has(iconKey)) return;
              const keywords = categoryKeywords[iconKey];
              const matchesLabel = mergedLower.some((lbl) => keywords.some((k) => lbl.includes(k)));
              if (matchesLabel) {
                const ic = iconMap[iconKey] || null;
                const label = (t.categoryLabels as Record<string, string>)?.[iconKey] || iconChoices.find((x) => x.key === iconKey)?.label || iconKey;
                merged.push({ value: iconKey, label, icon: ic });
              }
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
          // enrich merged categories by auto-adding category entries when
          // product names or existing category labels match known keywords
          const mergedLowerLabels = merged.map((c) => c.label.toLowerCase());
          const mergedValues = new Set(merged.map((c) => c.value));
          const toAdd: Category[] = [];
          Object.keys(categoryKeywords).forEach((iconKey) => {
            if (mergedValues.has(iconKey)) return; // already present
            const keywords = categoryKeywords[iconKey];
            // match against existing category labels
            const matchesLabel = mergedLowerLabels.some((lbl) => keywords.some((k) => lbl.includes(k)));
            if (matchesLabel) {
              const ic = iconMap[iconKey] || null;
              const label = (t.categoryLabels as Record<string, string>)?.[iconKey] || iconChoices.find((x) => x.key === iconKey)?.label || iconKey;
              toAdd.push({ value: iconKey, label, icon: ic });
            }
          });
          // also inspect saved products for matches and add categories if needed
          if (Array.isArray(data.products)) {
            (data.products as Array<{ name?: string }> ).forEach((p) => {
              if (!p?.name) return;
              const name = p.name.toLowerCase();
              Object.keys(categoryKeywords).forEach((iconKey) => {
                if (mergedValues.has(iconKey)) return;
                if (toAdd.find((c) => c.value === iconKey)) return;
                const keywords = categoryKeywords[iconKey];
                if (keywords.some((k) => name.includes(k))) {
                  const ic = iconMap[iconKey] || null;
                    const label = (t.categoryLabels as Record<string, string>)?.[iconKey] || iconChoices.find((x) => x.key === iconKey)?.label || iconKey;
                  toAdd.push({ value: iconKey, label, icon: ic });
                }
              });
            });
          }
          const finalCats = merged.concat(toAdd);
          setAvailableCategories(finalCats);
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
              if (!p.name) return;
              const lower = p.name.trim().toLowerCase();
              if (p.category && next[lower] !== p.category) {
                next[lower] = p.category;
              }
              // if no explicit category, try heuristic mapping by keywords
              if (!p.category || !next[lower]) {
                Object.keys(categoryKeywords).some((iconKey) => {
                  const kws = categoryKeywords[iconKey];
                  if (kws.some((k) => lower.includes(k))) {
                    next[lower] = iconKey;
                    return true;
                  }
                  return false;
                });
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

  // when language changes, refresh labels for built-in defaults (preserve user-defined ones)
  React.useEffect(() => {
    setAvailableCategories((prev) => {
      const defaultVals = new Set(defaultCategories.map((d) => d.value));
      return prev.map((c) => {
        if (defaultVals.has(c.value)) {
          const iconComp = defaultCategories.find((d) => d.value === c.value)?.icon || null;
              const label = (t.categoryLabels as Record<string, string>)?.[c.value] || c.label;
          return { value: c.value, label, icon: iconComp };
        }
        return c;
      });
    });

    setAvailableTemplates((prev) =>
      prev.map((tmpl) => {
        const key = tmpl.key as string | undefined;
        const defsMap = t.defaultTemplates as Record<string, Template> | undefined;
        if (key && defsMap && defsMap[key]) {
          return { key, ...(defsMap[key] as Template) } as Template;
        }
        return tmpl;
      })
    );
  }, [t]);

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
      const key = n.toLowerCase();
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
        if (prev[key] === category) return prev;
        const next = { ...prev, [key]: category };
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
