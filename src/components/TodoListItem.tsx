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
  Popover,
  Dialog,
  DialogContent,
} from '@mui/material';

// keyframe definitions for blinking blue info icon
const blinkKeyframes = {
  '@keyframes blinkBlue': {
    '0%,100%': { color: 'inherit' },
    '50%': { color: '#42a5f5' }, // light blue
  },
};

import {
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  RadioButtonChecked as RadioButtonCheckedIcon,
  ReportProblem as ReportProblemIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
  Info as InfoIcon,
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
  // optional callback invoked when user starts editing this item
  onEdit?: () => void;
}


export default function TodoListItem({
  todo,
  globalIndex,
  todoActions,
  listActions,
  availableCategories,
  t,
  onEdit,
}: TodoListItemProps) {
  const theme = useTheme();

  // pick only the fields we need from the action objects to avoid
  // repeatedly accessing the full object and make intent explicit
  const {
    bulkMode,
    selectedIds,
    toggleSelect,
    dragOverIndex,
    inlineEditId,
    inlineName,
    setInlineName,
    inlineDescription,
    setInlineDescription,
    finishInlineEdit,
    setInlineEditId,
    startInlineEdit,
    toggleMissing,
    setEditingId,
    setName,
    setDescription,
    setQuantity,
    setComment,
    setUnit,
    setColor,
    setCategory,
    deleteTodo,
    onDragStart,
    onDragOver,
    onDrop,
    onTouchStart,
    onDragEnter,
    onDragLeave,
    onTouchMove,
    onTouchEnd,
    toggleComplete,
  } = todoActions;

  const [infoAnchor, setInfoAnchor] = React.useState<HTMLElement | null>(null);
  const [infoImageOpen, setInfoImageOpen] = React.useState(false);
  const openInfo = (e: React.MouseEvent<HTMLElement>) => setInfoAnchor(e.currentTarget);
  const closeInfo = () => {
    setInfoAnchor(null);
    setInfoImageOpen(false);
  };


  const { viewingHistory, listDefaultColor } = listActions;

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
        draggable={!viewingHistory}
        onDragStart={(e) => onDragStart(e, globalIndex)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, globalIndex)}
        onTouchStart={(e) => onTouchStart(e, globalIndex)}
        onDragEnter={(e) => onDragEnter(e, globalIndex)}
        onDragLeave={onDragLeave}
        onTouchMove={onTouchMove}
        onTouchEnd={(e) => onTouchEnd(e, globalIndex)}
        sx={{
          mb: 1.5,
          backgroundColor: itemBg || 'inherit',
          opacity: todo.completed ? 0.75 : 1,
          boxShadow: dragOverIndex === globalIndex ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.4)}` : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          color: itemTextColor,
          cursor: !viewingHistory ? 'grab' : 'auto',
          '&:active': { cursor: !viewingHistory ? 'grabbing' : 'auto' },
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
              {bulkMode && (
                <Checkbox
                  checked={selectedIds.has(todo._id)}
                  onChange={() => toggleSelect(todo._id)}
                  icon={<RadioButtonUncheckedIcon />}
                  checkedIcon={<RadioButtonCheckedIcon />}
                  sx={{
                    color: itemTextColor,
                    '& .MuiSvgIcon-root': { borderRadius: '50%' },
                  }}
                />
              )}
              <Checkbox
                checked={todo.completed}
                onChange={() => !viewingHistory && toggleComplete(todo)}
                disabled={viewingHistory}
                icon={<RadioButtonUncheckedIcon />}
                checkedIcon={<RadioButtonCheckedIcon />}
                sx={{
                  color: itemTextColor,
                  '& .MuiSvgIcon-root': { borderRadius: '50%' },
                }}
              />

              <Box sx={{ flex: 1 }}>
                {inlineEditId === todo._id ? (
                  <Stack spacing={1} sx={{ flex: 1 }} data-inline-edit-root={todo._id}>
                    <TextField
                      value={inlineName}
                      onChange={(e) => setInlineName(e.target.value)}
                      fullWidth
                      variant="standard"
                      autoFocus
                      InputProps={{
                        endAdornment: inlineName ? (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => setInlineName('')}
                              edge="end"
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        ) : null,
                      }}
                    />
                    <TextField
                      value={inlineDescription}
                      onChange={(e) => setInlineDescription(e.target.value)}
                      fullWidth
                      variant="standard"
                      InputProps={{
                        endAdornment: inlineDescription ? (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => setInlineDescription('')}
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
                          await finishInlineEdit(todo);
                        }}
                      >
                        {t.todos.save}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setInlineEditId(null)}
                      >
                        {t.todos.cancel}
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <Box>

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
                      {(todo.quantity != null && (todo.quantity !== 1 || todo.unit))
                        ? ` (${todo.quantity}${todo.unit ? ' ' + todo.unit : ''})`
                        : ''}
                    </Typography>
                  </Box>
                )}
              </Box>

              {!viewingHistory && (
                <Stack direction="row" spacing={1}>
                  <IconButton
                    edge="end"
                    aria-label={todo.missing ? t.todos.unmarkMissing : t.todos.markMissing}
                    sx={{ color: todo.missing ? theme.palette.error.main : itemTextColor }}
                    onClick={() => toggleMissing(todo)}
                  >
                    <ReportProblemIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label={t.todos.edit}
                    sx={{ color: itemTextColor }}
                    onClick={() => {
                      setEditingId(todo._id);
                      setName(todo.name);
                      setDescription(todo.description);
                      setQuantity(todo.quantity);
                      setComment(todo.comment || '');
                      setUnit(todo.unit || '');
                      setColor(todo.color || listDefaultColor);
                      setCategory(todo.category || '');
                      if (onEdit) {
                        onEdit();
                      }
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label={t.todos.delete}
                    sx={{ color: itemTextColor }}
                    onClick={() => deleteTodo(todo._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                  {(todo.description || todo.comment) && (
                    <>
                      <IconButton
                        edge="end"
                        aria-label="info"
                        sx={{
                          color: itemTextColor,
                          ...blinkKeyframes,
                          animation: infoAnchor ? 'none' : 'blinkBlue 1.5s infinite',
                        }}
                        onClick={openInfo}
                      >
                        <InfoIcon fontSize="small" />
                      </IconButton>
                      <Popover
                        open={Boolean(infoAnchor)}
                        anchorEl={infoAnchor}
                        onClose={closeInfo}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                      >
                        <Box sx={{ p: 1, maxWidth: 200 }}>
                          {todo.image && (
                            <Box
                              sx={{ mb: 1, textAlign: 'center', cursor: 'pointer' }}
                              onClick={() => setInfoImageOpen(true)}
                            >
                              <img
                                src={todo.image}
                                alt="attachment"
                                style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 4 }}
                              />
                            </Box>
                          )}
                          {todo.description && (
                            <Typography variant="body2" sx={{ mb: todo.comment ? 1 : 0 }}>
                              {t.todos.description}: {todo.description}
                            </Typography>
                          )}
                          {todo.comment && (
                            <Typography variant="caption">
                              {t.todos.comment}: {todo.comment}
                            </Typography>
                          )}
                        </Box>
                      </Popover>

                      <Dialog
                        open={infoImageOpen}
                        onClose={() => setInfoImageOpen(false)}
                        maxWidth="md"
                        sx={{ zIndex: (theme) => theme.zIndex.modal + 200 }}
                      >
                        <DialogContent sx={{ p: 0, background: 'black' }}>
                          <img
                            src={todo.image || ''}
                            alt="full"
                            style={{ width: '100%', height: 'auto' }}
                          />
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                </Stack>
              )}
            </Stack>
          </ListItem>
        </CardContent>
      </Card>
    </Grow>
  );
}