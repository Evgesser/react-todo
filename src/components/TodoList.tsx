import * as React from 'react';
import {
  List,
  Box,
  Typography,
  IconButton,
  Skeleton,
  LinearProgress,
} from '@mui/material';
import {
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import { Tooltip } from '@mui/material';
import TodoListItem from './TodoListItem';
import type { Category } from '@/constants';
import { iconChoices, formatCurrency } from '@/constants';
import type { TranslationKeys } from '@/locales/ru';
import type { Todo } from '@/types/todo';

import type { UseTodosReturn, UseListsReturn } from '@/types/hooks';


import type { TodoListProps } from '@/types/componentProps';

function TodoList({
  todoActions,
  listActions,
  availableCategories,
  t,
  listType,
  onEdit,
  onAddToCategory,
  onEditCategory,
  onDeleteCategory,
}: TodoListProps) {
  const theme = useTheme();

  const listCurrency = listActions.currentList?.currency || 'RUB';
  const budget = listType === 'expenses' ? listActions.currentList?.budget : undefined;

  const categoryInfo = React.useMemo(() => {
    const currentListId = listActions.currentListId;
    const info: Record<string, { budget?: number; currency?: string; rate: number }> = {};
    availableCategories
      .filter((c) => {
        if (listType === 'expenses') {
          return c.listId === currentListId;
        }
        return true;
      })
      .forEach((c) => {
        const budget = typeof (c as any).budget === 'number' ? (c as any).budget : undefined;
        const currency = typeof c.currency === 'string' ? c.currency : undefined;
        const rate =
          typeof (c as any).exchangeRateToListCurrency === 'number' && (c as any).exchangeRateToListCurrency > 0
            ? (c as any).exchangeRateToListCurrency
            : 1;
        info[c.value] = { budget, currency, rate };
      });
    return info;
  }, [availableCategories, listActions.currentListId, listType]);

  const convertToListCurrency = React.useCallback(
    (amount: number, category?: string): number => {
      if (!category) return amount;
      const rate = categoryInfo[category]?.rate ?? 1;
      if (rate > 0) return amount * rate;
      return amount;
    },
    [categoryInfo]
  );

  const totalAmount = React.useMemo(() => {
    if (listType !== 'expenses') return null;
    return todoActions.todos.reduce((sum, t) => {
      if (typeof t.amount !== 'number') return sum;
      return sum + convertToListCurrency(t.amount, t.category);
    }, 0);
  }, [todoActions.todos, listType, convertToListCurrency]);

  const remainingBudget = React.useMemo(() => {
    if (typeof budget !== 'number' || typeof totalAmount !== 'number') return null;
    return budget - totalAmount;
  }, [budget, totalAmount]);
  const budgetProgress = React.useMemo(() => {
    if (typeof budget !== 'number' || typeof totalAmount !== 'number' || budget <= 0) return null;
    return Math.min(100, (totalAmount / budget) * 100);
  }, [budget, totalAmount]);
  const overBudget = typeof remainingBudget === 'number' ? remainingBudget < 0 : false;

  const categoryBudgets = React.useMemo(() => {
    const map: Record<string, number> = {};
    const currentListId = listActions.currentListId;
    availableCategories.forEach((c) => {
      if (listType === 'expenses' && c.listId !== currentListId) return;
      if (typeof (c as any).budget === 'number') {
        map[c.value] = (c as any).budget as number;
      }
    });
    return map;
  }, [availableCategories, listActions.currentListId, listType]);

  const categorySpending = React.useMemo(() => {
    const spent: Record<string, number> = {};
    todoActions.todos.forEach((todo) => {
      if (typeof todo.amount !== 'number') return;
      const cat = todo.category || '';
      spent[cat] = (spent[cat] || 0) + todo.amount;
    });
    return spent;
  }, [todoActions.todos]);

  const categoriesWithBudgets = React.useMemo(() => {
    return Object.entries(categoryBudgets)
      .map(([cat, budget]) => {
        const spent = categorySpending[cat] ?? 0;
        const info = categoryInfo[cat] || { rate: 1, currency: listCurrency };
        const remaining = budget - spent;
        const listBudget = info.rate && info.rate > 0 ? budget / info.rate : budget;
        const listSpent = info.rate && info.rate > 0 ? spent / info.rate : spent;
        return {
          category: cat,
          budget,
          spent,
          remaining,
          over: remaining < 0,
          currency: info.currency || listCurrency,
          listBudget,
          listSpent,
        };
      })
      .filter((entry) => typeof entry.budget === 'number');
  }, [categoryBudgets, categorySpending, categoryInfo, listCurrency]);

  const elements = React.useMemo(() => {
    const filtered = todoActions.todos.filter(
      (tt: Todo) =>
        tt.name.toLowerCase().includes(todoActions.filterText.toLowerCase()) ||
        tt.description.toLowerCase().includes(todoActions.filterText.toLowerCase())
    );

    const baseIndex = new Map<string, number>();
    todoActions.todos.forEach((item: Todo, idx: number) => {
      baseIndex.set(item._id, idx);
    });

    const toOrder = (val?: number) =>
      Number.isFinite(val) ? (val as number) : Number.MAX_SAFE_INTEGER;
    const byStoredOrder = (a: { _id: string; order?: number }, b: { _id: string; order?: number }) => {
      const diff = toOrder(a.order) - toOrder(b.order);
      if (diff !== 0) return diff;
      return (baseIndex.get(a._id) ?? 0) - (baseIndex.get(b._id) ?? 0);
    };

    const storedSorted = [...filtered].sort(byStoredOrder);
    const categoryOrder = Array.from(new Set(storedSorted.map((t) => t.category || '')));
    const byCategoryThenVisualOrder = (a: { _id: string; order?: number; category?: string; completed?: boolean }, b: { _id: string; order?: number; category?: string; completed?: boolean }) => {
      const ca = categoryOrder.indexOf(a.category || '');
      const cb = categoryOrder.indexOf(b.category || '');
      if (ca !== cb) return ca - cb;

      if (!!a.completed !== !!b.completed) {
        return a.completed ? 1 : -1;
      }

      return byStoredOrder(a, b);
    };

    const sorted = [...filtered].sort(byCategoryThenVisualOrder);

    const categoriesFromTodos = Array.from(new Set(sorted.map((t) => t.category || '')));

    const budgetCategoryOrder = availableCategories
      .filter((c) => typeof (c as any).budget === 'number')
      .map((c) => c.value);

    const displayCategories = [
      ...categoriesFromTodos,
      ...budgetCategoryOrder.filter((c) => !categoriesFromTodos.includes(c)),
    ];

    const todosByCategory = sorted.reduce((acc, todo) => {
      const cat = todo.category || '';
      const list = acc.get(cat) || [];
      list.push(todo);
      acc.set(cat, list);
      return acc;
    }, new Map<string, Todo[]>());

    const groupCats = categoriesFromTodos;

    const elementsArray: React.JSX.Element[] = [];

    displayCategories.forEach((category) => {
      const catKey = category || '__none';
      const realCat = category || '';
      const currentListId = listActions.currentListId;

      // Prefer category definitions that are scoped to the current list (listId),
      // otherwise fall back to global categories.
      const catObj =
        availableCategories.find(
          (c) => c.value === realCat && c.listId === currentListId
        ) || availableCategories.find((c) => c.value === realCat);

      const IconComp =
        catObj?.icon ||
        iconChoices.find((x) => x.key === realCat)?.icon ||
        null;
      const label =
        catObj?.label ||
        (t.categoryLabels as Record<string, string>)?.[realCat] ||
        iconChoices.find((x) => x.key === realCat)?.label ||
        realCat;

      const isEditable = Boolean(
        onEditCategory &&
        catObj &&
        catObj.listId &&
        catObj.listId === currentListId
      );

      const isStrictBudget = Boolean(catObj?.strictBudget);

      const catBudget = categoryBudgets[realCat];
      const spent = categorySpending[realCat] ?? 0;
      const catCurrency = catObj?.currency || listCurrency;
      const remaining = typeof catBudget === 'number' ? catBudget - spent : undefined;
      const over = typeof remaining === 'number' ? remaining < 0 : false;

      const groupIndex = groupCats.indexOf(realCat);
      const canMoveUp = groupIndex > 0;
      const canMoveDown = groupIndex >= 0 && groupIndex < groupCats.length - 1;

      elementsArray.push(
        <Box
          key={`header-${catKey}`}
          sx={(t) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mt: 2,
            mb: 0.5,
            px: 1,
            py: 0.5,
            backgroundColor: t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(6px) saturate(120%)',
            borderRadius: 1,
            borderBottom: `1px solid ${t.palette.divider}`,
          })}
        >
          {IconComp ? <IconComp fontSize="small" /> : null}
          {isStrictBudget ? (
            <Tooltip title={t.lists.strictBudget}>
              <LockIcon fontSize="small" sx={{ color: 'warning.main' }} />
            </Tooltip>
          ) : null}
          {isEditable && onEditCategory ? (
            <IconButton
              size="small"
              onClick={() => onEditCategory(realCat)}
              edge="start"
              aria-label={t.buttons.edit}
              title={t.buttons.edit}
              sx={{ ml: 0.5 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          ) : null}
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
            <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
              {label}
            </Typography>
            {typeof catBudget === 'number' ? (
              <Typography
                variant="caption"
                sx={{ color: over ? 'error.main' : 'text.secondary' }}
              >
                {t.lists.budget}: {formatCurrency(catBudget, catCurrency)}
                {catCurrency && catCurrency !== listCurrency ? (
                  <Typography component="span" variant="caption" sx={{ color: 'text.secondary', ml: 0.5 }}>
                    (≈ {formatCurrency(catBudget / (categoryInfo[realCat]?.rate || 1), listCurrency)})
                  </Typography>
                ) : null}
              </Typography>
            ) : null}
          </Box>

          <Box sx={{ marginInlineStart: 'auto', display: 'flex', gap: 0.5, alignItems: 'center' }}>
            {onAddToCategory ? (
              <IconButton
                size="small"
                onClick={() => onAddToCategory(realCat)}
                edge="end"
                aria-label={t.todos.addTask}
                title={t.todos.addTask}
                sx={{
                  color: 'success.main',
                }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            ) : null}

            <IconButton
              size="small"
              onClick={async () => {
                todoActions.setFilterText('');
                todoActions.setFilterCategory('');
                await todoActions.moveCategory(realCat, 'up');
              }}
              edge="end"
              aria-label={theme.direction === 'rtl' ? `הזז את ${label} למטה` : `Move ${label} up`}
              title={theme.direction === 'rtl' ? `הזז את ${label} למטה` : `Move ${label} up`}
              disabled={!canMoveUp}
              sx={(t) => ({
                transition: 'transform 0.15s ease, box-shadow 0.15s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 14px ${alpha(t.palette.primary.main, 0.12)}`,
                },
              })}
            >
              {theme.direction === 'rtl' ? <ArrowDownwardIcon fontSize="small" /> : <ArrowUpwardIcon fontSize="small" />}
            </IconButton>
            <IconButton
              size="small"
              onClick={async () => {
                todoActions.setFilterText('');
                todoActions.setFilterCategory('');
                await todoActions.moveCategory(realCat, 'down');
              }}
              edge="end"
              aria-label={theme.direction === 'rtl' ? `הזז את ${label} למעלה` : `Move ${label} down`}
              title={theme.direction === 'rtl' ? `הזז את ${label} למעלה` : `Move ${label} down`}
              disabled={!canMoveDown}
              sx={(t) => ({
                transition: 'transform 0.15s ease, box-shadow 0.15s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 14px ${alpha(t.palette.primary.main, 0.12)}`,
                },
              })}
            >
              {theme.direction === 'rtl' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
            </IconButton>
          </Box>
        </Box>
      );

      const todosForCategory = todosByCategory.get(realCat) ?? [];
      todosForCategory.forEach((todo) => {
        const globalIndex = todoActions.todos.findIndex((t_item: Todo) => t_item._id === todo._id);
        elementsArray.push(
          <TodoListItem
            key={todo._id}
            todo={todo}
            globalIndex={globalIndex}
            todoActions={todoActions}
            listActions={listActions}
            availableCategories={availableCategories}
            t={t}
            onEdit={onEdit}
          />
        );
      });
    });

    return elementsArray;
  }, [
    todoActions,
    listActions,
    availableCategories,
    t,
    theme,
    onEdit,
  ]);
  if (todoActions.todosLoading) {
    // render a few skeleton cards while loading
    return (
      <Box>
        {[...Array(6)].map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={64}
            sx={{ mb: 1, borderRadius: 1 }}
          />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {totalAmount != null && (
        <Box sx={{ mb: 1, px: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
              {t.todos.amount}: {formatCurrency(totalAmount, listCurrency)}
            </Typography>
            {typeof budget === 'number' && (
              <Typography variant="caption" color={overBudget ? 'error' : 'text.secondary'}>
                {overBudget
                  ? t.todos.overBudget
                  : `${t.todos.remaining}: ${formatCurrency(Math.abs(remainingBudget ?? 0), listCurrency)}`}
              </Typography>
            )}
          </Box>
          {typeof budget === 'number' && budgetProgress != null && (
            <Box sx={{ mt: 0.5 }}>
              <LinearProgress
                variant="determinate"
                value={Math.min(Math.max(budgetProgress, 0), 100)}
                sx={{
                  height: 8,
                  borderRadius: 6,
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                  '& .MuiLinearProgress-bar': {
                    background: overBudget
                      ? 'linear-gradient(90deg, #DC2626 0%, #F87171 100%)'
                      : 'linear-gradient(90deg, #22C55E 0%, #10B981 100%)',
                  },
                }}
              />
            </Box>
          )}

          {categoriesWithBudgets.length > 0 && (
            <Box sx={{ mt: 1, px: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 500 }}>
                {t.todos.categoryBudgets}
              </Typography>
              {categoriesWithBudgets.map((entry) => {
                const catObj = availableCategories.find((c) => c.value === entry.category);
                const label =
                  catObj?.label ||
                  (t.categoryLabels as Record<string, string>)?.[entry.category] ||
                  entry.category;
                const color = entry.over ? 'error.main' : 'text.primary';
                return (
                  <Box
                    key={entry.category}
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
                    <Typography variant="body2" sx={{ color }}>
                      {label}
                    </Typography>
                    <Typography variant="caption" sx={{ color }}>
                      {t.todos.spent}: {formatCurrency(entry.spent, entry.currency)} / {t.lists.budget}: {formatCurrency(entry.budget, entry.currency)}
                      {entry.currency && entry.currency !== listCurrency ? (
                        <span>
                          {' '}(≈ {formatCurrency(entry.listSpent, listCurrency)} / {formatCurrency(entry.listBudget, listCurrency)})
                        </span>
                      ) : null}
                      {entry.over ? ` (${t.todos.overBudget})` : ''}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      )}
      <List sx={{ width: '100%', p: 1, borderRadius: 2 }}>{elements}</List>
    </Box>
  );
} 

export default TodoList;
