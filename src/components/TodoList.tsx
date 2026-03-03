import * as React from 'react';
import {
  List,
  ListItem,
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Stack,
  Checkbox,
  Grow,
  TextField,
  InputAdornment,
  Button,
  Skeleton,
} from '@mui/material';
import {
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  RadioButtonChecked as RadioButtonCheckedIcon,
  ReportProblem as ReportProblemIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import { getTextColor, getLuminance } from '@/utils/color';
import type { Category } from '@/constants';
import type { TranslationKeys } from '@/locales/ru';

import type { UseTodosReturn } from '@/hooks/useTodos';
import type { UseListsReturn } from '@/hooks/useLists';

interface TodoListProps {
  todoActions: UseTodosReturn;
  listActions: UseListsReturn;
  availableCategories: Category[];
  t: TranslationKeys;
}

export default function TodoList({
  todoActions,
  listActions,
  availableCategories,
  t,
}: TodoListProps) {
  const theme = useTheme();

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
        const IconComp = catObj?.icon || null;
        const label = catObj?.label || realCat;
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
            <Box sx={{ marginLeft: 'auto', display: 'flex', gap: 0.5 }}>
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

      let itemBg: string | undefined;
      if (todo.completed) {
        itemBg = theme.palette.action.disabledBackground;
      } else if (todo.missing) {
        itemBg = alpha(theme.palette.error.light, 0.4);
      } else {
        itemBg = todo.color && todo.color.trim() ? todo.color : undefined;
      }

      let itemTextColor = theme.palette.text.primary as string;
      if (!todo.completed && todo.color && todo.color.trim()) {
        const bg = todo.color;
        const itemBgLum = getLuminance(bg);
        if (!isNaN(itemBgLum)) {
          itemTextColor =
            itemBgLum > 0.5 ? 'rgba(0,0,0,0.87)' : theme.palette.mode === 'dark' ? '#fafafa' : '#ffffff';
        } else {
          try {
            itemTextColor = theme.palette.getContrastText ? theme.palette.getContrastText(bg) : getTextColor(bg);
          } catch {
            itemTextColor = theme.palette.text.primary as string;
          }
        }
      }
      if (todo.missing) {
        itemTextColor = theme.palette.text.primary as string;
      }

      const globalIndex = todoActions.todos.findIndex((t) => t._id === todo._id);

      elementsArray.push(
        <Grow key={todo._id} in timeout={300}>
          <Card
            draggable={!listActions.viewingHistory}
            onDragStart={(e) => todoActions.onDragStart(e, globalIndex)}
            onDragOver={todoActions.onDragOver}
            onDrop={(e) => todoActions.onDrop(e, globalIndex)}
            onTouchStart={(e) => todoActions.onTouchStart(e, globalIndex)}
            onDragEnter={(e) => todoActions.onDragEnter(e, globalIndex)}
            onDragLeave={todoActions.onDragLeave}
            onTouchMove={todoActions.onTouchMove}
            onTouchEnd={(e) => todoActions.onTouchEnd(e, globalIndex)}
            sx={{
              mb: 1,
              backgroundColor: itemBg || 'inherit',
              boxShadow:
                todoActions.dragOverIndex === globalIndex
                  ? '0 0 0 3px rgba(25,118,210,0.12)'
                  : undefined,
              transition: 'background-color 0.3s ease',
              color: itemTextColor,
              cursor: !listActions.viewingHistory ? 'move' : 'auto',
              touchAction: 'none',
            }}
            elevation={1}
          >
            <CardContent sx={{ p: 1 }}>
              <ListItem disableGutters>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                  {todoActions.bulkMode && (
                    <Checkbox
                      checked={todoActions.selectedIds.has(todo._id)}
                      onChange={() => todoActions.toggleSelect(todo._id)}
                      icon={<RadioButtonUncheckedIcon />}
                      checkedIcon={<RadioButtonCheckedIcon />}
                      sx={{
                        color: itemTextColor,
                        '& .MuiSvgIcon-root': { borderRadius: '50%' },
                      }}
                    />
                  )}
                  <Stack spacing={0.25} alignItems="center">
                    {todo.category && (
                      <Box sx={{ fontSize: 16, color: itemTextColor }}>
                        {(() => {
                          const IconComp = availableCategories.find((c) => c.value === todo.category)?.icon;
                          return IconComp ? <IconComp fontSize="small" /> : null;
                        })()}
                      </Box>
                    )}
                    <Checkbox
                      checked={todo.completed}
                      onChange={() =>
                        !listActions.viewingHistory && todoActions.toggleComplete(todo)
                      }
                      disabled={listActions.viewingHistory}
                      icon={<RadioButtonUncheckedIcon />}
                      checkedIcon={<RadioButtonCheckedIcon />}
                      sx={{
                        color: itemTextColor,
                        '& .MuiSvgIcon-root': { borderRadius: '50%' },
                      }}
                    />
                  </Stack>

                  <Box sx={{ flex: 1 }}>
                    {todoActions.inlineEditId === todo._id ? (
                      <Stack spacing={1} sx={{ flex: 1 }} data-inline-edit-root={todo._id}>
                        <TextField
                          value={todoActions.inlineName}
                          onChange={(e) => todoActions.setInlineName(e.target.value)}
                          fullWidth
                          variant="standard"
                          autoFocus
                          InputProps={{
                            endAdornment: todoActions.inlineName ? (
                              <InputAdornment position="end">
                                <IconButton
                                  size="small"
                                  onClick={() => todoActions.setInlineName('')}
                                  edge="end"
                                >
                                  <ClearIcon fontSize="small" />
                                </IconButton>
                              </InputAdornment>
                            ) : null,
                          }}
                        />
                        <TextField
                          value={todoActions.inlineDescription}
                          onChange={(e) => todoActions.setInlineDescription(e.target.value)}
                          fullWidth
                          variant="standard"
                          InputProps={{
                            endAdornment: todoActions.inlineDescription ? (
                              <InputAdornment position="end">
                                <IconButton
                                  size="small"
                                  onClick={() => todoActions.setInlineDescription('')}
                                  edge="end"
                                >
                                  <ClearIcon fontSize="small" />
                                </IconButton>
                              </InputAdornment>
                            ) : null,
                          }}
                        />
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={async () => {
                              await todoActions.finishInlineEdit(todo);
                            }}
                          >
                            {t.todos.save}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => todoActions.setInlineEditId(null)}
                          >
                            {t.todos.cancel}
                          </Button>
                        </Stack>
                      </Stack>
                    ) : (
                      <Box
                        onClick={() => {
                          if (!todoActions.bulkMode && !listActions.viewingHistory)
                            todoActions.startInlineEdit(todo);
                        }}
                        sx={{
                          cursor:
                            !todoActions.bulkMode && !listActions.viewingHistory
                              ? 'pointer'
                              : 'default',
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{
                            color: itemTextColor,
                            fontWeight: 500,
                            textDecoration: todo.missing ? 'line-through' : 'none',
                          }}
                        >
                          {todo.name}
                          {todo.quantity > 1 ? ` (x${todo.quantity})` : ''}
                        </Typography>
                        {todo.description && (
                          <Typography variant="body2" sx={{ color: itemTextColor, mt: 0.25 }}>
                            {todo.description}
                          </Typography>
                        )}
                        {todo.comment && (
                          <Typography variant="caption" sx={{ color: itemTextColor, opacity: 0.7 }}>
                            {todo.comment}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>

                  {!listActions.viewingHistory && (
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        edge="end"
                        aria-label={todo.missing ? t.todos.unmarkMissing : t.todos.markMissing}
                        sx={{ color: todo.missing ? theme.palette.error.main : itemTextColor }}
                        onClick={() => todoActions.toggleMissing(todo)}
                      >
                        <ReportProblemIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label={t.todos.edit}
                        sx={{ color: itemTextColor }}
                        onClick={() => {
                          todoActions.setEditingId(todo._id);
                          todoActions.setName(todo.name);
                          todoActions.setDescription(todo.description);
                          todoActions.setQuantity(todo.quantity);
                          todoActions.setComment(todo.comment || '');
                          todoActions.setColor(todo.color || listActions.listDefaultColor);
                          todoActions.setCategory(todo.category || '');
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label={t.todos.delete}
                        sx={{ color: itemTextColor }}
                        onClick={() => todoActions.deleteTodo(todo._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  )}
                </Stack>
              </ListItem>
            </CardContent>
          </Card>
        </Grow>
      );
    });

    return elementsArray;
  }, [
    todoActions,
    listActions.viewingHistory,
    availableCategories,
  ]);

  return <List sx={{ width: '100%' }}>{elements}</List>;
}
