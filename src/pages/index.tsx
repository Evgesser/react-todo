import * as React from 'react';
import Head from 'next/head';
import {
  Container,
  Box,
  LinearProgress,
} from '@mui/material';

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
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePersonalization } from '../hooks/usePersonalization';
import { useHeaderColors } from '../hooks/useHeaderColors';
import { useInitialLists } from '../hooks/useInitialLists';

import TodoForm from '../components/TodoForm';
import AppSnackbar from '../components/AppSnackbar';

// UI components
import Header from '../components/layout/Header';
import SearchBulk from '../components/toolbar/SearchBulk';
import CollapseHandle from '../components/layout/CollapseHandle';
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


  // Authentication hook
  const auth = useAuth();

  // List management hook
  const listActions = useLists({
    userId: auth.userId,
    onSnackbar: (msg) => {
      setSnackbarMsg(msg);
      setSnackbarOpen(true);
    },
    t,
  });
  const [formOpen, setFormOpen] = React.useState(true);
  const [historyOpen, setHistoryOpen] = React.useState(false);

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
  } = usePersonalization(auth.userId);

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
    auth.userId,
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
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Head>
        <title>{t.header.title}</title>
      </Head>
      <Header headerColor={headerColor} effectiveHeaderTextColor={effectiveHeaderTextColor} />
      {!auth.userId ? (
        <AuthPanel t={t} onSnackbar={(msg) => { setSnackbarMsg(msg); setSnackbarOpen(true); }} />
      ) : (
        <Box>
          {listActions.isLoading && <LinearProgress />}
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
            toggleForm={() => setFormOpen((v) => !v)}
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
          />

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
          />

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
            />
          )}

          {!formOpen && (
            <CollapseHandle
              lastAdded={todoActions.lastAdded}
              onClick={() => setFormOpen(true)}
            />
          )}


          {/* always show todos list regardless of history state */}
          <TodoList
            todoActions={todoActions}
            listActions={listActions}
            availableCategories={availableCategories}
            t={t}
          />

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
          />
          <NewListDialog
            open={newListDialogOpen}
            onClose={() => setNewListDialogOpen(false)}
            availableTemplates={availableTemplates}
            onCreate={async (name, templateName) => {
              if (!auth.userId) return false;
              const created = await apiCreateList(auth.userId, name, '#ffffff');
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
            userId={auth.userId}
            availableCategories={availableCategories}
            setAvailableCategories={setAvailableCategories}
            availableTemplates={availableTemplates}
            setAvailableTemplates={setAvailableTemplates}
            products={products}
            setSnackbarMsg={setSnackbarMsg}
            setSnackbarOpen={setSnackbarOpen}
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
