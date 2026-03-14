import * as React from 'react';
import { Category, iconMap, categories as defaultCategories, iconChoices, categoryKeywords } from '@/constants';
import Snowball from 'snowball-stemmers';

// ES + CommonJS совместимость для Turbopack
const Stemmer = Snowball.Stemmer || Snowball.default?.Stemmer;
// Возвращает функцию-стеммер по языку ('ru'|'en'), иначе null
function getStemmer(language: string): ((word: string) => string) | null {
  if (!Stemmer) return null;
  if (language === 'ru') {
    const ruStemmer = Stemmer.newStemmer('russian');
    return (word: string) => ruStemmer.stem(word);
  }
  if (language === 'en') {
    const enStemmer = Stemmer.newStemmer('english');
    return (word: string) => enStemmer.stem(word);
  }
  return null;
}
import type { Template, StoredProduct } from '@/types';
import { fetchPersonalization, fetchProducts, savePersonalization, saveProduct } from '@/lib/api';
import type { TranslationKeys } from '@/locales/ru';
import type { Language } from '@/locales';
import useAppStore from '@/stores/useAppStore';

// hook that wraps all of the "personalization" state and side effects
export function usePersonalization(
  userId: string | null,
  t: TranslationKeys,
  listType?: string | null
) {
  const isExpenses = listType === 'expenses';

  const availableCategories = useAppStore((s) => s.availableCategories);
  const setAvailableCategories = useAppStore((s) => s.setAvailableCategories);

  const availableTemplates = useAppStore((s) => s.availableTemplates);
  const setAvailableTemplates = useAppStore((s) => s.setAvailableTemplates);

  const nameCategoryMap = useAppStore((s) => s.nameCategoryMap);
  const setNameCategoryMap = useAppStore((s) => s.setNameCategoryMap);

  const products = useAppStore((s) => s.products);
  const setProducts = useAppStore((s) => s.setProducts);

  const personalDialogOpen = useAppStore((s) => s.personalDialogOpen);
  const setPersonalDialogOpen = useAppStore((s) => s.setPersonalDialogOpen);

  // Получаем выбранный пользователем язык напрямую из стора
  const language = useAppStore((s) => s.language) as Language;
  const flatCategoryKeywords: Record<string, string[]> = React.useMemo(() => {
    const langMap = categoryKeywords[language] || {};
    return Object.entries(langMap).reduce((acc, [key, arr]) => {
      acc[key] = [...arr];
      return acc;
    }, {} as Record<string, string[]>);
  }, [language]);

  // Стеммер для текущего языка (только ru/en)
  const stem = React.useMemo(() => getStemmer(language), [language]);

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
          listId?: string;
        }>;
        if (Array.isArray(arr)) {
          const cats: Category[] = arr.map((c: any) => ({
            value: c.value,
            label: c.label,
            icon: c.icon && iconMap[c.icon] ? iconMap[c.icon] : null,
            currency: typeof c.currency === 'string' ? c.currency : undefined,
            exchangeRateToListCurrency:
              typeof c.exchangeRateToListCurrency === 'number' ? c.exchangeRateToListCurrency : undefined,
            listId: typeof c.listId === 'string' ? c.listId : undefined,
          }));
          setAvailableCategories(() => {
            const merged: Category[] = isExpenses ? [] : defaultCategories.map((d) => ({ ...d }));
            cats.forEach((c) => {
              if (!merged.find((m) => m.value === c.value)) merged.push(c);
            });

            // Only auto-enrich categories for non-expenses lists (expenses should be fully user-defined)
            if (!isExpenses) {
              const mergedLower = merged.map((c) => c.label.toLowerCase());
              const mergedValues = new Set(merged.map((c) => c.value));
              Object.keys(flatCategoryKeywords).forEach((iconKey) => {
                if (mergedValues.has(iconKey)) return;
                const keywords = flatCategoryKeywords[iconKey] || [];
                const matchesLabel = mergedLower.some((lbl) => {
                  if (stem) {
                    const stemLbl = stem(lbl);
                    return keywords.some((k) => stem(k) === stemLbl);
                  }
                  return keywords.some((k) => lbl.includes(k));
                });
                if (matchesLabel) {
                  const ic = iconMap[iconKey] || null;
                  const label = (t.categoryLabels as Record<string, string>)?.[iconKey] || iconChoices.find((x) => x.key === iconKey)?.label || iconKey;
                  merged.push({ value: iconKey, label, icon: ic });
                }
              });
            }

            return merged;
          });
          localStorage.removeItem('availCats');
        }
      }
    } catch {
      /* ignore malformed local cache */
    }
  }, [userId, t, setAvailableCategories, flatCategoryKeywords, stem, isExpenses]);

  // persist categories locally when unauthenticated so they survive reloads
  React.useEffect(() => {
    if (userId) return;
    try {
      const toStore = availableCategories.map((c) => ({
        value: c.value,
        label: c.label,
        icon: Object.keys(iconMap).find((k) => iconMap[k] === c.icon) || '',
        currency: typeof (c as any).currency === 'string' ? (c as any).currency : undefined,
        listId: typeof (c as any).listId === 'string' ? (c as any).listId : undefined,
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
          // start with defaults (unless we're in expenses mode), then override/append from personalization
          const merged: Category[] = isExpenses ? [] : defaultCategories.map((d) => ({ ...d }));
          data.categories.forEach((c) => {
            const idx = merged.findIndex((m) => m.value === c.value);
            const iconFromPersonal = c.icon && iconMap[c.icon] ? iconMap[c.icon] : null;
            const cat: Category = {
              value: c.value,
              label: c.label,
              icon: iconFromPersonal || merged[idx]?.icon || null,
              budget: typeof c.budget === 'number' ? c.budget : undefined,
              currency: typeof c.currency === 'string' ? c.currency : undefined,
              exchangeRateToListCurrency:
                typeof c.exchangeRateToListCurrency === 'number' ? c.exchangeRateToListCurrency : undefined,
              strictBudget: !!c.strictBudget,
              listId: typeof c.listId === 'string' ? c.listId : undefined,
            };
            if (idx !== -1) {
              merged[idx] = cat;
            } else {
              merged.push(cat);
            }
          });

          // For non-expenses lists, auto-enrich categories by keyword matching.
          // Expenses lists should stay empty unless the user creates categories.
          if (!isExpenses) {
            const mergedLowerLabels = merged.map((c) => c.label.toLowerCase());
            const mergedValues = new Set(merged.map((c) => c.value));
            const toAdd: Category[] = [];
            Object.keys(flatCategoryKeywords).forEach((iconKey) => {
              if (mergedValues.has(iconKey)) return; // already present
              const keywords = flatCategoryKeywords[iconKey] || [];
              // match against existing category labels
              const matchesLabel = mergedLowerLabels.some((lbl) => {
                if (stem) {
                  const stemLbl = stem(lbl);
                  return keywords.some((k) => stem(k) === stemLbl);
                }
                return keywords.some((k) => lbl.includes(k));
              });
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
                Object.keys(flatCategoryKeywords).forEach((iconKey) => {
                  if (mergedValues.has(iconKey)) return;
                  if (toAdd.find((c) => c.value === iconKey)) return;
                  const keywords = flatCategoryKeywords[iconKey] || [];
                  let match = false;
                  if (stem) {
                    const stemName = stem(name);
                    match = keywords.some((k) => stem(k) === stemName);
                  } else {
                    match = keywords.some((k) => name.includes(k));
                  }
                  if (match) {
                    const ic = iconMap[iconKey] || null;
                    const label = (t.categoryLabels as Record<string, string>)?.[iconKey] || iconChoices.find((x) => x.key === iconKey)?.label || iconKey;
                    toAdd.push({ value: iconKey, label, icon: ic });
                  }
                });
              });
            }
            const finalCats = merged.concat(toAdd);
            setAvailableCategories(finalCats);
          } else {
            setAvailableCategories(merged);
          }
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
                Object.keys(flatCategoryKeywords).some((iconKey) => {
                  const kws = flatCategoryKeywords[iconKey] || [];
                  let found = false;
                  if (stem) {
                    const stemLower = stem(lower);
                    found = kws.some((k) => stem(k) === stemLower);
                  } else {
                    found = kws.some((k) => lower.includes(k));
                  }
                  if (found) {
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
  }, [userId, t, setAvailableCategories, setAvailableTemplates, setNameCategoryMap, setProducts, flatCategoryKeywords, stem, isExpenses]);

  React.useEffect(() => {
    if (userId) loadPersonalization();
  }, [userId, loadPersonalization]);

  // when language changes, refresh labels for built-in defaults (preserve user-defined ones)
  React.useEffect(() => {
    if (isExpenses) return;

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
  }, [t, setAvailableCategories, setAvailableTemplates, isExpenses]);

  // persist personalization whenever any of the pieces change
  React.useEffect(() => {
    if (!userId) return;
    savePersonalization(
      userId,
      availableCategories.map((c) => ({
        value: c.value,
        label: c.label,
        icon: Object.keys(iconMap).find((k) => iconMap[k] === c.icon) || '',
        budget:
          typeof (c as any).budget === 'number' && Number.isFinite((c as any).budget)
            ? (c as any).budget
            : undefined,
        currency: typeof (c as any).currency === 'string' ? (c as any).currency : undefined,
        exchangeRateToListCurrency:
          typeof (c as any).exchangeRateToListCurrency === 'number'
            ? (c as any).exchangeRateToListCurrency
            : undefined,
        strictBudget: typeof (c as any).strictBudget === 'boolean' ? (c as any).strictBudget : undefined,
        listId: typeof (c as any).listId === 'string' ? (c as any).listId : undefined,
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
              budget:
                typeof (c as any).budget === 'number' && Number.isFinite((c as any).budget)
                  ? (c as any).budget
                  : undefined,
              currency: typeof (c as any).currency === 'string' ? (c as any).currency : undefined,
              exchangeRateToListCurrency:
                typeof (c as any).exchangeRateToListCurrency === 'number'
                  ? (c as any).exchangeRateToListCurrency
                  : undefined,
            })),
            availableTemplates,
            next,
            products
          ).catch(() => {});
        }
        return next;
      });
    },
    [userId, availableCategories, availableTemplates, products, setProducts, setNameCategoryMap]
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
