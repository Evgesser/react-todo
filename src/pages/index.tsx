import * as React from 'react';
import Head from 'next/head';
import {
  Container,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  Checkbox,
  IconButton,
  Box,
  Paper,
  Stack,
  Card,
  CardContent,
  Grow,
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
  fetchPersonalization,
  savePersonalization,
} from '@/lib/api';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { useTheme, alpha } from '@mui/material/styles';

// Custom hooks
import { useFormAutoCollapse } from '../hooks/useFormAutoCollapse';
import { useTodos } from '../hooks/useTodos';
import { useLists } from '../hooks/useLists';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

// UI components
import Header from '../components/layout/Header';
import SearchBulk from '../components/toolbar/SearchBulk';
import CollapseHandle from '../components/layout/CollapseHandle';
import QuantityDialog from '../components/dialogs/QuantityDialog';
import HistoryDialog from '../components/dialogs/HistoryDialog';
import NewListDialog from '../components/dialogs/NewListDialog';
import PersonalizationDialog from '@/components/dialogs/PersonalizationDialog';
import ListToolbar from '../components/toolbar/ListToolbar';
import RegisterDialog from '../components/dialogs/RegisterDialog';


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
  const [loginUsername, setLoginUsername] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');
  const [registerDialogOpen, setRegisterDialogOpen] = React.useState(false);

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

  // personalization password and data
  const [availableCategories, setAvailableCategories] = React.useState<Category[]>(defaultCategories);
  const [availableTemplates, setAvailableTemplates] = React.useState<Template[]>(defaultTemplates);
  const [nameCategoryMap, setNameCategoryMap] = React.useState<Record<string, string>>({});
  const [personalDialogOpen, setPersonalDialogOpen] = React.useState(false);

  // new-list dialog state
  const [newListDialogOpen, setNewListDialogOpen] = React.useState(false);

  // persist categories locally if unauthenticated
  React.useEffect(() => {
    if (auth.userId) return;
    try {
      const raw = localStorage.getItem('availCats');
      if (raw) {
        const arr = JSON.parse(raw) as Array<{ value: string; label: string; icon?: string }>;
        if (Array.isArray(arr)) {
          const cats: Category[] = arr.map((c) => ({
            value: c.value,
            label: c.label,
            icon: c.icon && iconMap[c.icon] ? iconMap[c.icon] : null,
          }));
          setAvailableCategories(cats);
        }
      }
    } catch {
      // ignore
    }
  }, [auth.userId]);

  React.useEffect(() => {
    // only persist when unauthenticated; keep unsaved categories until we merge
    if (auth.userId) return;
    try {
      const toStore = availableCategories.map((c) => ({
        value: c.value,
        label: c.label,
        icon: Object.keys(iconMap).find((k) => iconMap[k] === c.icon) || '',
      }));
      localStorage.setItem('availCats', JSON.stringify(toStore));
    } catch {
      // ignore
    }
  }, [availableCategories, auth.userId]);

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
  });

  // compute autocomplete options outside render to avoid conditional hook complaint
  const nameOptions = React.useMemo(
    () => Array.from(new Set(todoActions.todos.map((t) => t.name))).filter(Boolean),
    [todoActions.todos]
  );

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

  // update global name->category mapping and persist
  const updateNameCategory = React.useCallback(
    async (name: string, category: string) => {
      const n = name.trim();
      if (!n) return;
      setNameCategoryMap((prev) => {
        if (prev[n] === category) return prev;
        const next = { ...prev, [n]: category };
        if (auth.userId) {
          // fire and forget; effect will also persist the map
          savePersonalization(
            auth.userId,
            availableCategories.map((c) => ({ value: c.value, label: c.label, icon: Object.keys(iconMap).find((k) => iconMap[k] === c.icon) || '' })),
            availableTemplates,
            next
          ).catch(() => {});
        }
        return next;
      });
    },
    [auth.userId, availableCategories, availableTemplates]
  );


  // displayed text in category field should be human-friendly label
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
    updateNameCategory(todoActions.name, todoActions.category);
    setTempIconKey('');
  }, [ensureCategoryExists, todoActions, tempIconKey, updateNameCategory]);

  const handleListChange = React.useCallback(
    async (id: string) => {
      await listActions.selectList(id);
      todoActions.setColor(listActions.lists.find((l) => l._id === id)?.defaultColor || '#ffffff');
      if (id) await todoActions.fetchTodos(id);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // load templates/categories for current user
  const loadPersonalization = React.useCallback(async () => {
    if (!auth.userId) return;
    try {
      const data = await fetchPersonalization(auth.userId);
      if (data) {
        if (Array.isArray(data.categories)) {
          // start with defaults, override or append from personalization
          const merged: Category[] = defaultCategories.map((d) => ({ ...d }));
          data.categories.forEach((c) => {
            const idx = merged.findIndex((m) => m.value === c.value);
            const iconFromPersonal = c.icon && iconMap[c.icon] ? iconMap[c.icon] : null;
            const cat: Category = {
              value: c.value,
              label: c.label,
              icon: iconFromPersonal || merged[idx]?.icon || null,
            };
            if (idx !== -1) {
              merged[idx] = cat;
            } else {
              merged.push(cat);
            }
          });
          // also merge any locally stored categories (e.g. added while offline)
          try {
            const raw = localStorage.getItem('availCats');
            if (raw) {
              const arr = JSON.parse(raw) as Array<{ value: string; label: string; icon?: string }>;
              if (Array.isArray(arr)) {
                arr.forEach((c) => {
                  if (!merged.find((x) => x.value === c.value)) {
                    const resolvedIcon = c.icon && iconMap[c.icon] ? iconMap[c.icon] : null;
                    merged.push({ value: c.value, label: c.label, icon: resolvedIcon });
                  }
                });
                localStorage.removeItem('availCats');
              }
            }
          } catch {
            // ignore malformed local cache
          }
          setAvailableCategories(merged);
        }
        if (Array.isArray(data.templates)) {
          setAvailableTemplates(data.templates);
        }
        if (data.nameCategoryMap && typeof data.nameCategoryMap === 'object') {
          setNameCategoryMap(data.nameCategoryMap as Record<string, string>);
        }
        if (data.nameCategoryMap && typeof data.nameCategoryMap === 'object') {
          setNameCategoryMap(data.nameCategoryMap as Record<string, string>);
        }
      }
    } catch {
      // ignore invalid personalization
    }
  }, [auth.userId]);

  // Auto-load personalization when user logs in
  React.useEffect(() => {
    if (auth.userId) {
      loadPersonalization();
    }
  }, [auth.userId, loadPersonalization]);

  // Persist personalization (categories/templates/name->category map) whenever it changes
  React.useEffect(() => {
    if (!auth.userId) return;
    // fire and forget; we may call this multiple times but that's fine
    savePersonalization(
      auth.userId,
      availableCategories.map((c) => ({
        value: c.value,
        label: c.label,
        icon: Object.keys(iconMap).find((k) => iconMap[k] === c.icon) || '',
      })),
      availableTemplates,
      nameCategoryMap
    ).catch(() => {});
  }, [auth.userId, availableCategories, availableTemplates, nameCategoryMap]);

  const handleRegisterSuccess = React.useCallback(async (userId: string, username: string) => {
    // Close register dialog first
    setRegisterDialogOpen(false);
    
    // Set auth data directly without calling login API again
    auth.setAuthData(userId, username);
    
    // Try to load avatar (may not exist for new user, but try anyway)
    await auth.loadAvatar(userId);
    
    // Clear login form
    setLoginUsername('');
    setLoginPassword('');
    
    // Show success message
    setSnackbarMsg(t.register.success);
    setSnackbarOpen(true);
  }, [auth, t]);

  const handleLogin = React.useCallback(async () => {
    auth.clearError();
    const result = await auth.login(loginUsername, loginPassword);
    if (result.success) {
      setLoginUsername('');
      setLoginPassword('');
      // auth.userId change will trigger useEffect to load lists
    } else {
      // Check if user not found
      if (result.error && result.error.includes('User not found')) {
        setRegisterDialogOpen(true);
      } else {
        setSnackbarMsg(result.error || 'Login failed');
        setSnackbarOpen(true);
      }
    }
  }, [loginUsername, loginPassword, auth]);

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
  }, [listActions.viewingHistory]);

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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
          {auth.error && (
            <Alert severity="error" onClose={() => auth.clearError()}>
              {auth.error}
            </Alert>
          )}
          <TextField
            label={t.auth.username}
            placeholder={t.auth.usernamePlaceholder}
            value={loginUsername}
            onChange={(e) => setLoginUsername(e.target.value)}
            fullWidth
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleLogin();
            }}
            InputProps={{
              endAdornment: loginUsername ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setLoginUsername('')}
                    edge="end"
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          <TextField
            label={t.auth.password}
            placeholder={t.auth.passwordPlaceholder}
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            fullWidth
            type="password"
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleLogin();
            }}
            InputProps={{
              endAdornment: loginPassword ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setLoginPassword('')}
                    edge="end"
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          <Button variant="contained" onClick={handleLogin} disabled={auth.isLoading}>
            {auth.isLoading ? t.auth.loading : t.auth.login}
          </Button>
        </Box>
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
                  inputValue={todoActions.name}
                  onInputChange={(_, v) => todoActions.setName(v)}
                  onChange={(_, v) => {
                    if (typeof v === 'string') {
                      todoActions.setName(v);
                    }
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
                        endAdornment: (
                          <>
                            {todoActions.name ? (
                              <InputAdornment position="end">
                                <IconButton
                                  size="small"
                                  onClick={() => todoActions.setName('')}
                                  edge="end"
                                >
                                  <ClearIcon />
                                </IconButton>
                              </InputAdornment>
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
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
          <List sx={{ width: '100%' }}>
            {(() => {
              const filtered = todoActions.todos.filter(
                (t) =>
                  t.name.toLowerCase().includes(todoActions.filterText.toLowerCase()) ||
                  t.description.toLowerCase().includes(todoActions.filterText.toLowerCase())
              );

              // group by category so the header appears once per group.  We want
              // to respect the manual ordering stored in the `order` field, so sort
              // the filtered list by `order` instead of alphabetically.  (The old
              // implementation sorted by category name, which prevented any
              // category-swapping from having a visible effect.)
              // Determine category sequence from first appearance in order-sorted list
              const orderSorted = [...filtered].sort((a, b) => (a.order || 0) - (b.order || 0));
              const cats = Array.from(new Set(orderSorted.map((t) => t.category || '')));
              // now sort by category index then by order
              const sorted = [...filtered].sort((a, b) => {
                const ca = cats.indexOf(a.category || '');
                const cb = cats.indexOf(b.category || '');
                if (ca !== cb) return ca - cb;
                return (a.order || 0) - (b.order || 0);
              });

              // precompute list of distinct categories in same sequence for arrow disabling
              const allSorted = [...todoActions.todos].sort((a, b) => {
                const ca = cats.indexOf(a.category || '');
                const cb = cats.indexOf(b.category || '');
                if (ca !== cb) return ca - cb;
                return (a.order || 0) - (b.order || 0);
              });
              const groupCats = Array.from(new Set(allSorted.map((t) => t.category || '')));

              const elements: React.JSX.Element[] = [];
              const seenCategories = new Set<string>();

              sorted.forEach((todo, index) => {
                // sentinel for header grouping (use something unique for blank)
                const catKey = todo.category || '__none';
                if (!seenCategories.has(catKey)) {
                  seenCategories.add(catKey);
                  const realCat = todo.category || ''; // actual value passed to actions
                  const catObj = availableCategories.find((c) => c.value === todo.category);
                  const IconComp = catObj?.icon || null;
                  const label = catObj?.label || realCat;
                  elements.push(
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
                            console.log('click up', realCat, groupCats);
                            todoActions.setFilterText('');
                            todoActions.setFilterCategory('');
                            await todoActions.moveCategory(realCat, 'up');
                            console.log('after move todos', todoActions.todos.map(t=>({id:t._id,order:t.order,cat:t.category}))); 
                          }}
                          edge="end"
                          disabled={groupCats.indexOf(realCat) <= 0}
                        >
                          <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={async () => {
                            console.log('click down', realCat, groupCats);
                            todoActions.setFilterText('');
                            todoActions.setFilterCategory('');
                            await todoActions.moveCategory(realCat, 'down');
                            console.log('after move todos', todoActions.todos.map(t=>({id:t._id,order:t.order,cat:t.category}))); 
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
                  // make missing items stand out without being too harsh
                  itemBg = alpha(theme.palette.error.light, 0.4);
                } else {
                  itemBg = todo.color && todo.color.trim() ? todo.color : undefined;
                }

                let itemTextColor = theme.palette.text.primary as string;
                if (!todo.completed && todo.color && todo.color.trim()) {
                  const bg = todo.color;
                  const itemBgLum = getLuminance(bg);
                  if (!isNaN(itemBgLum)) {
                    itemTextColor = itemBgLum > 0.5 ? 'rgba(0,0,0,0.87)' : (theme.palette.mode === 'dark' ? LIGHT_WHITE : '#ffffff');
                  } else {
                    try {
                      itemTextColor = theme.palette.getContrastText ? theme.palette.getContrastText(bg) : getTextColor(bg);
                    } catch {
                      itemTextColor = theme.palette.text.primary as string;
                    }
                  }
                }
                // if missing, slightly tint text for clarity but keep readability
                if (todo.missing) {
                  itemTextColor = theme.palette.text.primary as string;
                }

                elements.push(
                  <Grow key={todo._id} in timeout={300}>
                    <Card
                      draggable={!listActions.viewingHistory}
                      onDragStart={(e) => todoActions.onDragStart(e, index)}
                      onDragOver={todoActions.onDragOver}
                      onDrop={(e) => todoActions.onDrop(e, index)}
                      onTouchStart={(e) => todoActions.onTouchStart(e, index)}
                      onTouchMove={todoActions.onTouchMove}
                      onTouchEnd={(e) => todoActions.onTouchEnd(e, index)}
                      sx={{
                        mb: 1,
                        backgroundColor: itemBg || 'inherit',
                        transition: 'background-color 0.3s ease',
                        color: itemTextColor,
                        cursor: !listActions.viewingHistory ? 'move' : 'auto',
                        touchAction: 'none',
                      }}
                      elevation={1}
                    >
                      <CardContent sx={{ p: 1}}>
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
                                    onClick={() => todoActions.finishInlineEdit(todo)}
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
                              <Box onClick={() => { if (!todoActions.bulkMode && !listActions.viewingHistory) todoActions.startInlineEdit(todo); }} sx={{ cursor: !todoActions.bulkMode && !listActions.viewingHistory ? 'pointer' : 'default' }}>
                                <Typography variant="subtitle1" sx={{ color: itemTextColor, fontWeight: 500, textDecoration: todo.missing ? 'line-through' : 'none' }}>
                                  {todo.name}{todo.quantity > 1 ? ` (x${todo.quantity})` : ''}
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
                                ✏️
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

              return elements;
            })()}
          </List>

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

      {/* RegisterDialog must be outside auth.userId condition */}
      <RegisterDialog
        open={registerDialogOpen}
        username={loginUsername}
        password={loginPassword}
        onClose={() => setRegisterDialogOpen(false)}
        onRegisterSuccess={handleRegisterSuccess}
      />
    </Container>
  );
}
