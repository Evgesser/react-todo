import * as React from 'react';
import Head from 'next/head';
import type { IntlShape } from 'react-intl';
import {
  Container,
  Box,
  LinearProgress,
  Fab,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

// shared types, constants and helpers
// constants not referenced directly in this file
import {
  createList as apiCreateList,
  createTodosBulk,
} from '@/lib/api';

import { useViewportHeight } from '@/hooks/useViewportHeight';


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

// UI components
import Header from '../components/layout/Header';
import SearchBulk from '../components/toolbar/SearchBulk';
import HistoryDialog from '../components/dialogs/HistoryDialog';
import NewListDialog from '../components/dialogs/NewListDialog';
import PersonalizationDialog from '@/components/dialogs/PersonalizationDialog';
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


  // Authentication: select only userId to avoid wide re-renders
  const userId = useAppStore((s) => s.userId);

  // List management hook
  const _formatMessage = (id: string, values?: Parameters<IntlShape['formatMessage']>[1]) =>
    formatMessage(id, values);
  const listActions = useLists({
    userId,
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
  } = usePersonalization(userId, t);

  // new-list dialog state
  const [newListDialogOpen, setNewListDialogOpen] = React.useState(false);



  // Todo management hook
  const todoActions = useTodos({
    currentListId: listActions.currentListId,
    listDefaultColor: listActions.listDefaultColor,
    onSnackbar: (msg) => {
      setSnackbarMsg(msg);
      setSnackbarOpen(true);
    },
    t,
    formatMessage,
    nameCategoryMap,
    products,
  });

  // derive categories that actually appear in the current todos list
  const filterCategories = React.useMemo(() => {
    const present = new Set(
      (todoActions.todos || [])
        .map((x) => (x.category || '').trim())
        .filter((v) => v)
    );
    const result = availableCategories.filter((c) => present.has(c.value));
    // add any categories seen in todos that are not part of availableCategories
    present.forEach((val) => {
      if (!result.find((r) => r.value === val)) {
        const label = (t.categoryLabels as Record<string, string>)?.[val] || val;
        result.push({ value: val, label, icon: null });
      }
    });
    return result;
  }, [todoActions.todos, availableCategories, t]);



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
    listActions,
    todoActions,
    setFormOpen,
    setNewListDialogOpen
  );

  React.useEffect(() => {
    if (listActions.viewingHistory) setFormOpen(false);
    // when switching back out of history, reload todos for current list
    if (!listActions.viewingHistory && listActions.currentListId) {
      todoActions.fetchTodos(listActions.currentListId);
    }
    // todoActions is intentionally omitted to avoid refetch loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listActions.viewingHistory, listActions.currentListId]);

  const headerColor =
    (listActions.currentList && listActions.currentList.defaultColor) ||
    listActions.listDefaultColor ||
    '#ffffff';
  const { effectiveHeaderTextColor } = useHeaderColors(headerColor, menuAnchor);

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
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Head>
        <title>{t.header.title}</title>
      </Head>
      <div ref={headerRef}>
        <Header headerColor={headerColor} effectiveHeaderTextColor={effectiveHeaderTextColor} t={t} />
      </div>
      {!userId ? (
        <AuthPanel t={t} formatMessage={_formatMessage} onSnackbar={(msg) => { setSnackbarMsg(msg); setSnackbarOpen(true); }} />
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
              await listActions.completeList(listActions.currentListId);
              todoActions.setTodos([]);
            }}
            updateShareToken={listActions.updateShareToken}
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
              availableCategories={availableCategories}
              setAvailableCategories={setAvailableCategories}
              updateNameCategory={updateNameCategory}
              nameCategoryMap={nameCategoryMap}
              products={products}
              listDefaultColor={listActions.listDefaultColor}
              t={t}
              formOpen={formOpen}
              setFormOpen={setFormOpen}
              dialogMode // render inside dialog
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
              availableCategories={availableCategories}
              t={t}
              onEdit={() => setFormOpen(true)}
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
            <Fab onClick={() => setFormOpen(true)} aria-label="add">
              <AddIcon />
            </Fab>
          </Box>

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
              const created = await apiCreateList(userId, name, '#ffffff');
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
                setFormOpen(true);
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

          <AppSnackbar
            open={snackbarOpen}
            message={snackbarMsg}
            onClose={() => setSnackbarOpen(false)}
          />
        </Box>
      )}

    </Container>
  );
}
