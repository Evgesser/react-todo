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
  InputAdornment,
  MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';
import { Template } from '@/types';
import { categories as defaultCategories, Category, iconChoices, iconMap } from '@/constants';
import { savePersonalization, StoredCategory } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

interface PersonalizationDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  availableCategories: Category[];
  setAvailableCategories: (cats: Category[]) => void;
  availableTemplates: Template[];
  setAvailableTemplates: (templates: Template[]) => void;
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
  const { t } = useLanguage();
  const [editingCategories, setEditingCategories] = React.useState<StoredCategory[]>([]);
  const [editingTemplates, setEditingTemplates] = React.useState<Template[]>([]);

  React.useEffect(() => {
    if (!open) return;
    setEditingCategories(
      availableCategories.map((category) => ({
        value: category.value,
        label: category.label,
        icon: Object.keys(iconMap).find((k) => iconMap[k] === category.icon) || '',
      }))
    );
    setEditingTemplates(availableTemplates.map((template) => ({ ...template, items: [...template.items] })));
  }, [open, availableCategories, availableTemplates]);

  const handleSave = async () => {
    if (!userId) {
      setSnackbarMsg(t.messages.notAuthenticated);
      setSnackbarOpen(true);
      return;
    }

    try {
      const saved = await savePersonalization(userId, editingCategories, editingTemplates);
      if (Array.isArray(saved.categories)) {
        const merged: Category[] = saved.categories.map((category) => {
          const found = defaultCategories.find((item) => item.value === category.value);
          const iconComp = category.icon && iconMap[category.icon] ? iconMap[category.icon] : null;
          return { value: category.value, label: category.label, icon: iconComp || found?.icon || null };
        });
        setAvailableCategories(merged);
      }

      if (Array.isArray(saved.templates)) {
        setAvailableTemplates(saved.templates);
      }

      setSnackbarMsg(t.messages.personalizationSaved);
      setSnackbarOpen(true);
      onClose();
    } catch {
      setSnackbarMsg(t.messages.personalizationSaveError);
      setSnackbarOpen(true);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{t.dialogs.personalization.title}</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>
          {t.dialogs.personalization.categories}
        </Typography>

        {editingCategories.map((category, categoryIndex) => (
          <Box key={categoryIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <TextField
              label={t.dialogs.personalization.categoryValue}
              value={category.value}
              onChange={(event) => {
                const nextValue = event.target.value;
                setEditingCategories((prev) => {
                  const next = [...prev];
                  next[categoryIndex] = { ...next[categoryIndex], value: nextValue };
                  return next;
                });
              }}
              sx={{ mr: 1, width: 120 }}
              InputProps={{
                endAdornment: category.value ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingCategories((prev) => {
                          const next = [...prev];
                          next[categoryIndex] = { ...next[categoryIndex], value: '' };
                          return next;
                        });
                      }}
                      edge="end"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />

            <TextField
              label={t.dialogs.personalization.categoryLabel}
              value={category.label}
              onChange={(event) => {
                const nextValue = event.target.value;
                setEditingCategories((prev) => {
                  const next = [...prev];
                  next[categoryIndex] = { ...next[categoryIndex], label: nextValue };
                  return next;
                });
              }}
              sx={{ mr: 1, width: 120 }}
              InputProps={{
                endAdornment: category.label ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingCategories((prev) => {
                          const next = [...prev];
                          next[categoryIndex] = { ...next[categoryIndex], label: '' };
                          return next;
                        });
                      }}
                      edge="end"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />

            <TextField
              select
              label={t.dialogs.personalization.categoryIcon}
              value={category.icon || ''}
              onChange={(event) => {
                const iconValue = event.target.value;
                setEditingCategories((prev) => {
                  const next = [...prev];
                  next[categoryIndex] = { ...next[categoryIndex], icon: iconValue };
                  return next;
                });
              }}
              sx={{ mr: 1, width: 140 }}
            >
              <MenuItem value="">{t.dialogs.personalization.noIcon}</MenuItem>
              {iconChoices.map((ic) => (
                <MenuItem key={ic.key} value={ic.key} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box component="span" sx={{ mr: 1 }}>
                    <ic.icon fontSize="small" />
                  </Box>
                  {ic.label}
                </MenuItem>
              ))}
            </TextField>

            <IconButton onClick={() => setEditingCategories((prev) => prev.filter((_, index) => index !== categoryIndex))}>
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}

        <Button size="small" onClick={() => setEditingCategories((prev) => [...prev, { value: '', label: '', icon: '' }])}>
          {t.dialogs.personalization.addCategory}
        </Button>

        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
          {t.dialogs.personalization.templates}
        </Typography>

        {editingTemplates.map((template, templateIndex) => (
          <Box key={templateIndex} sx={{ border: '1px solid rgba(0,0,0,0.2)', p: 1, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TextField
                label={t.dialogs.personalization.templateName}
                value={template.name}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setEditingTemplates((prev) => {
                    const next = [...prev];
                    next[templateIndex] = { ...next[templateIndex], name: nextValue };
                    return next;
                  });
                }}
                fullWidth
                sx={{ mr: 1 }}
                InputProps={{
                  endAdornment: template.name ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingTemplates((prev) => {
                            const next = [...prev];
                            next[templateIndex] = { ...next[templateIndex], name: '' };
                            return next;
                          });
                        }}
                        edge="end"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />

              <IconButton onClick={() => setEditingTemplates((prev) => prev.filter((_, index) => index !== templateIndex))}>
                <DeleteIcon />
              </IconButton>
            </Box>

            <Typography variant="body2" sx={{ mb: 1 }}>
              {t.dialogs.personalization.items}
            </Typography>

            {template.items.map((item, itemIndex) => (
              <Box key={itemIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TextField
                  label={t.dialogs.personalization.itemName}
                  value={item.name}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setEditingTemplates((prev) => {
                      const next = [...prev];
                      const nextItems = [...next[templateIndex].items];
                      nextItems[itemIndex] = { ...nextItems[itemIndex], name: nextValue };
                      next[templateIndex] = { ...next[templateIndex], items: nextItems };
                      return next;
                    });
                  }}
                  sx={{ mr: 1 }}
                  InputProps={{
                    endAdornment: item.name ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingTemplates((prev) => {
                              const next = [...prev];
                              const nextItems = [...next[templateIndex].items];
                              nextItems[itemIndex] = { ...nextItems[itemIndex], name: '' };
                              next[templateIndex] = { ...next[templateIndex], items: nextItems };
                              return next;
                            });
                          }}
                          edge="end"
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                />

                <TextField
                  label={t.dialogs.personalization.itemQuantity}
                  type="number"
                  value={item.quantity || ''}
                  onChange={(event) => {
                    const nextValue = parseInt(event.target.value, 10) || 0;
                    setEditingTemplates((prev) => {
                      const next = [...prev];
                      const nextItems = [...next[templateIndex].items];
                      nextItems[itemIndex] = { ...nextItems[itemIndex], quantity: nextValue };
                      next[templateIndex] = { ...next[templateIndex], items: nextItems };
                      return next;
                    });
                  }}
                  sx={{ mr: 1, width: 80 }}
                />

                <TextField
                  label={t.dialogs.personalization.itemCategory}
                  value={item.category || ''}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setEditingTemplates((prev) => {
                      const next = [...prev];
                      const nextItems = [...next[templateIndex].items];
                      nextItems[itemIndex] = { ...nextItems[itemIndex], category: nextValue };
                      next[templateIndex] = { ...next[templateIndex], items: nextItems };
                      return next;
                    });
                  }}
                  sx={{ mr: 1 }}
                  InputProps={{
                    endAdornment: item.category ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingTemplates((prev) => {
                              const next = [...prev];
                              const nextItems = [...next[templateIndex].items];
                              nextItems[itemIndex] = { ...nextItems[itemIndex], category: '' };
                              next[templateIndex] = { ...next[templateIndex], items: nextItems };
                              return next;
                            });
                          }}
                          edge="end"
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                />

                <IconButton
                  onClick={() => {
                    setEditingTemplates((prev) => {
                      const next = [...prev];
                      const nextItems = [...next[templateIndex].items];
                      nextItems.splice(itemIndex, 1);
                      next[templateIndex] = { ...next[templateIndex], items: nextItems };
                      return next;
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
                  const next = [...prev];
                  next[templateIndex] = {
                    ...next[templateIndex],
                    items: [...next[templateIndex].items, { name: '', quantity: 1, category: '' }],
                  };
                  return next;
                });
              }}
            >
              {t.dialogs.personalization.addItem}
            </Button>
          </Box>
        ))}

        <Button onClick={() => setEditingTemplates((prev) => [...prev, { name: '', items: [] }])}>
          {t.dialogs.personalization.addTemplate}
        </Button>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t.buttons.cancel}</Button>
        <Button variant="contained" onClick={handleSave}>
          {t.dialogs.personalization.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
