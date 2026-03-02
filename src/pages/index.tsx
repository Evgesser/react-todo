import * as React from 'react';
import Head from 'next/head';
import {
  Container,
  Typography,
  TextField,
  Button,
  IconButton,
  Box,
  Paper,
  Stack,
  Collapse,
  Snackbar,
  Alert,
  InputAdornment,
  Autocomplete,
} from '@mui/material';

// shared types, constants and helpers
import { Template } from '@/types';
import { getTextColor, getLuminance } from '@/utils/color';
import { categories as defaultCategories, templates as defaultTemplates, Category, iconMap, iconChoices } from '@/constants';
import {
  createList as apiCreateList,
  createTodosBulk,
} from '@/lib/api';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ClearIcon from '@mui/icons-material/Clear';
import { useTheme, alpha } from '@mui/material/styles';

// Custom hooks
import { useFormAutoCollapse } from '../hooks/useFormAutoCollapse';
import { useTodos } from '../hooks/useTodos';
import { useLists } from '../hooks/useLists';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePersonalization } from '../hooks/usePersonalization';

// UI components
import Header from '../components/layout/Header';
import SearchBulk from '../components/toolbar/SearchBulk';
import CollapseHandle from '../components/layout/CollapseHandle';
import QuantityDialog from '../components/dialogs/QuantityDialog';
import HistoryDialog from '../components/dialogs/HistoryDialog';
import NewListDialog from '../components/dialogs/NewListDialog';
import PersonalizationDialog from '@/components/dialogs/PersonalizationDialog';
import ListToolbar from '../components/toolbar/ListToolbar';
import TodoList from '../components/TodoList';
import AuthPanel from '../components/AuthPanel';


export default function Home() {
  const { t } = useLanguage();

  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const openMenu = (e: React.MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMsg, setSnackbarMsg] = React.useState('');

  const theme = useTheme();
  
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
  const [quantityDialogOpen, setQuantityDialogOpen] = React.useState(false);
  const [tempQuantity, setTempQuantity] = React.useState<number>(1);
  const [historyOpen, setHistoryOpen] = React.useState(false);

  // personalization state (categories, templates, products, etc.)
  const {
    availableCategories,
    setAvailableCategories,
    availableTemplates,
    setAvailableTemplates,
    nameCategoryMap,
    setNameCategoryMap,
    products,
    setProducts,
    personalDialogOpen,
    setPersonalDialogOpen,
    updateNameCategory,
  } = usePersonalization(auth.userId, t);

  // new-list dialog state
  const [newListDialogOpen, setNewListDialogOpen] = React.useState(false);


  // helper: add a category to personalization if it doesn't already exist
  // this uses a functional state update so multiple rapid calls merge correctly
  const ensureCategoryExists = React.useCallback(
    async (val: string, iconKey?: string) => {
      const v = val.trim();
      if (!v) return;
      setAvailableCategories((prev) => {
        if (prev.find((c) => c.value === v)) return prev;
        // choose explicit iconKey if provided, otherwise try guessing
        let finalKey = iconKey;
        if (!finalKey) {
          finalKey = Object.keys(iconMap).find((k) => k.toLowerCase() === v.toLowerCase());
        }
        const newCat: Category = {
          value: v,
          label: v,
          icon: finalKey ? iconMap[finalKey] : null,
        };
        return [...prev, newCat];
      });
      // we no longer save here; instead a dedicated effect handles persistence
      // but returning a promise keeps the async signature for callers
      return;
    },
    []
  );

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

  // compute autocomplete options outside render to avoid conditional hook complaint
  const nameOptions = React.useMemo(() => {
    const map = new Map<string, { name: string; category?: string; comment?: string; icon?: string }>();
    todoActions.todos.forEach((t) => {
      if (t.name) {
        map.set(t.name, { name: t.name, category: t.category });
      }
    });
    products.forEach((p) => {
      if (p.name && !map.has(p.name)) {
        map.set(p.name, { name: p.name, category: p.category, comment: p.comment, icon: p.icon });
      }
    });
    return Array.from(map.values());
  }, [todoActions.todos, products]);

  // category suggestions smart list: categories previously used with the same name
  // or recorded in the global map
  const categoryOptions = React.useMemo(() => {
    const name = todoActions.name.trim().toLowerCase();
    const priority: Category[] = [];
    if (name) {
      const mapped = nameCategoryMap[name];
      if (mapped !== undefined) {
        const cat = availableCategories.find((c) => c.value === mapped);
        if (cat) priority.push(cat);
      }
      const matches = todoActions.todos.filter(
        (t) => t.name.trim().toLowerCase() === name && t.category !== undefined
      );
      const seen = new Set<string>(priority.map((c) => c.value));
      matches.forEach((t) => {
        const val = t.category || '';
        if (!seen.has(val)) {
          seen.add(val);
          const cat = availableCategories.find((c) => c.value === val);
          if (cat) priority.push(cat);
        }
      });
    }
    const full = [...priority];
    availableCategories.forEach((c) => {
      if (!full.find((x) => x.value === c.value)) full.push(c);
    });
    // if the user has cleared category for current name, hide blank entry
    if (
      todoActions.category === '' &&
      todoActions.clearedForName === name
    ) {
      return full.filter((c) => c.value !== '');
    }
    return full;
  }, [todoActions.name, todoActions.todos, availableCategories, nameCategoryMap, todoActions.category, todoActions.clearedForName]);

  // temporary icon selected while typing new category
  const [tempIconKey, setTempIconKey] = React.useState('');

  // keep tempIconKey in sync when user selects existing category
  React.useEffect(() => {
    const exist = availableCategories.find((c) => c.value === todoActions.category);
    if (exist) {
      const key = Object.keys(iconMap).find((k) => iconMap[k] === exist.icon) || '';
      setTempIconKey(key);
    } else {
      setTempIconKey('');
    }
  }, [todoActions.category, availableCategories]);

  const displayedCategory = React.useMemo(() => {
    if (
      todoActions.category === '' &&
      todoActions.clearedForName === todoActions.name.trim().toLowerCase()
    ) {
      return '';
    }
    const found = availableCategories.find(
      (c) => c.value === todoActions.category
    );
    return found ? found.label : todoActions.category;
  }, [availableCategories, todoActions.category, todoActions.name, todoActions.clearedForName]);

  // wrapper used when user wants to add an item; create category first
  const handleAdd = React.useCallback(async () => {
    await ensureCategoryExists(todoActions.category, tempIconKey || undefined);
    await todoActions.addItem();
    updateNameCategory(todoActions.name, todoActions.category, todoActions.comment);
    setTempIconKey('');
  }, [ensureCategoryExists, todoActions, tempIconKey, updateNameCategory]);

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


  // Separate effect to load lists on userId change - avoids circular deps in callbacks
  React.useEffect(() => {
    if (!auth.userId) return;
    
    // Use async IIFE but don't include deps that would cause loops
    (async () => {
      const data = await listActions.loadLists();
      if (data && data.length > 0) {
        const firstActive = data.find((l) => !l.completed);
        if (firstActive) {
          // есть активный список - загружаем его
          await listActions.selectList(firstActive._id);
          todoActions.setColor(firstActive.defaultColor || '#ffffff');
          setFormOpen(true);
          await todoActions.fetchTodos(firstActive._id);
        } else {
          // все списки завершены - предлагаем создать новый
          setNewListDialogOpen(true);
        }
      } else {
        // нет списков - предлагаем создать первый
        setNewListDialogOpen(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.userId]);

  React.useEffect(() => {
    if (listActions.viewingHistory) setFormOpen(false);
    // when switching back out of history, reload todos for current list
    if (!listActions.viewingHistory && listActions.currentListId) {
      todoActions.fetchTodos(listActions.currentListId);
    }
    // todoActions is intentionally omitted to avoid refetch loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listActions.viewingHistory, listActions.currentListId]);

  const headerColor = (listActions.currentList && listActions.currentList.defaultColor) || listActions.listDefaultColor || '#ffffff';
  // Ensure header text contrasts with the page background in dark/light theme
  const themeBg = (theme.palette.background?.default as string) || (theme.palette.mode === 'dark' ? '#121212' : '#ffffff');
  const bgLum = themeBg && themeBg.startsWith('#') ? getLuminance(themeBg) : (theme.palette.mode === 'dark' ? 0 : 1);
  const headerLum = getLuminance(headerColor);
  // Prefer MUI contrast result but fall back to our luminance helper for edge cases
  let headerTextColor = theme.palette.getContrastText ? theme.palette.getContrastText(headerColor) : getTextColor(headerColor);
  const LIGHT_WHITE = 'rgba(255,255,255,0.95)';
  if (!headerTextColor) headerTextColor = getTextColor(headerColor);
  // If header color is too similar to page background, choose text contrasting the background instead
  if (Math.abs(headerLum - bgLum) < 0.35) {
    headerTextColor = bgLum > 0.5 ? '#000000' : (theme.palette.mode === 'dark' ? LIGHT_WHITE : '#ffffff');
  } else {
    // when computed text is white on dark theme, use a slightly off-white for better visibility
    if ((headerTextColor === '#fff' || headerTextColor === '#ffffff') && theme.palette.mode === 'dark') headerTextColor = LIGHT_WHITE;
  }
  // Prevent white header text in light theme (unreadable on light backgrounds)
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
  // Ensure headerTextColor also contrasts well with the page background; otherwise fall back to theme text color
  const headerTextIsHex = typeof headerTextColor === 'string' && headerTextColor.startsWith('#');
  const headerTextLum = headerTextIsHex ? getLuminance(headerTextColor) : null;
  if (headerTextLum === null || Math.abs((headerTextLum || 0) - bgLum) < 0.32) {
    headerTextColor = theme.palette.text.primary;
  }
  // When the menu is open, make header and toggle visually stronger so they stay readable
  const menuActiveHeaderColor = theme.palette.mode === 'light' ? 'rgba(0,0,0,0.87)' : LIGHT_WHITE;
  const effectiveHeaderTextColor = menuAnchor ? menuActiveHeaderColor : headerTextColor; // keep for menu styling
  // keep ref in sync so scroll handler can read latest value without needing it as a dependency
  // hook will handle auto‑collapse on scroll/keyboard
  useFormAutoCollapse(formOpen, setFormOpen, menuAnchor);

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
          <ListToolbar
            lists={listActions.lists}
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
            onCancelBulk={() => { todoActions.setBulkMode(false); todoActions.clearSelection(); }}
          />

          <Collapse in={!listActions.viewingHistory && formOpen} timeout={400}>
            <Paper sx={{ p: 2, mb: 2, width: '100%' }} elevation={3}>
              {/* form header with collapse button */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">{t.todos.addEdit}</Typography>
                <IconButton size="small" onClick={() => setFormOpen(false)}>
                  <ExpandMoreIcon sx={{ transform: 'rotate(-90deg)' }} />
                </IconButton>
              </Box>
              <Stack spacing={2}>
                {/* name field now provides autocomplete based on existing todo names */}
                <Autocomplete
                  freeSolo
                  options={nameOptions}
                  getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.name)}
                  inputValue={todoActions.name}
                  onInputChange={(_, v) => todoActions.setName(v)}
                  onChange={(_, v) => {
                    if (typeof v === 'string') {
                      todoActions.setName(v);
                    } else if (v && typeof v === 'object') {
                      todoActions.setName(v.name);
                      if (v.category) todoActions.setCategory(v.category);
                      // could also prefill description/comment/icon if desired
                    }
                  }}
                  renderOption={(props, option) => {
                    const data = typeof option === 'string' ? { name: option } : option;
                    return (
                      <li {...props}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {data.icon && iconMap[data.icon] ? (
                            <Box sx={{ display: 'flex' }}>
                              {React.createElement(iconMap[data.icon], { fontSize: 'small' })}
                            </Box>
                          ) : null}
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{data.name}</span>
                            {data.category && (
                              <Typography variant="caption" color="text.secondary">
                                {data.category}
                              </Typography>
                            )}
                            {data.comment && (
                              <Typography variant="caption" color="text.secondary">
                                {data.comment}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t.todos.name}
                      placeholder={t.todos.namePlaceholder}
                      fullWidth
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAdd();
                          e.preventDefault();
                        }
                      }}
                      InputProps={{
                        ...params.InputProps,
                        // rely on Autocomplete's built-in adornments (clear button + popup indicator)
                        endAdornment: params.InputProps.endAdornment,
                      }}
                    />
                  )}
                />
                <TextField
                  label={t.todos.description}
                  placeholder={t.todos.descriptionPlaceholder}
                  value={todoActions.description}
                  onChange={(e) => todoActions.setDescription(e.target.value)}
                  fullWidth
                  InputProps={{
                    endAdornment: todoActions.description ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => todoActions.setDescription('')}
                          edge="end"
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                />
                <TextField
                  label={t.todos.quantity}
                  type="number"
                  value={todoActions.quantity}
                  onClick={() => {
                    setTempQuantity(todoActions.quantity || 1);
                    setQuantityDialogOpen(true);
                  }}
                  onFocus={(e) => {
                    setTempQuantity(todoActions.quantity || 1);
                    setQuantityDialogOpen(true);
                    // remove focus so native focus styles don't cause label clipping
                    (e.target as HTMLElement).blur();
                  }}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ readOnly: true }}
                  inputProps={{ min: 1 }}
                  fullWidth
                />
                <TextField
                  label={t.todos.comment}
                  placeholder={t.todos.commentPlaceholder}
                  value={todoActions.comment}
                  onChange={(e) => todoActions.setComment(e.target.value)}
                  fullWidth
                  InputProps={{
                    endAdornment: todoActions.comment ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => todoActions.setComment('')}
                          edge="end"
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                />
                <TextField
                  label={t.todos.color}
                  type="color"
                  value={todoActions.color}
                  onChange={(e) => todoActions.setColor(e.target.value)}
                  sx={{ width: 80 }}
                />
                <Autocomplete
                  freeSolo
                  options={categoryOptions}
                  getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.label || opt.value)}
                  value={
                    // when category was cleared intentionally, don't treat empty as default
                    todoActions.category === '' && todoActions.clearedForName === todoActions.name.trim().toLowerCase()
                      ? null
                      : availableCategories.find((c) => c.value === todoActions.category) ||
                        (todoActions.category
                          ? { value: todoActions.category, label: todoActions.category, icon: null }
                          : null)
                  }
                  inputValue={displayedCategory}
                  onInputChange={(_, v, reason) => {
                    if (reason === 'input') {
                      todoActions.setCategoryManual(v);
                    }
                  }}
                  onChange={(_, v) => {
                    let val = '';
                    if (typeof v === 'string') {
                      val = v;
                    } else if (v && typeof v === 'object') {
                      val = v.value || '';
                    }
                    todoActions.setCategoryManual(val);
                    ensureCategoryExists(val);
                  }}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {option.icon ? <option.icon fontSize="small" sx={{ mr: 0.5 }} /> : null}
                        {option.label || option.value}
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField {...params} label={t.todos.category} fullWidth />
                  )}
                />
                {todoActions.categoryWarning && (
                  <Box sx={{ mt: 1 }}>
                    <Alert severity="warning" onClose={() => todoActions.setCategoryManual(todoActions.category)}>
                      {todoActions.categoryWarning}
                    </Alert>
                  </Box>
                )}
                {/* if category text doesn't match existing, allow picking icon */}
                {todoActions.category &&
                  !availableCategories.find((c) => c.value === todoActions.category) && (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {iconChoices.map((ic) => (
                        <IconButton
                          key={ic.key}
                          size="small"
                          color={tempIconKey === ic.key ? 'primary' : 'default'}
                          onClick={() => setTempIconKey(ic.key)}
                        >
                          <ic.icon fontSize="small" />
                        </IconButton>
                      ))}
                      <IconButton
                        size="small"
                        onClick={() => setTempIconKey('')}
                        sx={{ ml: 1 }}
                        title={t.dialogs.personalization.noIcon}
                      >
                        ✖️
                      </IconButton>
                    </Box>
                  )}
                <Stack direction="row" spacing="2">
                  <Button variant="contained" onClick={handleAdd}>
                    {todoActions.editingId ? t.todos.save : t.todos.add}
                  </Button>
                  {todoActions.editingId && (
                    <Button
                      variant="outlined"
                      onClick={() => {
                        todoActions.setEditingId(null);
                        todoActions.setName('');
                        todoActions.setDescription('');
                        todoActions.setQuantity(1);
                        todoActions.setComment('');
                        todoActions.setColor(listActions.listDefaultColor);
                      }}
                    >
                      {t.todos.cancel}
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Paper>
            </Collapse>

            {/* when the form is collapsed we always render a small row that can be clicked to reopen it.
                if we have a recently added item we show its name, otherwise a generic hint */}
            {!formOpen && (
              <CollapseHandle lastAdded={todoActions.lastAdded} onClick={() => setFormOpen(true)} />
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
                    await createTodosBulk(created._id, tmpl.items);
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
            setSnackbarMsg={setSnackbarMsg}
            setSnackbarOpen={setSnackbarOpen}
          />

          <QuantityDialog
            open={quantityDialogOpen}
            value={tempQuantity}
            onChange={(v) => {
              setTempQuantity(v);
              todoActions.setQuantity(v);
            }}
            onClose={() => setQuantityDialogOpen(false)}
          />
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000}
            onClose={() => setSnackbarOpen(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
              {snackbarMsg}
            </Alert>
          </Snackbar>
        </Box>
      )}

    </Container>
  );
}
