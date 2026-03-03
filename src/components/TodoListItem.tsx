import * as React from 'react';
import {
  Card,
  CardContent,
  ListItem,
  Stack,
  Checkbox,
  Box,
  Typography,
  IconButton,
  Grow,
  InputAdornment,
  TextField,
  Button,
} from '@mui/material';
import {
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
import type { Todo } from '@/types';
import type { UseTodosReturn } from '@/hooks/useTodos';
import type { UseListsReturn } from '@/hooks/useLists';

interface TodoListItemProps {
  todo: Todo;
  globalIndex: number;
  todoActions: UseTodosReturn;
  listActions: UseListsReturn;
  availableCategories: Category[];
  t: TranslationKeys;
}

export default function TodoListItem({
  todo,
  globalIndex,
  todoActions,
  listActions,
  availableCategories,
  t,
}: TodoListItemProps) {
  const theme = useTheme();

  // background / text colours follow the logic that used to live in TodoList
  let itemBg: string | undefined;
  if (todo.missing) {
    itemBg = alpha(theme.palette.error.light, theme.palette.mode === 'dark' ? 0.2 : 0.4);
  } else if (todo.completed) {
    itemBg = (todo.color && todo.color.trim()) ? todo.color : theme.palette.action.disabledBackground;
  } else {
    itemBg = todo.color && todo.color.trim() ? todo.color : undefined;
  }

  let itemTextColor = theme.palette.text.primary as string;
  if (!todo.completed && todo.color && todo.color.trim()) {
    const bg = todo.color;
    const itemBgLum = getLuminance(bg);
    if (!isNaN(itemBgLum)) {
      itemTextColor =
        itemBgLum > 0.5
          ? 'rgba(0,0,0,0.87)'
          : theme.palette.mode === 'dark'
          ? '#fafafa'
          : '#ffffff';
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

  return (
    <Grow in timeout={300}>
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
          mb: 1.5,
          backgroundColor: itemBg || 'inherit',
          opacity: todo.completed ? 0.75 : 1,
          boxShadow:
            todoActions.dragOverIndex === globalIndex
              ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.4)}`
              : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          color: itemTextColor,
          cursor: !listActions.viewingHistory ? 'grab' : 'auto',
          '&:active': { cursor: !listActions.viewingHistory ? 'grabbing' : 'auto' },
          touchAction: 'pan-y',
          position: 'relative',
          overflow: 'hidden',
          '&::before': todo.completed ? {
            content: '""',
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)',
            pointerEvents: 'none',
          } : {},
        }}
        elevation={0}
      >
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <ListItem disableGutters sx={{ p: 0 }}>
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
                  onChange={() => !listActions.viewingHistory && todoActions.toggleComplete(todo)}
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
                        textDecoration: todo.missing || todo.completed ? 'line-through' : 'none',
                        opacity: todo.completed ? 0.7 : 1,
                      }}
                    >
                      {todo.name}
                      {todo.quantity > 1 ? ` (x${todo.quantity})` : ''}
                    </Typography>
                    {todo.description && (
                      <Typography variant="body2" sx={{ color: itemTextColor, mt: 0.25, opacity: todo.completed ? 0.6 : 0.85 }}>
                        {todo.description}
                      </Typography>
                    )}
                    {todo.comment && (
                      <Typography variant="caption" sx={{ color: itemTextColor, opacity: todo.completed ? 0.5 : 0.7 }}>
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
}