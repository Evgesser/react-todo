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
  Snackbar,
  Alert,
  InputAdornment,
} from '@mui/material';

// shared types, constants and helpers
import { Template } from '@/types';
import { getTextColor, getLuminance } from '@/utils/color';
import { categories as defaultCategories, templates as defaultTemplates, Category } from '@/constants';
import {
  createList as apiCreateList,
  createTodosBulk,
  fetchPersonalization,
} from '@/lib/api';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import ClearIcon from '@mui/icons-material/Clear';
import { useTheme } from '@mui/material/styles';

// Custom hooks
import { useFormAutoCollapse } from '../hooks/useFormAutoCollapse';
import { useTodos } from '../hooks/useTodos';
import { useLists } from '../hooks/useLists';
import { useAuth } from '../hooks/useAuth';
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
  const [personalDialogOpen, setPersonalDialogOpen] = React.useState(false);

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
  });

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
          const merged: Category[] = data.categories.map((c) => {
            const found = defaultCategories.find((d) => d.value === c.value);
            return { value: c.value, label: c.label, icon: found?.icon || null };
          });
          setAvailableCategories(merged);
        }
        if (Array.isArray(data.templates)) {
          setAvailableTemplates(data.templates);
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

  const handleRegisterSuccess = React.useCallback((userId: string, username: string) => {
    // Close register dialog first
    setRegisterDialogOpen(false);
    
    // Set auth data directly without calling login API again
    auth.setAuthData(userId, username);
    
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

  // logout/exit the current list and return to the login screen
  const handleExit = () => {
    auth.logout();
    listActions.clearAllLists();
    todoActions.setTodos([]);
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
            handleExit={handleExit}
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
                <TextField
                  label={t.todos.name}
                  placeholder={t.todos.namePlaceholder}
                  value={todoActions.name}
                  onChange={(e) => todoActions.setName(e.target.value)}
                  fullWidth
                  InputProps={{
                    endAdornment: todoActions.name ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => todoActions.setName('')}
                          edge="end"
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
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
                <TextField
                  select
                  label={t.todos.category}
                  value={todoActions.category}
                  onChange={(e) => todoActions.setCategory(e.target.value)}
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
                  <Button variant="contained" onClick={todoActions.addItem}>
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
            {todoActions.todos
              .filter(
                (t) =>
                  t.name.toLowerCase().includes(todoActions.filterText.toLowerCase()) ||
                  t.description.toLowerCase().includes(todoActions.filterText.toLowerCase())
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
                    draggable={!listActions.viewingHistory}
                    onDragStart={(e) => todoActions.onDragStart(e, index)}
                    onDragOver={todoActions.onDragOver}
                    onDrop={(e) => todoActions.onDrop(e, index)}
                    sx={{
                      mb: 1,
                      backgroundColor: itemBg || 'inherit',
                      transition: 'background-color 0.3s ease',
                      color: itemTextColor,
                      cursor: !listActions.viewingHistory ? 'move' : 'auto',
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

                        {!listActions.viewingHistory && (
                          <Stack direction="row" spacing={1}>
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
            })}
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
