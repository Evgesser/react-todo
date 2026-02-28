import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Template } from '@/types';
import { categories as defaultCategories } from '@/constants';
import { savePersonalization, StoredCategory } from '@/lib/api';
import { Category } from '@/constants';

interface PersonalizationDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  availableCategories: Category[];
  setAvailableCategories: (cats: Category[]) => void;
  availableTemplates: Template[];
  setAvailableTemplates: (t: Template[]) => void;
  setSnackbarMsg: (msg: string) => void;
  setSnackbarOpen: (open: boolean) => void;
}

export default function PersonalizationDialog({
  open,
  onClose,
  userId,
  availableCategories,
  setAvailableCategories,
  availableTemplates,
  setAvailableTemplates,
  setSnackbarMsg,
  setSnackbarOpen,
}: PersonalizationDialogProps) {
  const [editingCategories, setEditingCategories] = React.useState<StoredCategory[]>([]);
  const [editingTemplates, setEditingTemplates] = React.useState<Template[]>([]);

  React.useEffect(() => {
    if (open) {
      // initialize editing copies from current values
      setEditingCategories(
        availableCategories.map((c) => ({ value: c.value, label: c.label }))
      );
      setEditingTemplates(availableTemplates.map((t) => ({ ...t, items: [...t.items] })));
    }
  }, [open, availableCategories, availableTemplates]);

  const handleSave = async () => {
    if (!userId) {
      setSnackbarMsg('User not authenticated');
      setSnackbarOpen(true);
      return;
    }
    try {
      const saved = await savePersonalization(
        userId,
        editingCategories,
        editingTemplates
      );
      if (saved) {
        if (Array.isArray(saved.categories)) {
          const merged: Category[] = saved.categories.map((c: StoredCategory) => {
            const found = defaultCategories.find((d) => d.value === c.value);
            return { value: c.value, label: c.label, icon: found?.icon || null };
          });
          setAvailableCategories(merged);
        }
        if (Array.isArray(saved.templates)) {
          setAvailableTemplates(saved.templates);
        }
        setSnackbarMsg('Настройки сохранены');
        setSnackbarOpen(true);
        onClose();
      }
    } catch {
      setSnackbarMsg('Ошибка при сохранении');
      setSnackbarOpen(true);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Настройки персонализации</DialogTitle>
      <DialogContent>
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
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" onClick={handleSave}>
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
}
