import * as React from 'react';
import Head from 'next/head';
import type { IntlShape } from 'react-intl';
import {
  Container,
  Box,
  LinearProgress,
  Fab,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

// shared types, constants and helpers
// constants not referenced directly in this file
import {
  createList as apiCreateList,
  createTodosBulk,
  fetchTodos as apiFetchTodos,
  savePersonalization,
  updateTodo as apiUpdateTodo,
  fetchExchangeRate,
} from '@/lib/api';
import { getCachedExchangeRate, setCachedExchangeRate } from '@/lib/exchangeRates';

import { useViewportHeight } from '@/hooks/useViewportHeight';
import { formatCurrency, iconMap, currencySymbols, iconChoices } from '@/constants';


// Custom hooks
import { useFormAutoCollapse } from '../hooks/useFormAutoCollapse';
import { useTodos } from '../hooks/useTodos';
import { useLists } from '../hooks/useLists';
import useAppStore from '@/stores/useAppStore';
import { useLanguage } from '../contexts/LanguageContext';
import { usePersonalization } from '../hooks/usePersonalization';
import { useHeaderColors } from '../hooks/useHeaderColors';
import { useInitialLists } from '../hooks/useInitialLists';

import TodoForm from '../components/TodoForm';
import AppSnackbar from '../components/AppSnackbar';
import ListTypeSelector from '../components/ListTypeSelector';

// UI components
import Header from '../components/layout/Header';
import SearchBulk from '../components/toolbar/SearchBulk';
import HistoryDialog from '../components/dialogs/HistoryDialog';
import NewListDialog from '../components/dialogs/NewListDialog';
import PersonalizationDialog from '@/components/dialogs/PersonalizationDialog';
import CategoryIconPicker from '@/components/CategoryIconPicker';
import ListToolbar from '../components/toolbar/ListToolbar';
import TodoList from '../components/TodoList';
import AuthPanel from '../components/AuthPanel';


export default function Home() {
  const { t, formatMessage } = useLanguage();

  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const openMenu = (e: React.MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMsg, setSnackbarMsg] = React.useState('');
  const [budgetOverviewOpen, setBudgetOverviewOpen] = React.useState(false);
  const [budgetOverviewMode, setBudgetOverviewMode] = React.useState<'current' | 'overall'>('current');
  const [overallBudgetData, setOverallBudgetData] = React.useState<Array<{
    listId: string;
    name: string;
    budget?: number;
    currency: string;
    spent: number;
    remaining?: number;
    categories: Array<{
      category: string;
      label: string;
      budget: number;
      spent: number;
      over: boolean;
      currency: string;
    }>;
  }>>([]);
  const [overallBudgetLoading, setOverallBudgetLoading] = React.useState(false);


  // Authentication: select only userId to avoid wide re-renders
  const userId = useAppStore((s) => s.userId);
  const listType = useAppStore((s) => s.listType);
  const isExpenses = listType === 'expenses';
  const language = useAppStore((s) => s.language);
  const setListType = useAppStore((s) => s.setListType);

  // List management hook
  const _formatMessage = (id: string, values?: Parameters<IntlShape['formatMessage']>[1]) =>
    formatMessage(id, values);
  const listActions = useLists({
    userId,
    listType,
    onSnackbar: (msg) => {
      setSnackbarMsg(msg);
      setSnackbarOpen(true);
    },
    t,
    formatMessage: _formatMessage,
  });
  const [formOpen, setFormOpen] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);

  // refs для header и toolbar
  const headerRef = React.useRef<HTMLDivElement>(null);
  const toolbarRef = React.useRef<HTMLDivElement>(null);
  // используем хук для вычисления размеров
  const { viewportHeight, listHeight, progressTop } = useViewportHeight(headerRef, toolbarRef, 48, 50);

  // personalization state (categories, templates, products, etc.)
  const {
    availableCategories,
    setAvailableCategories,
    availableTemplates,
    setAvailableTemplates,
    nameCategoryMap,
    products,
    personalDialogOpen,
    setPersonalDialogOpen,
    updateNameCategory,
  } = usePersonalization(userId, t, listType);

  // new-list dialog state
  const [newListDialogOpen, setNewListDialogOpen] = React.useState(false);
  const [newCategoryDialogOpen, setNewCategoryDialogOpen] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState('');
  const [newCategoryBudget, setNewCategoryBudget] = React.useState<number | ''>('');
  const [newCategoryCurrency, setNewCategoryCurrency] = React.useState<string>('RUB');
  const [newCategoryExchangeRate, setNewCategoryExchangeRate] = React.useState<number | ''>(1);
  const [newCategoryStrictBudget, setNewCategoryStrictBudget] = React.useState(false);
  const [newCategoryIconKey, setNewCategoryIconKey] = React.useState('');
  const [initialCategory, setInitialCategory] = React.useState('');
  const [categoryPickerOpen, setCategoryPickerOpen] = React.useState(false);
  const [editingCategoryValue, setEditingCategoryValue] = React.useState<string | null>(null);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = React.useState(false);
  const [deletingCategoryValue, setDeletingCategoryValue] = React.useState<string | null>(null);

  const [currencyRateDialogOpen, setCurrencyRateDialogOpen] = React.useState(false);
  const [currencyRateValues, setCurrencyRateValues] = React.useState<Record<string, number | undefined>>({});
  const [exchangeRateLoading, setExchangeRateLoading] = React.useState(false);
  const [exchangeRateError, setExchangeRateError] = React.useState<string | null>(null);
  const prevListRef = React.useRef<{ id: string | null; currency: string | null }>({ id: null, currency: null });


  // Todo management hook
  const categoryBudgets = React.useMemo(() => {
    const map: Record<string, number> = {};
    const currentListId = listActions.currentListId;

    availableCategories
      .filter((c) => {
        if (listType === 'expenses') {
          // For expenses, only show budgets for categories in the current list
          return c.listId === currentListId;
        }
        return true;
      })
      .forEach((c) => {
        if (typeof c.budget === 'number') {
          map[c.value] = c.budget;
        }
      });

    return map;
  }, [availableCategories, listActions.currentListId, listType]);

  const categoryExchangeRates = React.useMemo(() => {
    const map: Record<string, number> = {};
    const currentListId = listActions.currentListId;

    availableCategories
      .filter((c) => {
        if (listType === 'expenses') {
          return c.listId === currentListId;
        }
        return true;
      })
      .forEach((c) => {
        const rate = c.exchangeRateToListCurrency;
        if (typeof rate === 'number' && rate > 0) {
          map[c.value] = rate;
        }
      });

    return map;
  }, [availableCategories, listActions.currentListId, listType]);

  const todoActions = useTodos({
    currentListId: listActions.currentListId,
    listDefaultColor: listActions.listDefaultColor,
    listType,
    listBudget: listActions.currentList?.budget,
    listCurrency: listActions.currentList?.currency,
    strictBudget: !!listActions.currentList?.strictBudget,
    categoryBudgets,
    categoryExchangeRates,
    onSnackbar: (msg) => {
      setSnackbarMsg(msg);
      setSnackbarOpen(true);
    },
    t,
    formatMessage,
    nameCategoryMap,
    products,
  });

  const openNewCategoryDialog = (budget?: number) => {
    setEditingCategoryValue(null);
    setNewCategoryName('');
    setNewCategoryBudget(budget ?? '');
    const listCurrency = listActions.currentList?.currency || 'RUB';
    setNewCategoryCurrency(listCurrency);
    setNewCategoryExchangeRate(1);
    setNewCategoryStrictBudget(false);
    setNewCategoryIconKey('');
    setExchangeRateError(null);
    setNewCategoryDialogOpen(true);
  };

  const getExchangeRate = React.useCallback(
    async (from: string, to: string) => {
      const cached = getCachedExchangeRate(from, to);
      if (typeof cached === 'number') return cached;

      setExchangeRateError(null);
      setExchangeRateLoading(true);
      try {
        const rate = await fetchExchangeRate(from, to);
        setCachedExchangeRate(from, to, rate);
        return rate;
      } catch (err) {
        setExchangeRateError(t.messages.fetchExchangeRateError);
        throw err;
      } finally {
        setExchangeRateLoading(false);
      }
    },
    [t.messages.fetchExchangeRateError]
  );

  const currencyRateTargets = React.useMemo(() => {
    const currentList = listActions.currentList;
    if (!currentList) return [];
    return availableCategories
      .filter(
        (c) =>
          c.listId === currentList._id &&
          c.currency &&
          c.currency !== currentList.currency
      )
      .map((c) => ({ value: c.value, label: c.label, currency: c.currency || '' }));
  }, [availableCategories, listActions.currentList]);

  React.useEffect(() => {
    const currentList = listActions.currentList;
    const prev = prevListRef.current;
    if (
      currentList &&
      prev.id === currentList._id &&
      prev.currency &&
      currentList.currency &&
      prev.currency !== currentList.currency
    ) {
      // Detect currency change within the same list and prompt for exchange rates
      const categoriesToUpdate = currencyRateTargets;
      if (categoriesToUpdate.length > 0) {
        setExchangeRateError(null);
        setCurrencyRateValues(
          Object.fromEntries(
            categoriesToUpdate.map((c) => {
              const existing = availableCategories.find((ac) => ac.value === c.value);
              const existingRate = existing?.exchangeRateToListCurrency;
              return [c.value, typeof existingRate === 'number' ? existingRate : 1];
            })
          )
        );
        setCurrencyRateDialogOpen(true);
      }
    }

    prevListRef.current = {
      id: currentList?._id || null,
      currency: currentList?.currency || null,
    };
  }, [currencyRateTargets, listActions.currentList, availableCategories]);

  const handleSaveCurrencyRates = async () => {
    const invalid = Object.values(currencyRateValues).some(
      (v) => typeof v !== 'number' || v <= 0
    );
    if (invalid) return;

    const nextCategories = availableCategories.map((c) => {
      if (c.listId !== listActions.currentListId) return c;
      if (!currencyRateValues[c.value]) return c;
      return {
        ...c,
        exchangeRateToListCurrency: currencyRateValues[c.value],
      };
    });

    setAvailableCategories(nextCategories);

    if (userId) {
      try {
        const storedCategories = nextCategories.map((c) => ({
          value: c.value,
          label: c.label,
          icon: Object.keys(iconMap).find((k) => iconMap[k] === c.icon) || '',
          budget: typeof c.budget === 'number' ? c.budget : undefined,
          currency: typeof c.currency === 'string' ? c.currency : undefined,
          exchangeRateToListCurrency:
            typeof c.exchangeRateToListCurrency === 'number' ? c.exchangeRateToListCurrency : undefined,
          strictBudget: typeof c.strictBudget === 'boolean' ? c.strictBudget : undefined,
          listId: typeof c.listId === 'string' ? c.listId : undefined,
        }));
        await savePersonalization(userId, storedCategories);
      } catch {
        // ignore
      }
    }

    setCurrencyRateDialogOpen(false);
  };

  const handleFetchRatesForAll = React.useCallback(async () => {
    const listCurrency = listActions.currentList?.currency;
    if (!listCurrency) return;

    setExchangeRateError(null);
    setExchangeRateLoading(true);
    try {
      const updates: Record<string, number> = {};
      await Promise.all(
        currencyRateTargets.map(async (cat) => {
          const rate = await getExchangeRate(listCurrency, cat.currency);
          updates[cat.value] = rate;
        })
      );
      setCurrencyRateValues((prev) => ({ ...prev, ...updates }));
    } catch (e) {
      setExchangeRateError(t.messages.fetchExchangeRateError);
    } finally {
      setExchangeRateLoading(false);
    }
  }, [currencyRateTargets, listActions.currentList?.currency, getExchangeRate, t.messages.fetchExchangeRateError]);

  React.useEffect(() => {
    if (!currencyRateDialogOpen) return;
    if (currencyRateTargets.length === 0) return;
    handleFetchRatesForAll();
  }, [currencyRateDialogOpen, currencyRateTargets, handleFetchRatesForAll]);

  React.useEffect(() => {
    if (!newCategoryDialogOpen) return;

    const listCurrency = listActions.currentList?.currency;
    if (!listCurrency) return;
    if (!newCategoryCurrency || newCategoryCurrency === listCurrency) return;

    // Auto-fetch rate when creating a new category in a different currency.
    (async () => {
      try {
        const rate = await getExchangeRate(listCurrency, newCategoryCurrency);
        setNewCategoryExchangeRate(rate);
      } catch {
        // user will enter manually
      }
    })();
  }, [newCategoryDialogOpen, newCategoryCurrency, listActions.currentList?.currency, getExchangeRate]);

  const openEditCategoryDialog = async (categoryValue: string) => {
    // Prefer list-scoped categories, but fall back to global ones when needed.
    const cat =
      availableCategories.find(
        (c) => c.value === categoryValue && c.listId === listActions.currentListId
      ) || availableCategories.find((c) => c.value === categoryValue);
    if (!cat) return;

    const listCurrency = listActions.currentList?.currency || 'RUB';
    const categoryCurrency = cat.currency || listCurrency;

    setEditingCategoryValue(categoryValue);
    setNewCategoryName(cat.label);
    setNewCategoryBudget(typeof cat.budget === 'number' ? cat.budget : '');
    setNewCategoryCurrency(categoryCurrency);
    setNewCategoryStrictBudget(!!cat.strictBudget);
    setNewCategoryIconKey(
      Object.keys(iconMap).find((k) => iconMap[k] === cat.icon) || ''
    );

    const existingRate =
      categoryCurrency !== listCurrency &&
      typeof cat.exchangeRateToListCurrency === 'number'
        ? cat.exchangeRateToListCurrency
        : 1;

    setNewCategoryExchangeRate(existingRate);
    setExchangeRateError(null);

    // Try to auto-fetch a fresh rate if currency differs from list currency.
    if (categoryCurrency !== listCurrency) {
      try {
        const rate = await getExchangeRate(listCurrency, categoryCurrency);
        setNewCategoryExchangeRate(rate);
      } catch {
        // allow manual override
      }
    }

    setNewCategoryDialogOpen(true);
  };

  const handleDeleteCategory = async (categoryValue: string) => {
    const nextCategories = availableCategories.filter(
      (c) => !(c.value === categoryValue && c.listId === listActions.currentListId)
    );

    setAvailableCategories(nextCategories);

    if (userId) {
      try {
        const storedCategories = nextCategories.map((c) => ({
          value: c.value,
          label: c.label,
          icon: Object.keys(iconMap).find((k) => iconMap[k] === c.icon) || '',
          budget: typeof c.budget === 'number' ? c.budget : undefined,
          currency: typeof c.currency === 'string' ? c.currency : undefined,
          strictBudget: typeof c.strictBudget === 'boolean' ? c.strictBudget : undefined,
          listId: typeof c.listId === 'string' ? c.listId : undefined,
        }));
        await savePersonalization(userId, storedCategories);
      } catch {
        // ignore failures (still have local state updated)
      }
    }
  };

  const openDeleteCategoryDialog = (categoryValue: string) => {
    setDeletingCategoryValue(categoryValue);
    setDeleteCategoryDialogOpen(true);
  };

  const closeDeleteCategoryDialog = () => {
    setDeletingCategoryValue(null);
    setDeleteCategoryDialogOpen(false);
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategoryValue) return;

    // delete all todos in this category first
    const idsToDelete = todoActions.todos
      .filter((t) => t.category === deletingCategoryValue)
      .map((t) => t._id);
    await Promise.all(idsToDelete.map((id) => todoActions.deleteTodo(id)));

    await handleDeleteCategory(deletingCategoryValue);
    await todoActions.fetchTodos(listActions.currentListId || '');

    // close parent dialogs if we were editing
    setNewCategoryDialogOpen(false);
    setEditingCategoryValue(null);
    setNewCategoryIconKey('');
    closeDeleteCategoryDialog();
  };


  const availableCategoriesForList = React.useMemo(() => {
    const currentListId = listActions.currentListId;

    // For expenses we prefer list-scoped categories, but also allow "global" categories
    // (those without listId) to appear so they don't disappear if listId was lost.
    if (listType === 'expenses') {
      if (!currentListId) return [];
      // For expenses lists, categories are strictly scoped to the list via listId.
      // This prevents updates in one list from affecting another.
      return availableCategories.filter((c) => c.listId === currentListId);
    }

    return availableCategories.filter((c) => !c.listId || c.listId === currentListId);
  }, [availableCategories, listActions.currentListId, listType, todoActions.todos, t]);

  // For expenses lists we want to keep category state strict: if a todo has a category
  // that no longer exists for this list, clear it (clean up "lost" categories).
  const cleanedStaleCategoriesRef = React.useRef<{ listId: string | null; key: string } | null>(null);
  React.useEffect(() => {
    if (listType !== 'expenses') return;
    const currentListId = listActions.currentListId;
    if (!currentListId) return;

    const validCategories = new Set(availableCategoriesForList.map((c) => c.value));
    const key = [...validCategories].sort().join(',');
    if (cleanedStaleCategoriesRef.current?.listId === currentListId && cleanedStaleCategoriesRef.current.key === key) {
      return;
    }

    const invalidTodos = todoActions.todos.filter(
      (t) => t.category && t.category.trim() && !validCategories.has(t.category)
    );
    if (invalidTodos.length === 0) {
      cleanedStaleCategoriesRef.current = { listId: currentListId, key };
      return;
    }

    Promise.all(
      invalidTodos.map((todo) =>
        apiUpdateTodo(todo._id, { listId: currentListId, category: '' }).catch(() => {})
      )
    ).finally(() => {
      todoActions.setTodos((prev) =>
        prev.map((t) =>
          t.category && !validCategories.has(t.category) ? { ...t, category: '' } : t
        )
      );
      cleanedStaleCategoriesRef.current = { listId: currentListId, key };
    });
  }, [listType, listActions.currentListId, availableCategoriesForList, todoActions]);

  // Reset category selection when form closes (to avoid pre-filling it on next open).
  React.useEffect(() => {
    if (!formOpen) {
      setInitialCategory('');
    }
  }, [formOpen]);

  // When switching lists, close category dialogs and clear initial selection.
  React.useEffect(() => {
    setCategoryPickerOpen(false);
    setNewCategoryDialogOpen(false);
    setEditingCategoryValue(null);
    setInitialCategory('');
  }, [listActions.currentListId]);

  const isExchangeRateRequired =
    !!listActions.currentList?.currency &&
    newCategoryCurrency &&
    listActions.currentList.currency !== newCategoryCurrency;

  const isExchangeRateValid =
    !isExchangeRateRequired ||
    (typeof newCategoryExchangeRate === 'number' && newCategoryExchangeRate > 0);

  const handleCreateCategoryWithBudget = async () => {
    if (!isExchangeRateValid) {
      setSnackbarMsg(t.messages.invalidExchangeRate);
      setSnackbarOpen(true);
      return;
    }

    const name = newCategoryName.trim();
    if (!name) {
      setSnackbarMsg(t.messages.saveError);
      setSnackbarOpen(true);
      return;
    }

    // When editing an existing category, keep its original value (key) so todos linked to it stay connected.
    const categoryValue = editingCategoryValue
      ? editingCategoryValue
      : name.toLowerCase().replace(/\s+/g, '-');
    const budgetValue = isExpenses && typeof newCategoryBudget === 'number' && Number.isFinite(newCategoryBudget)
      ? newCategoryBudget
      : undefined;
    const currentListId = listActions.currentListId;

    // Expenses lists should treat categories as scoped to a list.
    // Otherwise updating a category in one list would accidentally update it for all lists.
    const existingIndex = availableCategories.findIndex((c) => {
      if (c.value !== categoryValue) return false;
      if (listType === 'expenses') {
        return c.listId === currentListId;
      }
      return true;
    });

    const nextCategories = [...availableCategories];
    const selectedIcon = newCategoryIconKey && iconMap[newCategoryIconKey] ? iconMap[newCategoryIconKey] : null;

    const listCurrency = listActions.currentList?.currency;
    const exchangeRate = isExpenses
      ? listCurrency && newCategoryCurrency && newCategoryCurrency !== listCurrency
        ? (typeof newCategoryExchangeRate === 'number' ? newCategoryExchangeRate : undefined)
        : undefined
      : undefined;
    const currencyValue = isExpenses ? newCategoryCurrency : undefined;
    const strictBudgetValue = isExpenses ? newCategoryStrictBudget : false;

    // Internally we store rate as: how many list currency units = 1 category currency unit.
    // This matches the UI prompt "1 <list currency> = ? <category currency>".
    // The user should enter a value like 3.2 if 1 USD = 3.2 ILS.

    if (existingIndex !== -1) {
      // update budget/currency/icon for existing category
      nextCategories[existingIndex] = {
        ...nextCategories[existingIndex],
        label: name,
        icon: selectedIcon,
        budget: budgetValue,
        currency: currencyValue,
        exchangeRateToListCurrency: exchangeRate,
        strictBudget: strictBudgetValue,
      };
    } else {
      nextCategories.push({
        value: categoryValue,
        label: name,
        icon: selectedIcon,
        budget: budgetValue,
        currency: currencyValue,
        exchangeRateToListCurrency: exchangeRate,
        strictBudget: strictBudgetValue,
        listId: listActions.currentListId || undefined,
      });
    }

    setAvailableCategories(nextCategories);

    if (userId) {
      try {
        const storedCategories = nextCategories.map((c) => ({
          value: c.value,
          label: c.label,
          icon: Object.keys(iconMap).find((k) => iconMap[k] === c.icon) || '',
          budget: typeof c.budget === 'number' ? c.budget : undefined,
          currency: typeof c.currency === 'string' ? c.currency : undefined,
          strictBudget: typeof c.strictBudget === 'boolean' ? c.strictBudget : undefined,
          listId: typeof c.listId === 'string' ? c.listId : undefined,
        }));
        await savePersonalization(userId, storedCategories);
      } catch {
        // ignore failures (still have local state updated)
      }
    }

    setNewCategoryDialogOpen(false);
    setEditingCategoryValue(null);
    setNewCategoryIconKey('');
  };

  const convertToListCurrency = React.useCallback(
    (amount: number, category?: string): number => {
      // rate is stored as: 1 list currency = X category currency
      // so to convert an amount in category currency into list currency, divide by the rate.
      const rate = categoryExchangeRates[category ?? ''] ?? 1;
      if (rate > 0) return amount / rate;
      return amount;
    },
    [categoryExchangeRates]
  );

  const categorySpend = React.useMemo(() => {
    const spend: Record<string, number> = {};
    todoActions.todos.forEach((todo) => {
      if (typeof todo.amount !== 'number') return;
      const cat = todo.category || '';
      spend[cat] = (spend[cat] || 0) + todo.amount;
    });
    return spend;
  }, [todoActions.todos]);

  const totalSpent = React.useMemo(() => {
    return todoActions.todos.reduce((sum, t) => {
      if (typeof t.amount !== 'number') return sum;
      return sum + convertToListCurrency(t.amount, t.category);
    }, 0);
  }, [todoActions.todos, convertToListCurrency]);

  // derive categories that actually appear in the current todos list
  const filterCategories = React.useMemo(() => {
    const result = [...availableCategoriesForList];

    const present = new Set(
      (todoActions.todos || [])
        .map((x) => (x.category || '').trim())
        .filter((v) => v)
    );

    // ensure any category used in todos (even if not in personalization) remains selectable
    present.forEach((val) => {
      if (!result.find((r) => r.value === val)) {
        const label = (t.categoryLabels as Record<string, string>)?.[val] || val;
        result.push({ value: val, label, icon: null });
      }
    });

    return result;
  }, [todoActions.todos, availableCategoriesForList, t]);



  // wrapper used when user wants to add an item; create category first

  const handleListChange = React.useCallback(
    async (id: string) => {
      await listActions.selectList(id);
      // recompute color from up-to-date lists array
      const list = listActions.lists.find((l) => l._id === id);
      todoActions.setColor(list?.defaultColor || '#ffffff');
      if (id) await todoActions.fetchTodos(id);
    },
    // listActions identity is stable inside hook, todoActions used by ESLint but it's safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [listActions]
  );


  // load lists when userId changes
  useInitialLists(
    userId,
    listType,
    listActions,
    todoActions,
    setFormOpen,
    setNewListDialogOpen
  );

  const fetchOverallBudget = React.useCallback(async () => {
    if (!userId) return;
    setOverallBudgetLoading(true);

    const activeLists = listActions.lists.filter((l) => !l.completed && l.type === 'expenses');
    const results = await Promise.all(
      activeLists.map(async (list) => {
        const todos = await apiFetchTodos(list._id);

        const categoryRateMap: Record<string, number> = {};
        availableCategories
          .filter((c) => c.listId === list._id)
          .forEach((c) => {
            const rate = c.exchangeRateToListCurrency;
            if (typeof rate === 'number' && rate > 0) {
              categoryRateMap[c.value] = rate;
            }
          });

        const convertToListCurrency = (amount: number, category?: string) => {
          const rate = categoryRateMap[category ?? ''] ?? 1;
          return rate > 0 ? amount / rate : amount;
        };

        const spent = todos.reduce(
          (sum, t) =>
            sum + (typeof t.amount === 'number' ? convertToListCurrency(t.amount, t.category) : 0),
          0
        );
        const categorySpend: Record<string, number> = {};
        todos.forEach((t) => {
          if (typeof t.amount !== 'number') return;
          const cat = t.category || '';
          categorySpend[cat] = (categorySpend[cat] || 0) + t.amount;
        });

        const categories = availableCategories
          .filter((c) => c.listId === list._id && typeof c.budget === 'number')
          .map((c) => {
            const budget = c.budget as number;
            const cat = c.value || '';
            const spentCat = categorySpend[cat] || 0;
            return {
              category: cat,
              label: c.label,
              budget,
              spent: spentCat,
              over: spentCat > budget,
              currency: c.currency || list.currency || 'RUB',
            };
          });

        return {
          listId: list._id,
          name: list.name,
          budget: typeof list.budget === 'number' ? list.budget : undefined,
          currency: list.currency || 'RUB',
          spent,
          remaining: typeof list.budget === 'number' ? list.budget - spent : undefined,
          categories,
        };
      })
    );

    setOverallBudgetData(results);
    setOverallBudgetLoading(false);
  }, [userId, listActions.lists, availableCategories]);

  React.useEffect(() => {
    if (listActions.viewingHistory) setFormOpen(false);
    // when switching back out of history, reload todos for current list
    if (!listActions.viewingHistory && listActions.currentListId) {
      todoActions.fetchTodos(listActions.currentListId);
    }
    // also refresh overall budget when switching lists
    if (budgetOverviewOpen && budgetOverviewMode === 'overall') {
      fetchOverallBudget();
    }
    // todoActions is intentionally omitted to avoid refetch loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listActions.viewingHistory, listActions.currentListId, budgetOverviewOpen, budgetOverviewMode, fetchOverallBudget]);

  const headerColor =
    (listActions.currentList && listActions.currentList.defaultColor) ||
    listActions.listDefaultColor ||
    '#ffffff';
  const { effectiveHeaderTextColor } = useHeaderColors(headerColor, menuAnchor);

  const headerTitle = listType ? _formatMessage(`listTypes.${listType}`) : t.header.title;

  // keep ref in sync so scroll handler can read latest value without needing it as a dependency
  // hook will handle auto‑collapse on scroll/keyboard; increase threshold so collapse happens later
  useFormAutoCollapse(formOpen, setFormOpen, menuAnchor, { collapseThreshold: 120 });

  const openNewListDialog = () => {
    setNewListDialogOpen(true);
  };


  return (
    <Container
      maxWidth="sm"
      suppressHydrationWarning
      sx={{
        mt: 3,
        mb: 3,
        // lock overall container to viewport height so the page itself never scrolls
        // reserve any bottom safe-area inset so content never slides under browser menu
      // include a small extra buffer (50px) for persistent nav bars that don't report
      // their height via safe-area-inset. fall back to 100vh initially to avoid blank
      // screen during SSR/hydration.
      // subtract vertical margins (4*8px each) plus safe area and buffer
      height: viewportHeight
      ? `calc(${viewportHeight}px - env(safe-area-inset-bottom) - 50px - 48px)`
      : 'calc(100vh - 48px)',
        overflow: listType ? 'hidden' : 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Head>
        <title>{t.header.title}</title>
      </Head>
      <div ref={headerRef}>
        <Header headerColor={headerColor} effectiveHeaderTextColor={effectiveHeaderTextColor} t={t} title={headerTitle} />
      </div>
      {!userId ? (
        <AuthPanel t={t} formatMessage={_formatMessage} onSnackbar={(msg) => { setSnackbarMsg(msg); setSnackbarOpen(true); }} />
      ) : !listType ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <ListTypeSelector
            t={t}
            onSelect={(type) => {
              setListType(type);
              setSnackbarMsg('');
              setSnackbarOpen(false);
            }}
          />
        </Box>
      ) : (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {listActions.isLoading && <LinearProgress />}
          <div ref={toolbarRef}>
            <ListToolbar
              lists={listActions.lists}
              listsLoading={listActions.isLoading}
              currentListId={listActions.currentListId}
              onSelectList={handleListChange}
              listDefaultColor={listActions.listDefaultColor}
              setListDefaultColor={listActions.setListDefaultColor}
              saveListColor={() => {
                if (!listActions.currentListId) return;
                listActions.updateListColor(listActions.currentListId, listActions.listDefaultColor);
              }}
              openNewListDialog={openNewListDialog}
              setHistoryOpen={setHistoryOpen}
              formOpen={formOpen}
              bulkMode={todoActions.bulkMode}
              toggleBulkMode={() => todoActions.setBulkMode(!todoActions.bulkMode)}
              menuAnchor={menuAnchor}
              openMenu={openMenu}
              closeMenu={closeMenu}
              setSnackbarMsg={setSnackbarMsg}
              setSnackbarOpen={setSnackbarOpen}
              openPersonalDialog={() => setPersonalDialogOpen(true)}
              completeCurrentList={async () => {
                if (!listActions.currentListId) return;
                const completedId = listActions.currentListId;
                await listActions.completeList(completedId);
                todoActions.setTodos([]);

                // After completion, if a new active list is selected, load its todos.
                const nextId = listActions.currentListId;
                if (nextId && nextId !== completedId) {
                  await todoActions.fetchTodos(nextId);
                }
              }}
              updateShareToken={listActions.updateShareToken}
              updateBudget={listActions.updateListBudget}
              updateStrictBudget={listActions.updateListStrictBudget}
              onOpenBudgetOverview={() => setBudgetOverviewOpen(true)}
              onAddCategoryWithBudget={(budget?: number) => openNewCategoryDialog(budget)}
              listType={listType}
              t={t}
              formatMessage={_formatMessage}
            />
          </div>

          {/* search field and optional bulk toolbar */}
          <SearchBulk
            filterText={todoActions.filterText}
            onFilterChange={todoActions.setFilterText}
            categories={filterCategories}
            currentCategory={todoActions.filterCategory}
            onCategoryChange={async (val: string) => {
              todoActions.setFilterCategory(val);
              if (listActions.currentListId) await todoActions.fetchTodos(listActions.currentListId, val);
            }}
            bulkMode={todoActions.bulkMode}
            selectedCount={todoActions.selectedIds.size}
            onBulkComplete={todoActions.bulkComplete}
            onBulkDelete={todoActions.bulkDelete}
            onCancelBulk={() => {
              todoActions.setBulkMode(false);
              todoActions.clearSelection();
            }}
            t={t}
          />

          {/* pinned progress under search */}
          {(() => {
            const completedCount = todoActions.todos.filter((t) => t.completed).length;
            const totalTodos = todoActions.todos.length;
            const progressValue = totalTodos === 0 ? 0 : (completedCount / totalTodos) * 100;

            return (
              <Box
                sx={{
                  position: 'sticky',
                  top: progressTop,
                  zIndex: 700,
                  px: 0,
                  py: 0,
                  bgcolor: 'transparent',
                  borderBottom: `1px solid theme.palette.divider`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
                  <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    <LinearProgress
                      variant="determinate"
                      value={progressValue}
                      sx={{
                        height: 10,
                        borderRadius: 9999,
                        backgroundColor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.04)'
                            : 'rgba(15,23,42,0.06)',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(90deg, #F59E0B 0%, #F97316 100%)',
                          transition: 'width 150ms ease',
                        },
                      }}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={(theme) => ({
                      color: theme.palette.mode === 'light' ? theme.palette.secondary.contrastText : theme.palette.secondary.main,
                      marginInlineStart: 1,
                      minWidth: 56,
                      textAlign: 'right',
                      direction: 'ltr', // Force LTR for numbers
                    })}
                  >
                    {completedCount} / {totalTodos}
                  </Typography>
                </Box>
              </Box>
            );
          })()}

          {!listActions.viewingHistory && (
            <TodoForm
              todoActions={todoActions}
              availableCategories={availableCategoriesForList}
              setAvailableCategories={setAvailableCategories}
              updateNameCategory={updateNameCategory}
              nameCategoryMap={nameCategoryMap}
              products={products}
              listDefaultColor={listActions.listDefaultColor}
              t={t}
              formOpen={formOpen}
              setFormOpen={setFormOpen}
              dialogMode // render inside dialog
              listType={listType}
              listId={listActions.currentListId}
              initialCategory={initialCategory}
            />
          )}

          {/* compute list box height on mount/resize */}


          {/* always show todos list regardless of history state */}
          {/* scrollable list takes remaining space; page container never scrolls */}
          {/* reserve extra space under the list so the fixed add-button doesnt obscure items
           and ensure the containers bottom sits ~20px below the buttons bottom edge */}
          <Box
            sx={{
              height: listHeight ? `${listHeight}px` : 'auto',
              overflowY: 'auto',
              // fab sits 24px above the viewport bottom and is 56px tall; add another 20px gap
              paddingBottom: `calc(env(safe-area-inset-bottom) + 100px)`,
            }}
          >
            <TodoList
              todoActions={todoActions}
              listActions={listActions}
              availableCategories={availableCategoriesForList}
              t={t}
              listType={listType}
              onEdit={() => setFormOpen(true)}
              onAddToCategory={(category) => {
                setInitialCategory(category);
                setFormOpen(true);
              }}
              onEditCategory={(categoryValue) => openEditCategoryDialog(categoryValue)}
              onDeleteCategory={(categoryValue) => openDeleteCategoryDialog(categoryValue)}
            />
          </Box>
          {/* floating add button bottom-right */}
          <Box
            sx={{
              position: 'fixed',
              bottom: 24,
              insetInlineEnd: 24,
              zIndex: 1300,
            }}
          >
            <Fab
              onClick={() => setCategoryPickerOpen(true)}
              aria-label="add"
            >
              <AddIcon />
            </Fab>
          </Box>
          <Dialog
            open={categoryPickerOpen}
            onClose={() => setCategoryPickerOpen(false)}
            fullWidth
            maxWidth="xs"
            PaperProps={{ className: 'glass' }}
          >
            <DialogTitle>{t.todos.category}</DialogTitle>
            <DialogContent>
              <Typography sx={{ mb: 1 }}>
                {t.todos.category}
              </Typography>

              {listType === 'expenses' && availableCategoriesForList.length === 0 ? (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {language === 'ru'
                      ? 'Категории ещё не созданы — создайте первую, чтобы распределять расходы.'
                      : 'No categories yet — create one to organize your expenses.'}
                  </Typography>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => {
                      setCategoryPickerOpen(false);
                      openNewCategoryDialog();
                    }}
                  >
                    {language === 'ru' ? 'Создать категорию' : 'Create category'}
                  </Button>
                </Box>
              ) : null}

              <List>
                <ListItemButton
                  onClick={() => {
                    setInitialCategory('');
                    setCategoryPickerOpen(false);
                    setFormOpen(true);
                  }}
                >
                  <ListItemText
                    primary={(t.categoryLabels as Record<string, string>)?.[''] || '(none)'}
                  />
                </ListItemButton>
                {availableCategoriesForList.map((cat) => (
                  <ListItemButton
                    key={cat.value}
                    onClick={() => {
                      setInitialCategory(cat.value);
                      setCategoryPickerOpen(false);
                      setFormOpen(true);
                    }}
                  >
                    {cat.icon ? (
                      <ListItemIcon>{React.createElement(cat.icon)}</ListItemIcon>
                    ) : null}
                    <ListItemText primary={cat.label} />
                  </ListItemButton>
                ))}
              </List>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => setCategoryPickerOpen(false)}>
                {t.buttons.cancel}
              </Button>
            </DialogActions>
          </Dialog>

          {/* history dialog instead of inline section */}
          <HistoryDialog
            open={historyOpen}
            loading={listActions.isLoading}
            lists={listActions.lists}
            onSelect={(l) => {
              listActions.selectList(l._id);
              listActions.setViewingHistory(true);
              todoActions.fetchTodos(l._id);
              setHistoryOpen(false);
            }}
            onClose={() => setHistoryOpen(false)}
            t={t}
          />
              <NewListDialog
            open={newListDialogOpen}
            onClose={() => setNewListDialogOpen(false)}
            availableTemplates={availableTemplates}
            t={t}
            onCreate={async (name, templateName) => {
              if (!userId) return false;
              const created = await apiCreateList(userId, name, '#ffffff', listType || undefined);
              if (created) {
                if (templateName) {
                  const tmpl = availableTemplates.find((t) => t.name === templateName);
                  if (tmpl) {
                    const results = await createTodosBulk(created._id, tmpl.items);
                    try {
                      const count = Array.isArray(results) ? results.length : tmpl.items.length;
                      setSnackbarMsg(formatMessage('messages.itemsAdded', { count }));
                      setSnackbarOpen(true);
                    } catch {
                      // ignore formatting errors
                    }
                  }
                }
                await listActions.loadLists();
                await listActions.selectList(created._id);
                todoActions.setColor(created.defaultColor || '#ffffff');
                if (listType === 'shopping') {
                  setFormOpen(true);
                }
                await todoActions.fetchTodos(created._id);
                return true;
              }
              return false;
            }}
          />

          <PersonalizationDialog
            open={personalDialogOpen}
            onClose={() => setPersonalDialogOpen(false)}
            userId={userId}
            availableCategories={availableCategories}
            setAvailableCategories={setAvailableCategories}
            availableTemplates={availableTemplates}
            setAvailableTemplates={setAvailableTemplates}
            products={products}
            setSnackbarMsg={setSnackbarMsg}
            setSnackbarOpen={setSnackbarOpen}
            t={t}
            formatMessage={_formatMessage}
          />

          <Dialog
            open={budgetOverviewOpen}
            onClose={() => setBudgetOverviewOpen(false)}
            fullWidth
            maxWidth="sm"
            PaperProps={{ className: 'glass' }}
          >
            <DialogTitle>
              {budgetOverviewMode === 'current'
                ? t.lists.budgetOverview
                : t.lists.overallBudget}
            </DialogTitle>

            <DialogContent>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant={budgetOverviewMode === 'current' ? 'contained' : 'outlined'}
                  onClick={() => setBudgetOverviewMode('current')}
                  size="small"
                >
                  {t.lists.budgetOverview}
                </Button>
                <Button
                  variant={budgetOverviewMode === 'overall' ? 'contained' : 'outlined'}
                  onClick={() => {
                    setBudgetOverviewMode('overall');
                    fetchOverallBudget();
                  }}
                  size="small"
                >
                  {t.lists.overallBudget}
                </Button>
              </Box>

              {budgetOverviewMode === 'current' ? (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {t.lists.budget}: {typeof listActions.currentList?.budget === 'number'
                        ? formatCurrency(listActions.currentList.budget, listActions.currentList?.currency)
                        : '-'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {t.todos.spent}: {formatCurrency(totalSpent, listActions.currentList?.currency)}
                      {typeof listActions.currentList?.budget === 'number'
                        ? ` / ${formatCurrency(listActions.currentList.budget, listActions.currentList?.currency)}`
                        : ''}
                    </Typography>
                    {typeof listActions.currentList?.budget === 'number' && (
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, (totalSpent / listActions.currentList.budget) * 100)}
                        sx={{ height: 10, borderRadius: 6, mb: 1 }}
                      />
                    )}
                    {typeof listActions.currentList?.budget === 'number' && (
                      <Typography variant="caption" color={
                        totalSpent > (listActions.currentList?.budget ?? 0) ? 'error' : 'text.secondary'
                      }>
                        {totalSpent > (listActions.currentList?.budget ?? 0)
                          ? t.todos.overBudget
                          : `${t.todos.remaining}: ${(listActions.currentList.budget - totalSpent).toFixed(2)}`}
                      </Typography>
                    )}
                  </Box>
                  {Object.entries(categoryBudgets)
                    .filter(([_, b]) => typeof b === 'number')
                    .map(([cat, b]) => {
                      const spent = categorySpend[cat] ?? 0;
                      const remaining = b - spent;
                      const over = remaining < 0;
                      const label =
                        (t.categoryLabels as Record<string, string>)?.[cat] ||
                        availableCategories.find((c) => c.value === cat)?.label ||
                        cat;
                      return (
                        <Box
                          key={cat}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            py: 0.75,
                            px: 1,
                            borderRadius: 1,
                            backgroundColor: (theme) =>
                              theme.palette.mode === 'dark'
                                ? 'rgba(255,255,255,0.02)'
                                : 'rgba(0,0,0,0.04)',
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="body2" sx={{ color: over ? 'error.main' : 'text.primary' }}>
                            {label}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: over ? 'error.main' : 'text.secondary' }}
                          >
                            {t.todos.spent}: {formatCurrency(spent, (availableCategories.find((c) => c.value === cat)?.currency) || listActions.currentList?.currency)} / {t.lists.budget}: {formatCurrency(b, (availableCategories.find((c) => c.value === cat)?.currency) || listActions.currentList?.currency)}
                            {over ? ` (${t.todos.overBudget})` : ''}
                          </Typography>
                        </Box>
                      );
                    })}
                </>
              ) : (
                <>
                  {overallBudgetLoading ? (
                    <Box sx={{ py: 2 }}>
                      <LinearProgress />
                    </Box>
                  ) : (
                    <>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        {t.lists.totalBudget}
                      </Typography>
                      {overallBudgetData.map((data) => (
                        <Box
                          key={data.listId}
                          sx={{
                            borderRadius: 2,
                            border: (theme) => `1px solid ${theme.palette.divider}`,
                            p: 2,
                            mb: 1,
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {data.name}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {t.lists.budget}: {data.budget != null ? formatCurrency(data.budget, data.currency) : '-'}
                            {' • '}
                            {t.todos.spent}: {formatCurrency(data.spent, data.currency)}
                            {typeof data.remaining === 'number'
                              ? ` • ${t.todos.remaining}: ${formatCurrency(data.remaining, data.currency)}`
                              : ''}
                          </Typography>

                          {data.categories.length > 0 ? (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
                                {t.lists.perList}
                              </Typography>
                              {data.categories.map((cat) => (
                                <Box
                                  key={cat.category}
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    py: 0.5,
                                    px: 1,
                                    borderRadius: 1,
                                    backgroundColor: (theme) =>
                                      theme.palette.mode === 'dark'
                                        ? 'rgba(255,255,255,0.02)'
                                        : 'rgba(0,0,0,0.04)',
                                    mb: 0.5,
                                  }}
                                >
                                  <Typography variant="body2" sx={{ color: cat.over ? 'error.main' : 'text.primary' }}>
                                    {cat.label}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: cat.over ? 'error.main' : 'text.secondary' }}>
                                    {t.todos.spent}: {formatCurrency(cat.spent, cat.currency)} / {t.lists.budget}: {formatCurrency(cat.budget, cat.currency)}
                                    {cat.over ? ` (${t.todos.overBudget})` : ''}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          ) : null}
                        </Box>
                      ))}
                    </>
                  )}
                </>
              )}
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => setBudgetOverviewOpen(false)}>{t.buttons.close}</Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={newCategoryDialogOpen}
            onClose={() => {
              setNewCategoryDialogOpen(false);
              setNewCategoryIconKey('');
            }}
            fullWidth
            maxWidth="sm"
            PaperProps={{ className: 'glass' }}
          >
            <DialogTitle>{
              editingCategoryValue
                ? t.dialogs.editCategory.title
                : t.dialogs.newCategory.title
            }</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                label={t.dialogs.newCategory.name}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                sx={{ mt: 1, mb: 2 }}
              />
              {isExpenses ? (
                <>
                  <TextField
                    fullWidth
                    label={t.dialogs.newCategory.budget}
                    type="number"
                    value={newCategoryBudget}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewCategoryBudget(val === '' ? '' : parseFloat(val));
                    }}
                  />
                  <TextField
                    select
                    fullWidth
                    label={t.dialogs.newCategory.currency}
                    value={newCategoryCurrency}
                    onChange={(e) => {
                      setNewCategoryCurrency(e.target.value);
                      // reset exchange rate when changing currency
                      setNewCategoryExchangeRate(1);
                    }}
                    sx={{ mt: 1 }}
                  >
                    {Object.keys(currencySymbols).map((code) => (
                      <MenuItem key={code} value={code}>
                        {code}
                      </MenuItem>
                    ))}
                  </TextField>
                  {listActions.currentList?.currency && newCategoryCurrency && newCategoryCurrency !== listActions.currentList.currency ? (
                    <>
                      <TextField
                        fullWidth
                        label={t.dialogs.newCategory.exchangeRate}
                        type="number"
                        value={newCategoryExchangeRate}
                        onChange={(e) => {
                          const v = e.target.value;
                          const num = v === '' ? '' : parseFloat(v);
                          setNewCategoryExchangeRate(Number.isNaN(num) ? '' : num);
                          setExchangeRateError(null);
                        }}
                        helperText={`1 ${listActions.currentList.currency} = ? ${newCategoryCurrency}`}
                        error={
                          newCategoryExchangeRate === '' ||
                          (typeof newCategoryExchangeRate === 'number' && newCategoryExchangeRate <= 0)
                        }
                        InputProps={{
                          endAdornment: exchangeRateLoading ? (
                            <CircularProgress size={18} />
                          ) : undefined,
                        }}
                        sx={{ mt: 1 }}
                      />
                      {exchangeRateError ? (
                        <Typography variant="caption" color="error.main">
                          {exchangeRateError}
                        </Typography>
                      ) : null}
                      {(newCategoryExchangeRate === '' ||
                        (typeof newCategoryExchangeRate === 'number' && newCategoryExchangeRate <= 0)) && (
                        <Typography variant="caption" color="warning.main">
                          {t.messages.invalidExchangeRate}
                        </Typography>
                      )}
                    </>
                  ) : null}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={newCategoryStrictBudget}
                        onChange={(e) => setNewCategoryStrictBudget(e.target.checked)}
                      />
                    }
                    label={t.lists.strictBudget}
                    sx={{ mt: 1 }}
                  />
                </>
              ) : null}
              <Box sx={{ mt: 1 }}>
                <CategoryIconPicker
                  selected={newCategoryIconKey}
                  onChange={setNewCategoryIconKey}
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setNewCategoryDialogOpen(false);
                  setNewCategoryIconKey('');
                  setEditingCategoryValue(null);
                }}
              >
                {t.buttons.cancel}
              </Button>
              {editingCategoryValue ? (
                <Button
                  color="error"
                  onClick={() => {
                    if (editingCategoryValue) openDeleteCategoryDialog(editingCategoryValue);
                  }}
                >
                  {t.buttons.delete}
                </Button>
              ) : null}
              <Button
                variant="contained"
                onClick={handleCreateCategoryWithBudget}
                disabled={!isExchangeRateValid}
              >
                {editingCategoryValue ? t.buttons.save : t.buttons.create}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={deleteCategoryDialogOpen}
            onClose={closeDeleteCategoryDialog}
            fullWidth
            maxWidth="xs"
            PaperProps={{ className: 'glass' }}
          >
            <DialogTitle>{t.dialogs.deleteCategory.title}</DialogTitle>
            <DialogContent>
              <Typography sx={{ mb: 1 }}>
                {formatMessage('dialogs.deleteCategory.confirm', {
                  count: todoActions.todos.filter((t) => t.category === deletingCategoryValue).length,
                })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t.messages.deleteWarning}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={closeDeleteCategoryDialog}>{t.buttons.cancel}</Button>
              <Button color="error" variant="contained" onClick={confirmDeleteCategory}>
                {t.buttons.delete}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={currencyRateDialogOpen}
            onClose={() => setCurrencyRateDialogOpen(false)}
            fullWidth
            maxWidth="sm"
            PaperProps={{ className: 'glass' }}
          >
            <DialogTitle>{t.dialogs.currencyRate.title}</DialogTitle>
                <DialogContent>
                  <Typography sx={{ mb: 1 }}>
                    {t.dialogs.currencyRate.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                    {exchangeRateLoading ? (
                      <Typography variant="caption" color="text.secondary">
                        {t.messages.loading}
                      </Typography>
                    ) : null}
                    {exchangeRateError ? (
                      <Typography variant="caption" color="error.main">
                        {exchangeRateError}
                      </Typography>
                    ) : null}
                  </Box>
                  {currencyRateTargets.map((cat) => (
                    <TextField
                      key={cat.value}
                      fullWidth
                      label={`${cat.label} (${cat.currency})`}
                      type="number"
                      value={currencyRateValues[cat.value] ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        const num = v === '' ? undefined : parseFloat(v);
                        setExchangeRateError(null);
                        setCurrencyRateValues((prev) => ({
                          ...prev,
                          [cat.value]: Number.isNaN(num) ? undefined : num,
                        }));
                      }}
                      sx={{ mb: 1 }}
                      helperText={`1 ${listActions.currentList?.currency} = ? ${cat.currency}`}
                    />
                  ))}
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'flex-end' }}>
                  <Button onClick={() => setCurrencyRateDialogOpen(false)}>
                    {t.buttons.cancel}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveCurrencyRates}
                    disabled={
                      Object.values(currencyRateValues).some(
                        (v) => typeof v !== 'number' || v <= 0
                      )
                    }
                  >
                    {t.buttons.save}
                  </Button>
                </DialogActions>
              </Dialog>        </Box>
      )}
    </Container>
  );
}