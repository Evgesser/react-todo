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
  List,
  Card,
  CardContent,
  Checkbox,
  Stack,
  Grow,
  alpha,
  Snackbar,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { getLuminance, getTextColor } from '@/utils/color';
import Header from '@/components/layout/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import type { IntlShape } from 'react-intl';
import { useTheme } from '@mui/material/styles';
import { useSharedTodos } from '@/hooks/useSharedTodos';

export default function SharedPage() {
  const router = useRouter();
  const { token } = router.query;
  const { t, formatMessage } = useLanguage();
  const theme = useTheme();

    const _formatMessage = (id: string, values?: Parameters<IntlShape['formatMessage']>[1]) =>
      formatMessage(id, values);

  const [snackbarMsg, setSnackbarMsg] = React.useState('');
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);

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

  const LIGHT_WHITE2 = LIGHT_WHITE; // reuse

  // render todo list elements (similar to index but stripped)
  const renderTodos = () => {
    const filtered = todoActions.todos.filter(
      (t) =>
        t.name.toLowerCase().includes(todoActions.filterText.toLowerCase()) ||
        t.description.toLowerCase().includes(todoActions.filterText.toLowerCase())
    );
    const orderSorted = [...filtered].sort((a, b) => (a.order || 0) - (b.order || 0));
    const cats = Array.from(new Set(orderSorted.map((t) => t.category || '')));
    const sorted = [...filtered].sort((a, b) => {
      const ca = cats.indexOf(a.category || '');
      const cb = cats.indexOf(b.category || '');
      if (ca !== cb) return ca - cb;
      return (a.order || 0) - (b.order || 0);
    });
    const allSorted = [...todoActions.todos].sort((a, b) => {
      const ca = cats.indexOf(a.category || '');
      const cb = cats.indexOf(b.category || '');
      if (ca !== cb) return ca - cb;
      return (a.order || 0) - (b.order || 0);
    });
    const groupCats = Array.from(new Set(allSorted.map((t) => t.category || '')));

    const elements: React.ReactNode[] = [];
    const seenCategories = new Set<string>();

    sorted.forEach((todo) => {
      const catKey = todo.category || '__none';
      if (!seenCategories.has(catKey)) {
        seenCategories.add(catKey);
        const realCat = todo.category || '';
        const label = realCat;
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
            <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
              {label}
            </Typography>
            <Box sx={{ marginLeft: 'auto', display: 'flex', gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={async () => {
                  todoActions.setFilterText('');
                  todoActions.setFilterCategory('');
                  await todoActions.moveCategory(realCat, 'up');
                }}
                edge="end"
                disabled={groupCats.indexOf(realCat) <= 0}
              >
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={async () => {
                  todoActions.setFilterText('');
                  todoActions.setFilterCategory('');
                  await todoActions.moveCategory(realCat, 'down');
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
        itemBg = alpha(theme.palette.error.light, 0.4);
      } else {
        itemBg = todo.color && todo.color.trim() ? todo.color : undefined;
      }

      let itemTextColor = theme.palette.text.primary as string;
      if (!todo.completed && todo.color && todo.color.trim()) {
        const bg = todo.color;
        const itemBgLum = getLuminance(bg);
        if (!isNaN(itemBgLum)) {
          itemTextColor = itemBgLum > 0.5 ? 'rgba(0,0,0,0.87)' : (theme.palette.mode === 'dark' ? LIGHT_WHITE2 : '#ffffff');
        } else {
          try {
            itemTextColor = theme.palette.getContrastText ? theme.palette.getContrastText(bg) : getTextColor(bg);
          } catch {
            itemTextColor = theme.palette.text.primary as string;
          }
        }
      }
      if (todo.missing) {
        itemTextColor = theme.palette.text.primary as string;
      }

      const globalIndex = todoActions.todos.findIndex((t) => t._id === todo._id);

      elements.push(
        <Grow key={todo._id} in timeout={300}>
          <Card
            draggable
            onDragStart={(e) => todoActions.onDragStart(e, globalIndex)}
            onDragOver={todoActions.onDragOver}
            onDrop={(e) => todoActions.onDrop(e, globalIndex)}
            onTouchStart={(e) => todoActions.onTouchStart(e, globalIndex)}
            onDragEnter={(e) => todoActions.onDragEnter(e, globalIndex)}
            onDragLeave={todoActions.onDragLeave}
            onTouchMove={todoActions.onTouchMove}
            onTouchEnd={(e) => todoActions.onTouchEnd(e, globalIndex)}
            sx={{
              mb: 1,
              backgroundColor: itemBg || 'inherit',
              boxShadow:
                todoActions.dragOverIndex === globalIndex
                  ? '0 0 0 3px rgba(25,118,210,0.12)'
                  : undefined,
              transition: 'background-color 0.3s ease',
              color: itemTextColor,
              cursor: 'move',
              touchAction: 'pan-y',
            }}
            elevation={1}
          >
            <CardContent sx={{ p: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                <Stack spacing={0.25} alignItems="center">
                  <Checkbox
                    checked={todo.completed}
                    onChange={() => todoActions.toggleComplete(todo)}
                    icon={<RadioButtonUncheckedIcon />}
                    checkedIcon={<RadioButtonCheckedIcon />}
                    sx={{
                      color: itemTextColor,
                      '& .MuiSvgIcon-root': { borderRadius: '50%' },
                    }}
                  />
                </Stack>
                <Box sx={{ flex: 1 }}>
                  <Typography>{todo.name}</Typography>
                  {todo.description && (
                    <Typography variant="body2" color="text.secondary">
                      {todo.description}
                    </Typography>
                  )}
                  {todo.comment && (
                    <Typography variant="caption" color="text.secondary">
                      {todo.comment}
                    </Typography>
                  )}
                </Box>
                {todo.missing && (
                  <Typography variant="caption" color="error">
                    {t.todos.missing}
                  </Typography>
                )}
                <IconButton
                  size="small"
                  onClick={() => todoActions.toggleMissing(todo)}
                >
                  {todo.missing ? <CheckCircleOutlineIcon /> : <ErrorOutlineIcon />}
                </IconButton>
              </Stack>
            </CardContent>
          </Card>
        </Grow>
      );
    });

    return elements;
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Head>
        <title>{todoActions.list?.name || t.header.title}</title>
      </Head>
      <Header
        headerColor={headerColor}
        effectiveHeaderTextColor={headerTextColor}
        t={t}
      />

      {/* simple search input */}
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
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
      </Box>

      <List sx={{ width: '100%' }}>{renderTodos()}</List>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMsg}
      />
    </Container>
  );
}
