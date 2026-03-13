import * as React from 'react';
import {
  List,
  Box,
  Typography,
  IconButton,
  Skeleton,
} from '@mui/material';
import {
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import TodoListItem from './TodoListItem';
import type { Category } from '@/constants';
import { iconChoices } from '@/constants';
import type { TranslationKeys } from '@/locales/ru';
import type { Todo } from '@/types/todo';

import type { UseTodosReturn, UseListsReturn } from '@/types/hooks';


import type { TodoListProps } from '@/types/componentProps';

function TodoList({
  todoActions,
  listActions,
  availableCategories,
  t,
  onEdit,
}: TodoListProps) {
  const theme = useTheme();

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
    const allSorted = [...todoActions.todos].sort((a, b) => {
      const ca = categoryOrder.indexOf(a.category || '');
      const cb = categoryOrder.indexOf(b.category || '');
      if (ca !== cb) return ca - cb;
      return byStoredOrder(a, b);
    });
    const groupCats = Array.from(new Set(allSorted.map((t) => t.category || '')));

    const elementsArray: React.JSX.Element[] = [];
    const seenCategories = new Set<string>();

    sorted.forEach((todo) => {
      const catKey = todo.category || '__none';
      if (!seenCategories.has(catKey)) {
        seenCategories.add(catKey);
        const realCat = todo.category || '';
        const catObj = availableCategories.find((c) => c.value === todo.category);
        const IconComp =
          catObj?.icon ||
          iconChoices.find((x) => x.key === realCat)?.icon ||
          null;
        const label =
          catObj?.label ||
          (t.categoryLabels as Record<string, string>)?.[realCat] ||
          iconChoices.find((x) => x.key === realCat)?.label ||
          realCat;
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
            <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
              {label}
            </Typography>
            <Box sx={{ marginInlineStart: 'auto', display: 'flex', gap: 0.5 }}>
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
                disabled={groupCats.indexOf(realCat) <= 0}
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
                disabled={groupCats.indexOf(realCat) === groupCats.length - 1}
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
      }

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
      
      <List sx={{ width: '100%', p: 1, borderRadius: 2 }}>{elements}</List>
    </Box>
  );
} 

export default TodoList;
