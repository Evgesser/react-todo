import * as React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Container,
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Snackbar,
  LinearProgress,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';

import { getLuminance, getTextColor } from '@/utils/color';
import Header from '@/components/layout/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import type { IntlShape } from 'react-intl';
import { useTheme } from '@mui/material/styles';
import { useSharedTodos } from '@/hooks/useSharedTodos';
import TodoList from '@/components/TodoList';
import type { UseTodosReturn } from '@/hooks/useTodos';
import type { UseListsReturn } from '@/hooks/useLists';

export default function SharedPage() {
  const router = useRouter();
  const { token } = router.query;
  const { t, formatMessage } = useLanguage();
  const theme = useTheme();

    const _formatMessage = React.useCallback(
      (id: string, values?: Parameters<IntlShape['formatMessage']>[1]) =>
        formatMessage(id, values),
      [formatMessage]
    );

  const [snackbarMsg, setSnackbarMsg] = React.useState('');
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);

  // viewport/list sizing to make the todos scrollable like the main page
  const [viewportHeight, setViewportHeight] = React.useState<number>(
    typeof window !== 'undefined' ? window.innerHeight : 0
  );
  const headerRef = React.useRef<HTMLDivElement>(null);
  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = React.useState<number>(0);

  React.useLayoutEffect(() => {
    const vh = typeof window !== 'undefined' ? window.innerHeight : 0;
    setViewportHeight(vh);
    const headerH = headerRef.current?.offsetHeight || 0;
    const toolbarH = toolbarRef.current?.offsetHeight || 0;
    const margins = 64; // container vertical margins (mt=4,mb=4)
    const buffer = 50;
    const safe = vh - (typeof document !== 'undefined' ? document.documentElement.clientHeight : vh);
    const newListH = vh - headerH - toolbarH - margins - buffer - safe;
    setListHeight(newListH > 0 ? newListH : 0);
  }, []);

  const tokenStr = typeof token === 'string' ? token : '';
  const todoActions = useSharedTodos(tokenStr, setSnackbarMsg, _formatMessage);

  if (!tokenStr) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h6">{t.lists.share} - {t.messages.invalidLink}</Typography>
      </Container>
    );
  }

  if (!todoActions.list) {
    if (todoActions.error) {
      return (
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h6">{t.messages.error}</Typography>
        </Container>
      );
    }
    return (
      <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h6">{t.messages.loading}</Typography>
      </Container>
    );
  }

  // header color logic (copied from index.tsx)
  const headerColor = todoActions.list?.defaultColor || '#ffffff';
  const themeBg = (theme.palette.background?.default as string) || (theme.palette.mode === 'dark' ? '#121212' : '#ffffff');
  const bgLum = themeBg && themeBg.startsWith('#') ? getLuminance(themeBg) : (theme.palette.mode === 'dark' ? 0 : 1);
  const headerLum = getLuminance(headerColor);
  let headerTextColor = theme.palette.getContrastText ? theme.palette.getContrastText(headerColor) : getTextColor(headerColor);
  const LIGHT_WHITE = 'rgba(255,255,255,0.95)';
  if (!headerTextColor) headerTextColor = getTextColor(headerColor);
  if (Math.abs(headerLum - bgLum) < 0.35) {
    headerTextColor = bgLum > 0.5 ? '#000000' : (theme.palette.mode === 'dark' ? LIGHT_WHITE : '#ffffff');
  } else {
    if ((headerTextColor === '#fff' || headerTextColor === '#ffffff') && theme.palette.mode === 'dark') headerTextColor = LIGHT_WHITE;
  }
  if (theme.palette.mode === 'light') {
    try {
      const ht = (headerTextColor || '').toString().toLowerCase();
      if (ht === '#fff' || ht === '#ffffff' || ht === 'white' || ht === LIGHT_WHITE.toLowerCase()) {
        headerTextColor = 'rgba(0,0,0,0.87)';
      }
    } catch {
      headerTextColor = 'rgba(0,0,0,0.87)';
    }
  }
  const headerTextIsHex = typeof headerTextColor === 'string' && headerTextColor.startsWith('#');
  const headerTextLum = headerTextIsHex ? getLuminance(headerTextColor) : null;
  if (headerTextLum === null || Math.abs((headerTextLum || 0) - bgLum) < 0.32) {
    headerTextColor = theme.palette.text.primary;
  }

  // Reuse the same `TodoList` UI as the main page by adapting the shared hook.
  // `useSharedTodos` exposes a smaller API; create a minimal adapter that
  // satisfies `TodoList` / `TodoListItem` expectations and renders the same look.
  const todoActionsAdapter = {
    // map basic state from shared hook
    todos: todoActions.todos,
    todosLoading: false,
    filterText: todoActions.filterText,
    filterCategory: todoActions.filterCategory,
    dragOverIndex: todoActions.dragOverIndex,

    // no-op form/inline state (shared view is read-only)
    name: '',
    description: '',
    quantity: 1,
    comment: '',
    unit: '',
    color: '',
    category: '',
    editingId: null,
    bulkMode: false,
    selectedIds: new Set<string>(),
    inlineEditId: null,
    inlineName: '',
    inlineDescription: '',
    lastAdded: null,
    categoryWarning: '',
    clearedForName: null,
    reorderInFlight: false,

    // setters (no-op or delegated where sensible)
    setTodos: () => {},
    setName: () => {},
    setDescription: () => {},
    setQuantity: () => {},
    setComment: () => {},
    setUnit: () => {},
    setColor: () => {},
    setCategory: () => {},
    setCategoryManual: () => {},
    setEditingId: () => {},
    setFilterText: todoActions.setFilterText,
    setFilterCategory: todoActions.setFilterCategory,
    setBulkMode: () => {},
    setSelectedIds: () => {},
    setInlineEditId: () => {},
    setInlineName: () => {},
    setInlineDescription: () => {},
    setLastAdded: () => {},

    // methods (delegate to shared hook where available)
    fetchTodos: async () => {},
    addItem: async () => {},
    toggleComplete: todoActions.toggleComplete,
    toggleMissing: todoActions.toggleMissing,
    deleteTodo: async () => {},
    toggleSelect: () => {},
    clearSelection: () => {},
    bulkComplete: async () => {},
    bulkDelete: async () => {},
    onDragStart: todoActions.onDragStart,
    onDragOver: todoActions.onDragOver,
    onDragEnter: todoActions.onDragEnter,
    onDragLeave: todoActions.onDragLeave,
    onDrop: todoActions.onDrop,
    onTouchStart: todoActions.onTouchStart,
    onTouchMove: todoActions.onTouchMove,
    onTouchEnd: todoActions.onTouchEnd,
    startInlineEdit: () => {},
    finishInlineEdit: async () => {},
    moveCategory: todoActions.moveCategory,
  } as unknown as UseTodosReturn;

  const listActionsStub = {
    // keep most interactions available for shared view, but disable
    // editing and deleting so the list cannot be modified from a shared link
    viewingHistory: false,
    listDefaultColor: todoActions.list?.defaultColor || '#ffffff',
    canEdit: false,
    canDelete: false,
  } as unknown as UseListsReturn;

  return (
    <Container
      maxWidth="sm"
      suppressHydrationWarning
      sx={{
        mt: 4,
        mb: 4,
        height: viewportHeight
          ? `calc(${viewportHeight}px - env(safe-area-inset-bottom) - 50px - 64px)`
          : 'calc(100vh - 64px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Head>
        <title>{todoActions.list?.name || t.header.title}</title>
      </Head>
      <div ref={headerRef}>
        <Header
          headerColor={headerColor}
          effectiveHeaderTextColor={headerTextColor}
          t={t}
        />
      </div>

      {/* simple search input */}
      <div ref={toolbarRef}>
        <Box sx={{ mb: 2 }}>
        <TextField
          label={t.search.placeholder}
          value={todoActions.filterText}
          onChange={(e) => todoActions.setFilterText(e.target.value)}
          fullWidth
          InputProps={{
            endAdornment: todoActions.filterText ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => todoActions.setFilterText('')}
                  edge="end"
                  aria-label={`Clear ${t.search.placeholder}`}
                  title={`Clear ${t.search.placeholder}`}
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
        </Box>
      </div>

      {/* progress bar (mirror the implementation in index.tsx) */}
      {(() => {
        const completedCount = todoActions.todos.filter((t) => t.completed).length;
        const totalTodos = todoActions.todos.length;
        const progressValue = totalTodos === 0 ? 0 : (completedCount / totalTodos) * 100;

        return (
          <Box
            sx={{
              position: 'sticky',
              top: 0,
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
                  color:
                    theme.palette.mode === 'light'
                      ? theme.palette.secondary.contrastText
                      : theme.palette.secondary.main,
                  marginInlineStart: 1,
                  minWidth: 56,
                  textAlign: 'right',
                  direction: 'ltr',
                })}
              >
                {completedCount} / {totalTodos}
              </Typography>
            </Box>
          </Box>
        );
      })()}

      <Box
        sx={{
          height: listHeight ? `${listHeight}px` : 'auto',
          overflowY: 'auto',
          paddingBottom: `calc(env(safe-area-inset-bottom) + 100px)`,
        }}
      >
        <TodoList
          todoActions={todoActionsAdapter}
          listActions={listActionsStub}
          availableCategories={[]}
          t={t}
          onEdit={() => {}}
        />
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMsg}
      />
    </Container>
  );
}
