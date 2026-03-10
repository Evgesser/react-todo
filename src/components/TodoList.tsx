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
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import TodoListItem from './TodoListItem';
import type { Category } from '@/constants';
import { iconChoices } from '@/constants';
import type { TranslationKeys } from '@/locales/ru';

import type { UseTodosReturn } from '@/hooks/useTodos';
import type { UseListsReturn } from '@/hooks/useLists';

interface TodoListProps {
  todoActions: UseTodosReturn;
  listActions: UseListsReturn;
  availableCategories: Category[];
  t: TranslationKeys;
  // called when an item enters edit mode (e.g. open form dialog)
  onEdit?: () => void;
}

export default function TodoList({
  todoActions,
  listActions,
  availableCategories,
  t,
  onEdit,
}: TodoListProps) {
  const theme = useTheme();

  const elements = React.useMemo(() => {
    const filtered = todoActions.todos.filter(
      (tt) =>
        tt.name.toLowerCase().includes(todoActions.filterText.toLowerCase()) ||
        tt.description.toLowerCase().includes(todoActions.filterText.toLowerCase())
    );

    const orderSorted = [...filtered].sort((a, b) => (a.order || 0) - (b.order || 0));
    const cats = Array.from(new Set(orderSorted.map((t) => t.category || '')));
    const sorted = [...filtered].sort((a, b) => {
      const ca = cats.indexOf(a.category || '');
      const cb = cats.indexOf(b.category || '');
      if (ca !== cb) return ca - cb;
      // same category: unfinished items first
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return (a.order || 0) - (b.order || 0);
    });

    const allSorted = [...todoActions.todos].sort((a, b) => {
      const ca = cats.indexOf(a.category || '');
      const cb = cats.indexOf(b.category || '');
      if (ca !== cb) return ca - cb;
      return (a.order || 0) - (b.order || 0);
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
          (iconChoices.find((x) => x.key === realCat)?.icon as any) ||
          null;
        const label =
          catObj?.label ||
          (t.categoryLabels as Record<string, string>)?.[realCat] ||
          iconChoices.find((x) => x.key === realCat)?.label ||
          realCat;
        elementsArray.push(
          <Box
            key={`header-${catKey}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mt: 2,
              mb: 0.5,
              px: 1,
              py: 0.5,
              bgcolor: theme.palette.action.hover,
              borderRadius: 1,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
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
                disabled={groupCats.indexOf(realCat) <= 0}
              >
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={async () => {
                  todoActions.setFilterText('');
                  todoActions.setFilterCategory('');
                  await todoActions.moveCategory(realCat, 'down');
                }}
                edge="end"
                disabled={groupCats.indexOf(realCat) === groupCats.length - 1}
              >
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        );
      }

      const globalIndex = todoActions.todos.findIndex((t) => t._id === todo._id);

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
  const totalCount = todoActions.todos.length;
  const completedCount = todoActions.todos.filter((t) => t.completed).length;
  const progressValue = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;
  const trackBg = theme.palette.mode === 'dark'
    ? alpha(theme.palette.secondary.main, 0.12)
    : alpha(theme.palette.secondary.main, 0.18);
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
      
      <List sx={{ width: '100%' }}>{elements}</List>
    </Box>
  );
}
