import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Collapse,
} from '@mui/material';
import CategoryRow from './CategoryRow';
import TemplateEditor from './TemplateEditor';

// icons moved into child components

import { Template } from '@/types';
import { categories as defaultCategories, Category, iconMap } from '@/constants';
import { savePersonalization } from '@/lib/api';
import type { StoredCategory } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface PersonalizationDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  availableCategories: Category[];
  setAvailableCategories: (cats: Category[]) => void;
  availableTemplates: Template[];
  setAvailableTemplates: (templates: Template[]) => void;
  products: Array<{ name: string; category?: string }>;
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
  products,
  setSnackbarMsg,
  setSnackbarOpen,
}: PersonalizationDialogProps) {
  const { t } = useLanguage();

  // adapt dialog for narrow screens (phones)
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [editingCategories, setEditingCategories] = React.useState<StoredCategory[]>([]);
  const [editingTemplates, setEditingTemplates] = React.useState<Template[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [autoFocusCategory, setAutoFocusCategory] = React.useState<string | null>(null);

  // clear focus flag shortly after it's set so the next render doesn't repeatedly open
  React.useEffect(() => {
    if (autoFocusCategory) {
      const timer = setTimeout(() => setAutoFocusCategory(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [autoFocusCategory]);

  // callback from template rows when a new category string is entered
  const handleTemplateCategoryAdd = React.useCallback(
    (cat: string) => {
      const v = cat.trim();
      if (!v) return;
      if (!editingCategories.find((c) => c.value === v)) {
        setEditingCategories((prev) => [...prev, { value: v, label: v, icon: '' }]);
        setAutoFocusCategory(v);
        setSnackbarMsg(t.messages.categoryAdded || `Category "${v}" added. Select an icon.`);
        setSnackbarOpen(true);
      }
    },
    [editingCategories, setSnackbarMsg, setSnackbarOpen, t.messages]
  );

  // list of strings passed to template editors; include current categories and any appearing in products
  interface CatOpt { value: string; label: string; }
  const templateCategoryOptions = React.useMemo<CatOpt[]>(() => {
    const map = new Map<string, string>();
    editingCategories.forEach((c) => {
      if (c.value && c.value.trim()) map.set(c.value, c.label || c.value);
    });
    availableCategories.forEach((c) => {
      if (c.value && c.value.trim() && !map.has(c.value))
        map.set(c.value, c.label || c.value);
    });
    products.forEach((p) => {
      if (p.category && p.category.trim() && !map.has(p.category))
        map.set(p.category, p.category);
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [editingCategories, availableCategories, products]);

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
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" fullScreen={fullScreen}>
      <DialogTitle>{t.dialogs.personalization.title}</DialogTitle>
      <DialogContent>
        <Box sx={{ opacity: saving ? 0.5 : 1, pointerEvents: saving ? 'none' : undefined }}>
          <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>
            {t.dialogs.personalization.categories}
          </Typography>

        {editingCategories.map((category, categoryIndex) => (
          <Collapse key={categoryIndex} in timeout={300}>
            <CategoryRow
              category={category}
              t={t}
              autoFocusIcon={autoFocusCategory === category.value}
              onChange={(next) =>
                setEditingCategories((prev) => {
                  const arr = [...prev];
                  arr[categoryIndex] = next;
                  return arr;
                })
              }
              onRemove={() =>
                setEditingCategories((prev) => prev.filter((_, i) => i !== categoryIndex))
              }
            />
          </Collapse>
        ))}
        <Button
          size="small"
          sx={{ mt: 1 }}
          onClick={() =>
            setEditingCategories((prev) => [...prev, { value: '', label: '', icon: '' }])
          }
        >
          {t.dialogs.personalization.addCategory}
        </Button>

        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
          {t.dialogs.personalization.templates}
        </Typography>

        {editingTemplates.map((template, templateIndex) => (
          <Collapse key={templateIndex} in timeout={300}>
            <TemplateEditor
              template={template}
              t={t}
              categoryOptions={templateCategoryOptions}
              onCategoryAdd={handleTemplateCategoryAdd}
              onChange={(next) =>
                setEditingTemplates((prev) => {
                  const arr = [...prev];
                  arr[templateIndex] = next;
                  return arr;
                })
              }
              onRemove={() =>
                setEditingTemplates((prev) => prev.filter((_, i) => i !== templateIndex))
              }
            />
          </Collapse>
        ))}

        <Button onClick={() => setEditingTemplates((prev) => [...prev, { name: '', items: [] }])}>
          {t.dialogs.personalization.addTemplate}
        </Button>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>{t.buttons.cancel}</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : undefined}
        >
          {saving ? t.messages.loading : t.dialogs.personalization.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
