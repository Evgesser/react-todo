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

  // compute fixed viewport height to avoid page scrolling and Safari vh bug.
  // useLayoutEffect so we measure before browser paints (prevents white flash)
  const [viewportHeight, setViewportHeight] = React.useState<number>(
    typeof window !== 'undefined' ? window.innerHeight : 0
  );
  const headerRef = React.useRef<HTMLDivElement>(null);
  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = React.useState<number>(0);
  const [progressTop, setProgressTop] = React.useState<number>(0);

  React.useLayoutEffect(() => {
    // measure once, ignore any subsequent resize events (including those
    // triggered by scrolling chrome).  orientation change will reload page.
    const vh = window.innerHeight;
    setViewportHeight(vh);
    const headerH = headerRef.current?.offsetHeight || 0;
    const toolbarH = toolbarRef.current?.offsetHeight || 0;
    const margins = 64; // container vertical margins (mt=4,mb=4)
    const buffer = 50; // extra space for browser chrome
    const safe = vh - document.documentElement.clientHeight; // approximate bottom inset
    const newListH = vh - headerH - toolbarH - margins - buffer - safe;
    setListHeight(newListH > 0 ? newListH : 0);
    // compute sticky top for pinned progress (just under header+toolbar)
    setProgressTop(headerH + toolbarH + 8);
  }, []);

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
        mt: 4,
        mb: 4,
        // lock overall container to viewport height so the page itself never scrolls
        // reserve any bottom safe-area inset so content never slides under browser menu
      // include a small extra buffer (50px) for persistent nav bars that don't report
      // their height via safe-area-inset. fall back to 100vh initially to avoid blank
      // screen during SSR/hydration.
      // subtract vertical margins (4*8px each) plus safe area and buffer
      height: viewportHeight
        ? `calc(${viewportHeight}px - env(safe-area-inset-bottom) - 50px - 64px)`
        : 'calc(100vh - 64px)',
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
            categories={availableCategories}
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
                  value={todoActions.todos.length === 0 ? 0 : (todoActions.todos.filter((t) => t.completed).length / todoActions.todos.length) * 100}
                  sx={{
                    height: 8,
                    borderRadius: 9999,
                    backgroundColor: 'transparent',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #ECCE8E 0%, #DBCF96 100%)',
                      borderRadius: 9999,
                    },
                  }}
                  aria-label={`progress ${todoActions.todos.filter((t) => t.completed).length} of ${todoActions.todos.length}`}
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'secondary.main', ml: 1, minWidth: 56, textAlign: 'right' }}>
                {todoActions.todos.filter((t) => t.completed).length} / {todoActions.todos.length}
              </Typography>
            </Box>
          </Box>

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
              right: 24,
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
