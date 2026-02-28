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
  MenuItem,
  Card,
  CardContent,
  Grow,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Menu,
  Snackbar,
  Alert,
} from '@mui/material';

// shared types, constants and helpers
import { Todo, List as ListType, Template } from '@/types';
import { getTextColor, getLuminance } from '@/utils/color';
import { categories as defaultCategories, templates as defaultTemplates, Category } from '@/constants';
import {
  fetchTodos as apiFetchTodos,
  createTodo as apiCreateTodo,
  updateTodo as apiUpdateTodo,
  deleteTodo as apiDeleteTodo,
  fetchLists as apiFetchLists,
  updateList as apiUpdateList,
  createList as apiCreateList,
  createTodosBulk,
  deleteList,
  fetchPersonalization,
  savePersonalization,
  StoredCategory,
} from '@/lib/api';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import { useTheme } from '@mui/material/styles';

// UI components
import Header from '../components/Header';
import SearchBulk from '../components/SearchBulk';
import CollapseHandle from '../components/CollapseHandle';
import QuantityDialog from '../components/QuantityDialog';
import HistoryDialog from '../components/HistoryDialog';


export default function Home() {

  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const openMenu = (e: React.MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMsg, setSnackbarMsg] = React.useState('');
  const prevScroll = React.useRef<number>(0);
  const [lastAdded, setLastAdded] = React.useState<string | null>(null);
  const ignoreScrollUntil = React.useRef<number>(0);

  const [todos, setTodos] = React.useState<Todo[]>([]);
  const theme = useTheme();
  const [lists, setLists] = React.useState<ListType[]>([]);
  const [currentListId, setCurrentListId] = React.useState<string | null>(null);
  const [currentList, setCurrentList] = React.useState<ListType | null>(null);
  const [viewingHistory, setViewingHistory] = React.useState(false);
  const [listDefaultColor, setListDefaultColor] = React.useState('#ffffff');
  const [formOpen, setFormOpen] = React.useState(true);
  const formOpenRef = React.useRef(formOpen);
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [quantity, setQuantity] = React.useState(1);
  const [comment, setComment] = React.useState('');
  const [color, setColor] = React.useState('#ffffff');
  const [category, setCategory] = React.useState('');
  const [quantityDialogOpen, setQuantityDialogOpen] = React.useState(false);
  const [tempQuantity, setTempQuantity] = React.useState<number>(1);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [password, setPassword] = React.useState('');
  const [authenticated, setAuthenticated] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);

  // personalization password and data
  const [personalPassword, setPersonalPassword] = React.useState('');
  const [availableCategories, setAvailableCategories] = React.useState<Category[]>(defaultCategories);
  const [availableTemplates, setAvailableTemplates] = React.useState<Template[]>(defaultTemplates);
  const [personalDialogOpen, setPersonalDialogOpen] = React.useState(false);
  // editing copies used by the dialog
  const [editingCategories, setEditingCategories] = React.useState<StoredCategory[]>([]);
  const [editingTemplates, setEditingTemplates] = React.useState<Template[]>([]);

  // new-list dialog state
  const [newListDialogOpen, setNewListDialogOpen] = React.useState(false);
  const [newListName, setNewListName] = React.useState('');
  const [newListTemplateName, setNewListTemplateName] = React.useState('');

  // if there are no lists and dialog closes, reopen it immediately
  React.useEffect(() => {
    if (!authenticated) return;
    const anyActive = lists.some((l) => !l.completed);
    if (!anyActive && !newListDialogOpen) {
      setNewListDialogOpen(true);
    }
  }, [lists, newListDialogOpen, authenticated]);

  // new states for filtering / bulk / inline editing
  const [filterText, setFilterText] = React.useState('');
  const [bulkMode, setBulkMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [inlineEditId, setInlineEditId] = React.useState<string | null>(null);
  const [inlineName, setInlineName] = React.useState('');
  const [inlineDescription, setInlineDescription] = React.useState('');


  const fetchTodos = async (listId: string) => {
    if (!listId) return;
    try {
      const data = await apiFetchTodos(listId);
      setTodos((prev) =>
        data.map((t: Todo) => {
          const incomingColor = typeof t.color === 'string' ? t.color : '';
          const preservedColor = incomingColor && incomingColor.trim() !== '' ? incomingColor : (prev.find((p) => p._id === t._id)?.color || '');
          const incomingCat = typeof t.category === 'string' ? t.category : '';
          const preservedCat = incomingCat && incomingCat.trim() !== '' ? incomingCat : (prev.find((p) => p._id === t._id)?.category || '');
          return { ...t, color: preservedColor, category: preservedCat } as Todo;
        })
      );
    } catch {
      // ignore load errors for now
    }
  };

  // load templates/categories using the personalization password
  const loadPersonalization = React.useCallback(async (pw: string) => {
    if (!pw.trim()) return;
    try {
      const data = await fetchPersonalization(pw);
      if (data) {
        if (Array.isArray(data.categories)) {
          // merge icon information from defaults
          const merged: Category[] = data.categories.map((c) => {
            const found = defaultCategories.find((d) => d.value === c.value);
            return { value: c.value, label: c.label, icon: found?.icon || null };
          });
          setAvailableCategories(merged);
          if (personalDialogOpen) {
            setEditingCategories(data.categories.map((c) => ({ value: c.value, label: c.label })));
          }
        }
        if (Array.isArray(data.templates)) {
          setAvailableTemplates(data.templates);
          if (personalDialogOpen) {
            setEditingTemplates(data.templates.map((t) => ({ ...t, items: [...t.items] })));
          }
        }
      }
    } catch {
      // ignore invalid personalization
    }
  }, [personalDialogOpen]);


  const loadLists = React.useCallback(async (): Promise<ListType[] | null> => {
    if (!password.trim()) return null;
    try {
      let data = await apiFetchLists(password);
      // purge any lingering placeholder lists named "Список 1" (default from earlier)
      const defaultPattern = /^\s*Список\s*1\s*$/i;
      // repeat until none remain
      while (data.some((l) => defaultPattern.test(l.name))) {
        for (const l of data) {
          if (defaultPattern.test(l.name)) {
            await deleteList(l._id);
          }
        }
        data = await apiFetchLists(password);
      }
      // also filter them out of local data just in case
      data = data.filter((l) => !defaultPattern.test(l.name));
      setLists(data);
      const active = data.filter((l) => !l.completed);
      setAuthenticated(true); // password is valid regardless of list existence
      if (active.length === 0) {
        // require user to create a list when none are active
        setNewListDialogOpen(true);
      } else {
        const preserved = currentListId ? data.find((l) => l._id === currentListId) || null : null;
        const first = preserved || data.find((l) => !l.completed) || data[0];
        setCurrentListId(first._id);
        setCurrentList(first);
        setListDefaultColor(first.defaultColor || '#ffffff');
        setColor(first.defaultColor || '#ffffff');
        setViewingHistory(first.completed);
        setFormOpen(!first.completed);
        setAuthenticated(true);
        fetchTodos(first._id);
      }
      return data;
    } catch {
      return null;
    }
  }, [password, currentListId]);

  const handleLoad = () => {
    loadLists();
  };

  const handleLoadPersonal = () => {
    loadPersonalization(personalPassword);
  };

  React.useEffect(() => {
    if (personalDialogOpen) {
      // when dialog opens, populate editable copies from current values
      setEditingCategories(
        availableCategories.map((c) => ({ value: c.value, label: c.label }))
      );
      setEditingTemplates(availableTemplates.map((t) => ({ ...t, items: [...t.items] })));
    }
  }, [personalDialogOpen, availableCategories, availableTemplates]);

  // attempt to read password/listId from URL when component mounts
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pw = params.get('password');
    const lid = params.get('listId');
    const ppw = params.get('personalPassword');
    if (pw) {
      setPassword(pw);
      loadLists().then((data) => {
        if (lid && data) {
          setCurrentListId(lid);
          const lst = data.find((l) => l._id === lid) || null;
          setCurrentList(lst);
          setViewingHistory(lst?.completed ?? false);
          fetchTodos(lid);
        }
      });
    }
    if (ppw) {
      setPersonalPassword(ppw);
      loadPersonalization(ppw);
    }
  }, [loadLists, loadPersonalization]);

  React.useEffect(() => {
    if (viewingHistory) setFormOpen(false);
  }, [viewingHistory]);
  const headerColor = (currentList && currentList.defaultColor) || listDefaultColor || '#ffffff';
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
  React.useEffect(() => {
    formOpenRef.current = formOpen;
    // whenever the form is shown/hidden, reset the scroll baseline
    prevScroll.current = window.scrollY;
  }, [formOpen]);

  React.useEffect(() => {
    const SCROLL_LOCK_MS = 420;
    prevScroll.current = window.scrollY;
    const onScroll = () => {
      const now = Date.now();
      if (now < ignoreScrollUntil.current) return;
      const cur = window.scrollY;
      const prev = prevScroll.current || 0;
      const delta = cur - prev;
      // only collapse when scrolling down; manual click required to reopen
      const collapseThreshold = 48;
      if (delta > collapseThreshold && formOpenRef.current) {
        setFormOpen(false);
        ignoreScrollUntil.current = now + SCROLL_LOCK_MS;
      }
      prevScroll.current = cur;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [menuAnchor]);
  const addItem = async () => {
    if (!name.trim() || !currentListId) return;
    const payload: Partial<Todo> & { listId: string } = {
      listId: currentListId,
      name: name.trim(),
      description: description.trim(),
      quantity,
      comment: comment.trim(),
      color,
      category,
    };
    let result: Partial<Todo> | null = null;
    if (editingId) {
      const ok = await apiUpdateTodo(editingId, { ...payload, listId: currentListId });
      if (ok) {
        // later we'll refresh from server
      }
    } else {
      result = await apiCreateTodo(payload);    }
    if (editingId || result) {
      const addedName = name.trim();
      setTodos((prev) => {
        if (editingId) {
          return prev.map((t) =>
            t._id === editingId
              ? ({
                  ...t,
                  ...(result || {}),
                  color:
                    typeof result?.color === 'string' && result.color.trim() !== ''
                      ? result.color
                      : payload.color || t.color,
                  category:
                    typeof result?.category === 'string' && result.category.trim() !== ''
                      ? result.category
                      : payload.category || t.category,
                } as Todo)
              : t
          );
        }
        const incoming = result as Todo;
        const newItem: Todo = {
          ...incoming,
          color: typeof incoming?.color === 'string' && incoming.color.trim() !== '' ? incoming.color : payload.color || '#ffffff',
          category: typeof incoming?.category === 'string' && incoming.category.trim() !== '' ? incoming.category : payload.category || '',
        } as Todo;
        return [...prev, newItem];
      });
      setName('');
      setDescription('');
      setQuantity(1);
      setComment('');
      setColor(listDefaultColor);
      setCategory('');
      setEditingId(null);
      setLastAdded(addedName);
      setSnackbarMsg(editingId ? 'Item updated' : 'Item added');
      setSnackbarOpen(true);
      fetchTodos(currentListId);
    }
  };

  const toggleComplete = async (todo: Todo) => {
    if (!currentListId) return;
    await apiUpdateTodo(todo._id, { listId: currentListId, completed: !todo.completed });
    fetchTodos(currentListId);
  };

  const deleteTodo = async (id: string) => {
    if (!currentListId) return;
    await apiDeleteTodo(id, currentListId);
    fetchTodos(currentListId);
  };

  // selection / bulk helpers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());
  const bulkComplete = async () => {
    if (!currentListId) return;
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) => apiUpdateTodo(id, { listId: currentListId, completed: true })));
    clearSelection();
    setBulkMode(false);
    fetchTodos(currentListId);
  };
  const bulkDelete = async () => {
    if (!currentListId) return;
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) => apiDeleteTodo(id, currentListId)));
    clearSelection();
    setBulkMode(false);
    fetchTodos(currentListId);
  };

  // drag & drop handlers
  const onDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const startIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(startIndex)) return;
    setTodos((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(startIndex, 1);
      copy.splice(dropIndex, 0, moved);
      // persist order
      if (currentListId) {
        copy.forEach((t, idx) => {
          apiUpdateTodo(t._id, { listId: currentListId, order: idx });
        });
      }
      return copy;
    });
  };

  // inline editing helpers
  const startInlineEdit = (todo: Todo) => {
    setInlineEditId(todo._id);
    setInlineName(todo.name);
    setInlineDescription(todo.description);
  };
  const finishInlineEdit = async (todo: Todo) => {
    if (!currentListId) return;
    await apiUpdateTodo(todo._id, { listId: currentListId, name: inlineName, description: inlineDescription });
    setInlineEditId(null);
    fetchTodos(currentListId);
  };

  // handler invoked when user confirms new-list dialog
  const handleCreateNewList = async () => {
    const nm = newListName.trim();
    if (!nm) return;
    const created = await apiCreateList(password, nm, listDefaultColor);
    if (created) {
      if (newListTemplateName) {
        const tmpl = availableTemplates.find((t) => t.name === newListTemplateName);
        if (tmpl) {
          await createTodosBulk(created._id, tmpl.items);
        }
      }
      await loadLists();
    }
    setNewListDialogOpen(false);
    setNewListName('');
    setNewListTemplateName('');
  };

  const openNewListDialog = () => {
    setNewListDialogOpen(true);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Head>
        <title>Список покупок</title>
      </Head>
      <Header headerColor={headerColor} effectiveHeaderTextColor={effectiveHeaderTextColor} />

      <Box sx={{ display: 'flex', mb: 2 }}>
        <TextField
          label="Пароль персонализации"
          placeholder="Введите пароль персонализации"
          value={personalPassword}
          onChange={(e) => setPersonalPassword(e.target.value)}
          fullWidth
          type="password"
        />
        <Button variant="contained" onClick={handleLoadPersonal} sx={{ ml: 1 }}>
          Загрузить
        </Button>
      </Box>

      {!authenticated ? (
        <Box sx={{ display: 'flex', mb: 2 }}>
          <TextField
            label="Пароль"
            placeholder="Введите пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            type="password"
          />
          <Button variant="contained" onClick={handleLoad} sx={{ ml: 1 }}>
            Загрузить
          </Button>
        </Box>
      ) : (
        <Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '7fr 5fr' },
              gap: 1,
              alignItems: 'center',
              mb: 2,
            }}
          >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <TextField
                select
                label="Список"
                value={currentListId || ''}
                onChange={(e) => {
                  const id = e.target.value;
                  setCurrentListId(id);
                  const sel = lists.find((l) => l._id === id) || null;
                  setCurrentList(sel);
                  setListDefaultColor(sel?.defaultColor || '#ffffff');
                  setColor(sel?.defaultColor || '#ffffff');
                  setViewingHistory(sel?.completed ?? false);
                  if (id) fetchTodos(id);
                }}
                fullWidth
              >
                {lists
                  .filter((l) => !l.completed)
                  .map((l) => (
                    <MenuItem key={l._id} value={l._id}>
                      {l.name}
                    </MenuItem>
                  ))}
              </TextField>
              </Box>

            <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', sm: 'flex-end' }, flexWrap: 'wrap', alignItems: 'center' }}>
                <Box>
                  <IconButton size="small" onClick={() => setFormOpen((v) => !v)}>
                    {formOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 20, height: 20, borderRadius: 1, border: '1px solid rgba(0,0,0,0.12)', bgcolor: listDefaultColor }} />
                <Tooltip title={(() => {
                  const lum = getLuminance(listDefaultColor);
                  if (lum < 0.2 || lum > 0.8) return 'Контраст хороший';
                  return 'Внимание: средний контраст';
                })()}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {(() => {
                      const lum = getLuminance(listDefaultColor);
                      if (lum < 0.2 || lum > 0.8) return <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: 18 }} />;
                      return <ErrorOutlineIcon sx={{ color: 'warning.main', fontSize: 18 }} />;
                    })()}
                  </Box>
                </Tooltip>
              </Box>

              <TextField
                label="Цвет списка"
                type="color"
                value={listDefaultColor}
                onChange={(e) => setListDefaultColor(e.target.value)}
                sx={{ width: 64 }}
              />
              <Button
                onClick={() => {
                  if (!currentListId) return;
                  apiUpdateList(currentListId!, { defaultColor: listDefaultColor }).then(() => loadLists());
                }}
                sx={{ minWidth: 120 }}
              >
                Сохранить цвет
              </Button>
              <Button
                onClick={openNewListDialog}
                sx={{ minWidth: 120 }}
              >
                Новый список
              </Button>
              <Button onClick={() => setHistoryOpen(true)} disabled={!lists.some((l) => l.completed)} sx={{ minWidth: 96 }}>
                История
              </Button>
              <Button onClick={() => setBulkMode((v) => !v)} sx={{ minWidth: 100 }}>
                {bulkMode ? 'Отмена мн. выбора' : 'Мн. выбор'}
              </Button>
              <IconButton onClick={openMenu} size="small">
                <MoreVertIcon />
              </IconButton>
              <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
                <MenuItem
                  onClick={() => {
                    closeMenu();
                    setPersonalDialogOpen(true);
                  }}
                >
                  Настройки персонализации
                </MenuItem>
              <MenuItem
                  onClick={() => {
                    closeMenu();
                    if (!currentListId) return;
                      const link = `${window.location.origin}/?password=${encodeURIComponent(password)}&listId=${currentListId}`;
                      navigator.clipboard.writeText(link);
                      setSnackbarMsg('Ссылка скопирована');
                      setSnackbarOpen(true);
                  }}
                >
                  Поделиться
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    closeMenu();
                    if (!currentListId) return;
                      apiUpdateList(currentListId!, { completed: true }).then(() => {
                        loadLists();
                        setTodos([]);
                        setSnackbarMsg('List completed');
                        setSnackbarOpen(true);
                      });
                  }}
                >
                  Завершить
                </MenuItem>
              </Menu>
            </Box>
          </Box>

          {/* search field and optional bulk toolbar */}
          <SearchBulk
            filterText={filterText}
            onFilterChange={setFilterText}
            bulkMode={bulkMode}
            selectedCount={selectedIds.size}
            onBulkComplete={bulkComplete}
            onBulkDelete={bulkDelete}
            onCancelBulk={() => { setBulkMode(false); clearSelection(); }}
          />

          <Collapse in={!viewingHistory && formOpen} timeout={400}>
            <Paper sx={{ p: 2, mb: 2, width: '100%' }} elevation={3}>
              {/* form header with collapse button */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">Добавить / редактировать</Typography>
                <IconButton size="small" onClick={() => setFormOpen(false)}>
                  <ExpandMoreIcon sx={{ transform: 'rotate(-90deg)' }} />
                </IconButton>
              </Box>
              <Stack spacing={2}>
                <TextField
                  label="Название"
                  placeholder="Что купить?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Описание"
                  placeholder="Дополнительная информация"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Количество"
                  type="number"
                  value={quantity}
                  onClick={() => {
                    setTempQuantity(quantity || 1);
                    setQuantityDialogOpen(true);
                  }}
                  onFocus={(e) => {
                    setTempQuantity(quantity || 1);
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
                  label="Комментарий"
                  placeholder="Заметки к товару"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Цвет"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  sx={{ width: 80 }}
                />
                <TextField
                  select
                  label="Категория"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  fullWidth
                >
                  {availableCategories.map((c) => (
                    <MenuItem key={c.value} value={c.value} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box component="span" sx={{ mr: '4px', display: 'inline-flex' }}>
                      {c.icon ? <c.icon fontSize="small" /> : null}
                    </Box>
                      {c.label}
                    </MenuItem>
                  ))}
                </TextField>
                <Stack direction="row" spacing={2}>
                  <Button variant="contained" onClick={addItem}>
                    {editingId ? 'Сохранить' : 'Добавить'}
                  </Button>
                  {editingId && (
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setEditingId(null);
                        setName('');
                        setDescription('');
                        setQuantity(1);
                        setComment('');
                        setColor(listDefaultColor);
                      }}
                    >
                      Отменить
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Paper>
            </Collapse>

            {/* when the form is collapsed we always render a small row that can be clicked to reopen it.
                if we have a recently added item we show its name, otherwise a generic hint */}
            {!formOpen && (
              <CollapseHandle lastAdded={lastAdded} onClick={() => setFormOpen(true)} />
            )}

          {/* always show todos list regardless of history state */}
          <List sx={{ width: '100%' }}>
            {todos
              .filter(
                (t) =>
                  t.name.toLowerCase().includes(filterText.toLowerCase()) ||
                  t.description.toLowerCase().includes(filterText.toLowerCase())
              )
              .map((todo, index) => {
              const itemBg = todo.completed ? theme.palette.action.disabledBackground : (todo.color && todo.color.trim() ? todo.color : undefined);
              // Determine a readable text color for the row (icons, buttons, text)
              let itemTextColor = theme.palette.text.primary as string;
              if (!todo.completed && todo.color && todo.color.trim()) {
                const bg = todo.color;
                // compute luminance of the item's background and choose a contrasting text color
                const itemBgLum = getLuminance(bg);
                if (!isNaN(itemBgLum)) {
                  // Prefer a readable theme-like dark text on light backgrounds, and light text on dark backgrounds
                  itemTextColor = itemBgLum > 0.5 ? 'rgba(0,0,0,0.87)' : (theme.palette.mode === 'dark' ? LIGHT_WHITE : '#ffffff');
                } else {
                  // fallback to theme contrast helpers when luminance can't be computed
                  try {
                    itemTextColor = theme.palette.getContrastText ? theme.palette.getContrastText(bg) : getTextColor(bg);
                  } catch {
                    itemTextColor = theme.palette.text.primary as string;
                  }
                }
              }

              return (
                <Grow key={todo._id} in timeout={300}>
                  <Card
                    draggable={!viewingHistory}
                    onDragStart={(e) => onDragStart(e, index)}
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, index)}
                    sx={{
                      mb: 1,
                      backgroundColor: itemBg || 'inherit',
                      transition: 'background-color 0.3s ease',
                      color: itemTextColor,
                      cursor: !viewingHistory ? 'move' : 'auto',
                    }}
                    elevation={1}
                  >
                    <CardContent sx={{ p: 1}}>
                      <ListItem disableGutters>
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
                            onChange={() => !viewingHistory && toggleComplete(todo)}
                            disabled={viewingHistory}
                            icon={<RadioButtonUncheckedIcon />}
                            checkedIcon={<RadioButtonCheckedIcon />}
                            sx={{
                              color: itemTextColor,
                              '& .MuiSvgIcon-root': { borderRadius: '50%' },
                            }}
                          />
                        </Stack>

                        <Box sx={{ flex: 1 }}> 
                          {inlineEditId === todo._id ? (
                            <Stack spacing={1} sx={{ flex: 1 }}>
                              <TextField
                                value={inlineName}
                                onChange={(e) => setInlineName(e.target.value)}
                                fullWidth
                                variant="standard"
                                autoFocus
                              />
                              <TextField
                                value={inlineDescription}
                                onChange={(e) => setInlineDescription(e.target.value)}
                                fullWidth
                                variant="standard"
                              />
                              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => finishInlineEdit(todo)}
                                >
                                  Сохранить
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => setInlineEditId(null)}
                                >
                                  Отменить
                                </Button>
                              </Stack>
                            </Stack>
                          ) : (
                            <Box onClick={() => { if (!bulkMode && !viewingHistory) startInlineEdit(todo); }} sx={{ cursor: !bulkMode && !viewingHistory ? 'pointer' : 'default' }}>
                              <Typography variant="subtitle1" sx={{ color: itemTextColor, fontWeight: 500 }}>
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

                        {!viewingHistory && (
                          <Stack direction="row" spacing={1}>
                            <IconButton
                              edge="end"
                              aria-label="редактировать"
                              sx={{ color: itemTextColor }}
                              onClick={() => {
                                setEditingId(todo._id);
                                setName(todo.name);
                                setDescription(todo.description);
                                setQuantity(todo.quantity);
                                setComment(todo.comment || '');
                                setColor(todo.color || listDefaultColor);
                                setCategory(todo.category || '');
                              }}
                            >
                              ✏️
                            </IconButton>
                            <IconButton
                              edge="end"
                              aria-label="удалить"
                              sx={{ color: itemTextColor }}
                              onClick={() => deleteTodo(todo._id)}
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
            })}
          </List>

          {/* history dialog instead of inline section */}
          <HistoryDialog
            open={historyOpen}
            lists={lists}
            onSelect={(l) => {
              setCurrentListId(l._id);
              setCurrentList(l);
              setViewingHistory(true);
              fetchTodos(l._id);
              setHistoryOpen(false);
            }}
            onClose={() => setHistoryOpen(false)}
          />
          <Dialog open={newListDialogOpen} onClose={() => setNewListDialogOpen(false)} fullWidth>
            <DialogTitle>Новый список</DialogTitle>
            <DialogContent>
              <TextField
                label="Название"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                fullWidth
                autoFocus
                sx={{ mb: 2 }}
              />
              <TextField
                select
                label="Шаблон"
                value={newListTemplateName}
                onChange={(e) => setNewListTemplateName(e.target.value)}
                fullWidth
              >
                <MenuItem value="">(нет)</MenuItem>
                {availableTemplates.map((t) => (
                  <MenuItem key={t.name} value={t.name}>{t.name}</MenuItem>
                ))}
              </TextField>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setNewListDialogOpen(false)}>Отмена</Button>
              <Button variant="contained" onClick={handleCreateNewList} disabled={!newListName.trim()}>
                Создать
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={personalDialogOpen} onClose={() => setPersonalDialogOpen(false)} fullWidth maxWidth="md">
            <DialogTitle>Настройки персонализации</DialogTitle>
            <DialogContent>
              <TextField
                label="Пароль персонализации"
                value={personalPassword}
                onChange={(e) => setPersonalPassword(e.target.value)}
                fullWidth
                type="password"
                sx={{ mb: 2 }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={() => loadPersonalization(personalPassword)}
                sx={{ mb: 2 }}
              >
                Загрузить настройки
              </Button>
              <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>
                Категории
              </Typography>
              {editingCategories.map((cat, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TextField
                    label="Значение"
                    value={cat.value}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEditingCategories((prev) => {
                        const arr = [...prev];
                        arr[idx] = { ...arr[idx], value: v };
                        return arr;
                      });
                    }}
                    sx={{ mr: 1 }}
                  />
                  <TextField
                    label="Метка"
                    value={cat.label}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEditingCategories((prev) => {
                        const arr = [...prev];
                        arr[idx] = { ...arr[idx], label: v };
                        return arr;
                      });
                    }}
                    sx={{ mr: 1 }}
                  />
                  <IconButton
                    onClick={() =>
                      setEditingCategories((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                size="small"
                onClick={() =>
                  setEditingCategories((prev) => [...prev, { value: '', label: '' }])
                }
              >
                Добавить категорию
              </Button>

              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Шаблоны
              </Typography>
              {editingTemplates.map((tmpl, ti) => (
                <Box
                  key={ti}
                  sx={{ border: '1px solid rgba(0,0,0,0.2)', p: 1, mb: 2 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TextField
                      label="Название шаблона"
                      value={tmpl.name}
                      onChange={(e) => {
                        const v = e.target.value;
                        setEditingTemplates((prev) => {
                          const arr = [...prev];
                          arr[ti] = { ...arr[ti], name: v };
                          return arr;
                        });
                      }}
                      fullWidth
                      sx={{ mr: 1 }}
                    />
                    <IconButton
                      onClick={() =>
                        setEditingTemplates((prev) => prev.filter((_, i) => i !== ti))
                      }
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Пункты
                  </Typography>
                  {tmpl.items.map((item, ii) => (
                    <Box
                      key={ii}
                      sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                    >
                      <TextField
                        label="Название"
                        value={item.name}
                        onChange={(e) => {
                          const v = e.target.value;
                          setEditingTemplates((prev) => {
                            const arr = [...prev];
                            const itms = [...arr[ti].items];
                            itms[ii] = { ...itms[ii], name: v };
                            arr[ti] = { ...arr[ti], items: itms };
                            return arr;
                          });
                        }}
                        sx={{ mr: 1 }}
                      />
                      <TextField
                        label="Кол-во"
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10) || 0;
                          setEditingTemplates((prev) => {
                            const arr = [...prev];
                            const itms = [...arr[ti].items];
                            itms[ii] = { ...itms[ii], quantity: v };
                            arr[ti] = { ...arr[ti], items: itms };
                            return arr;
                          });
                        }}
                        sx={{ mr: 1, width: 80 }}
                      />
                      <TextField
                        label="Категория"
                        value={item.category || ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setEditingTemplates((prev) => {
                            const arr = [...prev];
                            const itms = [...arr[ti].items];
                            itms[ii] = { ...itms[ii], category: v };
                            arr[ti] = { ...arr[ti], items: itms };
                            return arr;
                          });
                        }}
                        sx={{ mr: 1 }}
                      />
                      <IconButton
                        onClick={() => {
                          setEditingTemplates((prev) => {
                            const arr = [...prev];
                            const itms = [...arr[ti].items];
                            itms.splice(ii, 1);
                            arr[ti] = { ...arr[ti], items: itms };
                            return arr;
                          });
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                  <Button
                    size="small"
                    onClick={() => {
                      setEditingTemplates((prev) => {
                        const arr = [...prev];
                        const itms = [...arr[ti].items, { name: '', quantity: 1 }];
                        arr[ti] = { ...arr[ti], items: itms };
                        return arr;
                      });
                    }}
                  >
                    Добавить пункт
                  </Button>
                </Box>
              ))}
              <Button
                onClick={() =>
                  setEditingTemplates((prev) => [...prev, { name: '', items: [] }])
                }
              >
                Добавить шаблон
              </Button>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPersonalDialogOpen(false)}>Отмена</Button>
              <Button
                variant="contained"
                onClick={async () => {
                  try {
                    const saved = await savePersonalization(
                      personalPassword,
                      editingCategories,
                      editingTemplates
                    );
                    if (saved) {
                      // reload into state
                      if (Array.isArray(saved.categories)) {
                        const merged: Category[] = saved.categories.map(
                          (c: StoredCategory) => {
                            const found = defaultCategories.find(
                              (d) => d.value === c.value
                            );
                            return {
                              value: c.value,
                              label: c.label,
                              icon: found?.icon || null,
                            };
                          }
                        );
                        setAvailableCategories(merged);
                      }
                      if (Array.isArray(saved.templates)) {
                        setAvailableTemplates(saved.templates);
                      }
                      setSnackbarMsg('Настройки сохранены');
                      setSnackbarOpen(true);
                      setPersonalDialogOpen(false);
                    }
                  } catch {
                    setSnackbarMsg('Ошибка при сохранении');
                    setSnackbarOpen(true);
                  }
                }}
              >
                Сохранить
              </Button>
            </DialogActions>
          </Dialog>
          <QuantityDialog
            open={quantityDialogOpen}
            value={tempQuantity}
            onChange={(v) => setQuantity(v)}
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
