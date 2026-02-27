import * as React from 'react';
import Head from 'next/head';
import {
  Container,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Checkbox,
  IconButton,
  Box,
  Paper,
  Stack,
  Grid,
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
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTheme } from '@mui/material/styles';
import { ColorModeContext } from '@/pages/_app';

interface Todo {
  _id: string;
  name: string;
  description: string;
  quantity: number;
  completed: boolean;
  comment?: string;
  color?: string;
}

interface List {
  _id: string;
  name: string;
  completed: boolean;
  finishedAt?: string;
  defaultColor?: string;
}

export default function Home() {
  // Utility: calculate luminance of a hex color to determine if text should be dark or light
  const getTextColor = (hexColor: string) => {
    if (!hexColor || hexColor === 'inherit') return 'inherit';
    try {
      const hex = hexColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      // Calculate luminance using relative luminance formula
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      // If luminance > 0.5, background is light, use dark text
      return luminance > 0.5 ? '#000000' : '#ffffff';
    } catch {
      return 'inherit';
    }
  };
  const getLuminance = (hexColor: string) => {
    if (!hexColor) return 0;
    try {
      const hex = hexColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    } catch {
      return 0;
    }
  };

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
  const colorMode = React.useContext(ColorModeContext);
  const [lists, setLists] = React.useState<List[]>([]);
  const [currentListId, setCurrentListId] = React.useState<string | null>(null);
  const [currentList, setCurrentList] = React.useState<List | null>(null);
  const [viewingHistory, setViewingHistory] = React.useState(false);
  const [listDefaultColor, setListDefaultColor] = React.useState('#ffffff');
  const [formOpen, setFormOpen] = React.useState(true);
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [quantity, setQuantity] = React.useState(1);
  const [comment, setComment] = React.useState('');
  const [color, setColor] = React.useState('#ffffff');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [password, setPassword] = React.useState('');
  const [authenticated, setAuthenticated] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);

  const fetchTodos = async (listId: string) => {
    if (!listId) return;
    const res = await fetch(`/api/todos?listId=${encodeURIComponent(listId)}`);
    if (res.ok) {
      const data: Todo[] = await res.json();
      setTodos(data);
    }
  };

  const loadLists = async (): Promise<List[] | null> => {
    if (!password.trim()) return null;
    const res = await fetch(`/api/lists?password=${encodeURIComponent(password)}`);
    if (res.ok) {
      const data: List[] = await res.json();
      setLists(data);
      if (data.length > 0) {
        const first = data.find((l) => !l.completed) || data[0];
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
    }
    return null;
  };

  const handleLoad = () => {
    loadLists();
  };

  // attempt to read password/listId from URL when component mounts
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pw = params.get('password');
    const lid = params.get('listId');
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
  }, []);

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
  const effectiveHeaderTextColor = menuAnchor ? menuActiveHeaderColor : headerTextColor;
  React.useEffect(() => {
    const SCROLL_LOCK_MS = 420;
    const onScroll = () => {
      const now = Date.now();
      if (now < ignoreScrollUntil.current) return;
      const active = document.activeElement as HTMLElement | null;
      if (menuAnchor || (active && ['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(active.tagName))) {
        prevScroll.current = window.scrollY;
        return;
      }
      const cur = window.scrollY;
      const prev = prevScroll.current || 0;
      const delta = cur - prev;
      if (delta > 24) {
        setFormOpen((v) => {
          if (v) {
            ignoreScrollUntil.current = now + SCROLL_LOCK_MS;
            prevScroll.current = cur;
            return false;
          }
          return v;
        });
      } else if (delta < -24) {
        setFormOpen((v) => {
          if (!v) {
            ignoreScrollUntil.current = now + SCROLL_LOCK_MS;
            prevScroll.current = cur;
            return true;
          }
          return v;
        });
      }
      prevScroll.current = cur;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [menuAnchor]);
  const addItem = async () => {
    if (!name.trim() || !currentListId) return;
    const payload = { listId: currentListId, name: name.trim(), description: description.trim(), quantity, comment: comment.trim(), color };
    let res;
    if (editingId) {
      res = await fetch(`/api/todos/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, listId: currentListId }),
      });
    } else {
      res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    if (res.ok) {
      const addedName = name.trim();
      setName('');
      setDescription('');
      setQuantity(1);
      setComment('');
      setColor('#ffffff');
      setEditingId(null);
      setLastAdded(addedName);
      setSnackbarMsg(editingId ? 'Item updated' : 'Item added');
      setSnackbarOpen(true);
      fetchTodos(currentListId);
    }
  };

  const toggleComplete = async (todo: Todo) => {
    if (!currentListId) return;
    await fetch(`/api/todos/${todo._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listId: currentListId, completed: !todo.completed }),
    });
    fetchTodos(currentListId);
  };

  const deleteTodo = async (id: string) => {
    if (!currentListId) return;
    await fetch(`/api/todos/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listId: currentListId }),
    });
    fetchTodos(currentListId);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Head>
        <title>Список покупок</title>
      </Head>
      <Box sx={{ mb: 1 }}>
        <Box sx={{ height: 8, borderRadius: 1, bgcolor: headerColor, transition: 'background-color 300ms ease' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              color: effectiveHeaderTextColor,
              fontWeight: 500,
              textShadow: theme.palette.mode === 'dark'
                ? '0 1px 2px rgba(0,0,0,0.6), 0 0 8px rgba(255,255,255,0.02)'
                : '0 1px 2px rgba(0,0,0,0.06)',
            }}
          >
            Список покупок
          </Typography>
          <IconButton
            onClick={() => colorMode.toggleColorMode()}
            sx={{
              color: effectiveHeaderTextColor,
              bgcolor: menuAnchor
                ? (theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)')
                : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
              borderRadius: '50%',
              p: 1,
              boxShadow: menuAnchor && theme.palette.mode === 'light' ? '0 2px 6px rgba(0,0,0,0.08)' : (theme.palette.mode === 'dark' ? '0 4px 10px rgba(0,0,0,0.45)' : 'none'),
              '&:hover': {
                bgcolor: menuAnchor
                  ? (theme.palette.mode === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)')
                  : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)')
              }
            }}
          >
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>
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
                  fetch(`/api/lists/${currentListId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ defaultColor: listDefaultColor }),
                  }).then(() => loadLists());
                }}
                sx={{ minWidth: 120 }}
              >
                Сохранить цвет
              </Button>
              <Button
                onClick={() => {
                  const newName = prompt('Название нового списка');
                  if (newName && newName.trim()) {
                    fetch('/api/lists', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ password, name: newName.trim(), defaultColor: listDefaultColor }),
                    }).then(() => loadLists());
                  }
                }}
                sx={{ minWidth: 120 }}
              >
                Новый список
              </Button>
              <Button onClick={() => setHistoryOpen(true)} disabled={!lists.some((l) => l.completed)} sx={{ minWidth: 96 }}>
                История
              </Button>
              <IconButton onClick={openMenu} size="small">
                <MoreVertIcon />
              </IconButton>
              <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
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
                      fetch(`/api/lists/${currentListId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ completed: true }),
                      }).then(() => {
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
          <Collapse in={!viewingHistory && formOpen} timeout={400}>
            <Paper sx={{ p: 2, mb: 2, width: '100%' }} elevation={3}>
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
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
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
                        setColor('#ffffff');
                      }}
                    >
                      Отменить
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Paper>
            </Collapse>

            {!formOpen && lastAdded && (
              <Grow in timeout={300}>
                <Paper
                  sx={{ p: 1, mb: 2, cursor: 'pointer', bgcolor: 'background.paper', color: 'text.primary' }}
                  elevation={2}
                  onClick={() => setFormOpen(true)}
                >
                  <Typography variant="body2" sx={{ color: 'inherit' }}>
                    Последний добавленный: {lastAdded}
                  </Typography>
                </Paper>
              </Grow>
            )}

          {/* always show todos list regardless of history state */}
          <List sx={{ width: '100%' }}>
            {todos.map((todo) => {
              const itemBg = todo.completed ? theme.palette.action.disabledBackground : todo.color || undefined;
              let itemTextColor = todo.color && !todo.completed ? getTextColor(todo.color) : theme.palette.text.primary;
              // if computed color is hex and too close to page background, fallback to theme text
              const isHex = typeof itemTextColor === 'string' && itemTextColor.startsWith('#');
              const itemLum = isHex ? getLuminance(itemTextColor) : null;
              if (itemLum === null || Math.abs((itemLum || 0) - bgLum) < 0.32) {
                itemTextColor = theme.palette.text.primary;
              }

              return (
                <Grow key={todo._id} in timeout={300}>
                  <Card
                    sx={{
                      mb: 1,
                      backgroundColor: itemBg || 'inherit',
                      transition: 'background-color 0.3s ease',
                      color: itemTextColor,
                    }}
                    elevation={1}
                  >
                    <CardContent sx={{ p: 1 }}>
                      <ListItem
                        secondaryAction={!viewingHistory ? (
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
                                setColor(todo.color || '#ffffff');
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
                        ) : null}
                      >
                        <Checkbox
                          checked={todo.completed}
                          onChange={() => !viewingHistory && toggleComplete(todo)}
                          disabled={viewingHistory}
                          sx={{ color: itemTextColor }}
                        />
                        <ListItemText
                          primary={todo.name + (todo.quantity > 1 ? ` (x${todo.quantity})` : '')}
                          secondary={<> {todo.description}<br/>{todo.comment}</>}
                          sx={{
                            textDecoration: todo.completed ? 'line-through' : 'none',
                            color: itemTextColor,
                            '& .MuiListItemText-secondary': {
                              color: itemTextColor,
                            },
                          }}
                        />
                      </ListItem>
                    </CardContent>
                  </Card>
                </Grow>
              );
            })}
          </List>

          {/* history dialog instead of inline section */}
          <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} fullWidth>
            <DialogTitle>История списков</DialogTitle>
            <DialogContent>
              <List>
                {lists
                  .filter((l) => l.completed)
                  .map((l) => (
                    <Grow key={l._id} in timeout={300}>
                      <ListItem>
                        <ListItemButton
                          onClick={() => {
                            setCurrentListId(l._id);
                            setCurrentList(l);
                            setViewingHistory(true);
                            fetchTodos(l._id);
                            setHistoryOpen(false);
                          }}
                        >
                          <ListItemText
                            primary={l.name}
                            secondary={
                              l.finishedAt
                                ? new Date(l.finishedAt).toLocaleString('ru-RU', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    </Grow>
                  ))}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setHistoryOpen(false)}>Закрыть</Button>
            </DialogActions>
          </Dialog>
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
