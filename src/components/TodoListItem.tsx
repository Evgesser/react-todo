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

// keyframe definitions for blinking info icon (use muted cyan from palette)
const blinkKeyframes = {
  '@keyframes blinkInfo': {
    '0%,100%': { color: 'inherit' },
    '50%': { color: '#06B6D4' }, // cyan from palette
  },
  '@keyframes strikeThrough': {
    '0%': { textDecoration: 'none' },
    '100%': { textDecoration: 'line-through' },
  },
  '@keyframes fadeOut': {
    '0%': { opacity: 1 },
    '100%': { opacity: 0.5 },
  },
};

import {
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Check as CheckIcon,
  ReportProblem as ReportProblemIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import { formatCurrency } from '@/constants';
import type { Category } from '@/constants';
import type { TranslationKeys } from '@/locales/ru';
import type { Todo } from '@/types';
import type { UseTodosReturn, UseListsReturn } from '@/types/hooks';


import type { TodoListItemProps } from '@/types/componentProps';

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
    toggleMissing,
    setEditingId,
    setName,
    setDescription,
    setQuantity,
    setComment,
    setUnit,
    setAmount,
    setSpentAt,
    setDueDate,
    setPriority,
    setReminderAt,
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
    pendingCompleteIds = new Set<string>(),
  } = todoActions;

  const [infoAnchor, setInfoAnchor] = React.useState<HTMLElement | null>(null);
  const [infoImageOpen, setInfoImageOpen] = React.useState(false);
  const openInfo = (e: React.MouseEvent<HTMLElement>) => setInfoAnchor(e.currentTarget);
  const closeInfo = () => {
    setInfoAnchor(null);
    setInfoImageOpen(false);
  };


  const { viewingHistory, listDefaultColor, currentList } = listActions;
  const listCurrency = currentList?.currency || 'RUB';
  const categoryCurrency =
    todo.category &&
    (availableCategories.find((c) => c.value === todo.category) as Category | undefined)?.currency;
  const currency = categoryCurrency || listCurrency;
  // allow callers (like the shared page) to explicitly override which
  // action buttons should be visible. If not provided, fall back to
  // the historical behaviour (hide when viewingHistory is true).
  const la = listActions as UseListsReturn & { canEdit?: boolean; canDelete?: boolean };
  const canEdit = la.canEdit !== undefined ? la.canEdit : !viewingHistory;
  const canDelete = la.canDelete !== undefined ? la.canDelete : !viewingHistory;

  // background / text colours follow the logic that used to live in TodoList
  let itemBg: string | undefined;
  if (todo.missing) {
    // Styling handled by .glass-missing class to preserve glass effect
    itemBg = 'transparent';
  } else if (todo.completed) {
    // Hidden color dependency: using transparent for glass effect
    itemBg = 'transparent';
  } else {
    // Hidden color dependency: using transparent for glass effect
    itemBg = 'transparent';
  }

  let itemTextColor = theme.palette.text.primary as string;
  /*
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
  */
  if (todo.missing) {
    itemTextColor = theme.palette.text.primary as string;
  }

  return (
    <Grow in timeout={300}>
      <Card
        className={`glass ${todo.missing ? 'glass-missing' : ''}`}
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
          mb: theme.spacing(2),
          backgroundColor: itemBg || 'transparent',
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
            top: 0, insetInlineStart: 0, insetInlineEnd: 0, bottom: 0,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)',
            pointerEvents: 'none',
          } : {},
        }}
        elevation={0}
      >
        <CardContent sx={{ p: theme.spacing(2), '&:last-child': { pb: theme.spacing(2) } }}>
          <ListItem disableGutters sx={{ p: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
              {bulkMode && (
                <Checkbox
                  data-no-drag="true"
                  checked={selectedIds.has(todo._id)}
                  onChange={() => toggleSelect(todo._id)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  disableRipple
                  icon={<RadioButtonUncheckedIcon />}
                  checkedIcon={
                    <Box sx={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: '#4ade80',
                      color: 'common.white',
                    }}>
                      <CheckIcon fontSize="small" />
                    </Box>
                  }
                  sx={{
                    color: itemTextColor,
                    '& .MuiSvgIcon-root': { borderRadius: '50%' },
                  }}
                />
              )}
              <Checkbox
                data-no-drag="true"
                checked={todo.completed}
                onChange={() => !viewingHistory && !pendingCompleteIds.has(todo._id) && toggleComplete(todo)}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                disabled={viewingHistory || pendingCompleteIds.has(todo._id)}
                disableRipple
                icon={<RadioButtonUncheckedIcon />}
                checkedIcon={
                  <Box sx={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#4ade80',
                    color: 'common.white',
                    transition: 'transform 0.3s ease',
                    transform: todo.completed ? 'scale(1.1)' : 'scale(1)',
                  }}>
                    <CheckIcon fontSize="small" />
                  </Box>
                }
                sx={{
                  color: itemTextColor,
                  '& .MuiSvgIcon-root': { borderRadius: '50%' },
                  transition: 'color 0.3s ease',
                }}
              />

              {/* Status indicator */}
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: todo.status === 'in_progress' ? '#f59e0b' : todo.status === 'done' ? '#10b981' : '#6b7280',
                  flexShrink: 0,
                  transition: 'background-color 0.3s ease',
                }}
              />

              <Box sx={{ flex: 1 }}>
                {inlineEditId === todo._id ? (
                  <Stack spacing={1} sx={{ flex: 1 }} data-inline-edit-root={todo._id}>
                    <TextField
                      value={inlineName}
                      onChange={(e) => setInlineName(e.target.value)}
                      fullWidth
                      variant="filled"
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
                      variant="filled"
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
                        position: 'relative',
                        display: 'inline-block',
                        opacity: todo.completed ? 0.6 : 1,
                        transition: 'opacity 0.4s ease',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          width: todo.completed || todo.missing ? '100%' : '0%',
                          height: '2px',
                          bgcolor: itemTextColor,
                          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          opacity: 0.8,
                        },
                      }}
                    >
                      {todo.name}
                      {(todo.quantity != null && (todo.quantity !== 1 || todo.unit))
                        ? ` (${todo.quantity}${todo.unit ? ' ' + todo.unit : ''})`
                        : ''}
                    </Typography>
                    {(todo.amount != null || todo.spentAt) && (
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mt: 0.5 }}>
                        {todo.amount != null ? formatCurrency(todo.amount, currency) : ''}
                        {todo.amount != null && todo.spentAt ? ' · ' : ''}
                        {todo.spentAt ? new Date(todo.spentAt).toLocaleDateString() : ''}
                      </Typography>
                    )}
                    {todo.priority && (
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mt: 0.5 }}>
                        {`Priority: ${todo.priority}`}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>

              <Stack direction="row" spacing={1}>
                <IconButton
                  data-no-drag="true"
                    edge="end"
                    size="small"
                    aria-label={todo.missing ? t.todos.unmarkMissing : t.todos.markMissing}
                    title={todo.missing ? t.todos.unmarkMissing : t.todos.markMissing}
                    sx={{ color: todo.missing ? theme.palette.error.main : itemTextColor }}
                    onClick={() => toggleMissing(todo)}
                  >
                  <ReportProblemIcon fontSize="small" />
                </IconButton>
                {canEdit && (
                  <IconButton
                    data-no-drag="true"
                    edge="end"
                    size="small"
                    aria-label={t.todos.edit}
                    title={t.todos.edit}
                    sx={{
                      color: itemTextColor,
                      transition: 'transform 0.2s ease',
                      '&:hover': { transform: 'scale(1.2)' }
                    }}
                    onClick={() => {
                      setEditingId(todo._id);
                      setName(todo.name);
                      setDescription(todo.description);
                      setQuantity(todo.quantity);
                      setComment(todo.comment || '');
                      setUnit(todo.unit || '');
                      setColor(todo.color || listDefaultColor);
                      setCategory(todo.category || '');
                      setAmount(typeof todo.amount === 'number' ? todo.amount : undefined);
                      setSpentAt(todo.spentAt ? new Date(todo.spentAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
                      setDueDate(todo.dueDate ? new Date(todo.dueDate).toISOString().slice(0, 10) : '');
                      setPriority(todo.priority || '');
                      setReminderAt(todo.reminderAt ? new Date(todo.reminderAt).toISOString().slice(0, 16) : '');
                      if (onEdit) {
                        onEdit();
                      }
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
                {canDelete && (
                  <IconButton
                    data-no-drag="true"
                    edge="end"
                    size="small"
                    aria-label={t.todos.delete}
                    title={t.todos.delete}
                    sx={{
                      color: itemTextColor,
                      transition: 'transform 0.2s ease',
                      '&:hover': { transform: 'scale(1.2)', color: theme.palette.error.main }
                    }}
                    onClick={() => deleteTodo(todo._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
                {(todo.description || todo.comment) && (
                  <>
                    <IconButton
                      data-no-drag="true"
                      edge="end"
                      size="small"
                      aria-label={t.todos.description}
                      title={t.todos.description}
                      sx={{
                        color: itemTextColor,
                        ...blinkKeyframes,
                        animation: infoAnchor ? 'none' : 'blinkInfo 1.5s infinite',
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
            </Stack>
          </ListItem>
        </CardContent>
      </Card>
    </Grow>
  );
}