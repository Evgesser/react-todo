import * as React from 'react';
import { Box, Button, Chip, Dialog, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import LinearProgress from '@mui/material/LinearProgress';
import type { TranslationKeys } from '@/locales/ru';
import { categoryKeywords, iconChoices } from '@/constants';
import CategoryIconPicker from './CategoryIconPicker';

export type CategoryOption =
  | string
  | {
      value: string;
      label?: string;
      icon?: React.ElementType | null;
    };

export interface ConfirmCategoryDialogProps {
  open: boolean;
  onClose: () => void;
  pendingParsed: { name: string; category: string; quantity: number; unit: string; comment: string } | null;
  setPendingParsed: React.Dispatch<React.SetStateAction<{ name: string; category: string; quantity: number; unit: string; comment: string } | null>>;
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  availableCategories: Array<{ value: string; label: string; icon?: React.ElementType | null }>;
  categoryOptions: CategoryOption[];
  t: TranslationKeys;
  language: string;
  ensureCategoryExists: (val: string, iconKey?: string) => Promise<void>;
  handleAdd: (override?: Partial<{ name: string; category: string; quantity: number; unit: string; comment: string }>) => Promise<void>;
  tempIconKey: string;
  setTempIconKey: React.Dispatch<React.SetStateAction<string>>;
}

export default function ConfirmCategoryDialog({
  open,
  onClose,
  pendingParsed,
  setPendingParsed,
  isSubmitting,
  setIsSubmitting,
  availableCategories,
  categoryOptions,
  t,
  language,
  ensureCategoryExists,
  handleAdd,
  tempIconKey,
  setTempIconKey,
}: ConfirmCategoryDialogProps) {
  const langKeywords = categoryKeywords[language] || categoryKeywords.en;


  const normalizedInputValue = React.useMemo(() => {
    if (!pendingParsed?.category) return '';
    if (typeof pendingParsed.category !== 'string') return '';
    return (
      (t.categoryLabels as Record<string, string>)?.[pendingParsed.category] ||
      availableCategories.find((c) => c.value === pendingParsed.category)?.label ||
      pendingParsed.category
    );
  }, [pendingParsed, t, availableCategories]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ className: 'glass', sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
        <Typography variant="h6" fontWeight="bold">
          {t.todos.category || 'Category'}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center', p: 3 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {t.messages.possibleCategoryMismatch || 'Select category for:'}{' '}
          <Box component="span" sx={{ fontWeight: 'bold', mx: 1, color: 'primary.main' }}>
            &quot;{(pendingParsed?.name || '').toLowerCase()}&quot;
          </Box>
        </Typography>
        <Autocomplete
          freeSolo
          options={categoryOptions}
          getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.label || opt.value)}
          filterOptions={(opts, state) => {
            const q = (state.inputValue || '').trim().toLowerCase();
            if (!q) return opts;
            return opts.filter((opt) => {
              const label = typeof opt === 'string' ? opt : opt.label || opt.value || '';
              const value = typeof opt === 'string' ? opt : opt.value || '';

              if (label.toLowerCase().includes(q) || value.toLowerCase().includes(q)) {
                return true;
              }

              if (value && langKeywords[value]) {
                return langKeywords[value].some((kw) => {
                  const lkw = kw.toLowerCase();
                  return lkw.includes(q) || q.includes(lkw);
                });
              }
              return false;
            });
          }}
          value={
            !pendingParsed?.category
              ? null
              : availableCategories.find((c) => c.value === pendingParsed.category) ||
                (pendingParsed.category
                  ? {
                      value: pendingParsed.category,
                      label:
                        (t.categoryLabels as Record<string, string>)?.[pendingParsed.category] ||
                        iconChoices.find((x) => x.key === pendingParsed.category)?.label ||
                        pendingParsed.category,
                      icon:
                        iconChoices.find((x) => x.key === pendingParsed.category)?.icon || null,
                    }
                  : null)
          }
          inputValue={normalizedInputValue}
          onInputChange={(_, v) => {
            if (pendingParsed) {
              const found = availableCategories.find((c) => c.label === v || c.value === v);
              const newVal = found ? found.value : v;
              setPendingParsed({ ...pendingParsed, category: newVal });
            }
          }}
          onChange={(_, v) => {
            let val = '';
            if (typeof v === 'string') {
              val = v;
            } else if (v && typeof v === 'object') {
              val = v.value || '';
            }
            if (pendingParsed) {
              setPendingParsed({ ...pendingParsed, category: val });
            }
          }}
          renderOption={(props, option) => (
            <li {...props} key={typeof option === 'string' ? option : option.value}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {typeof option !== 'string' && option.icon ? (
                  <option.icon fontSize="small" sx={{ marginInlineEnd: 0.5 }} />
                ) : null}
                {typeof option === 'string' ? option : option.label || option.value}
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t.todos.category}
              fullWidth
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && pendingParsed && !isSubmitting) {
                  const found = availableCategories.find((c) => c.label === pendingParsed.category);
                  const finalCategory = found ? found.value : pendingParsed.category;
                  setIsSubmitting(true);
                  handleAdd({ ...pendingParsed, category: finalCategory })
                    .finally(() => {
                      setIsSubmitting(false);
                      onClose();
                    });
                }
              }}
            />
          )}
        />

        {pendingParsed?.category && (
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 0.5 }}>
            <Chip
              label={
                (t.categoryLabels as Record<string, string>)?.[pendingParsed.category] ||
                availableCategories.find((c) => c.value === pendingParsed.category)?.label ||
                pendingParsed.category
              }
              icon={
                iconChoices.find((x) => x.key === pendingParsed.category)?.icon
                  ? React.createElement(
                      iconChoices.find((x) => x.key === pendingParsed.category)!.icon,
                      { fontSize: 'small' }
                    )
                  : undefined
              }
              onDelete={() => setPendingParsed({ ...pendingParsed, category: '' })}
              color="primary"
              variant="outlined"
              size="small"
              disabled={isSubmitting}
            />
          </Box>
        )}

        {pendingParsed?.category && !availableCategories.find((c) => c.value === pendingParsed.category) && (
          <Box sx={{ mt: 1 }}>
            <CategoryIconPicker
              selected={tempIconKey}
              onChange={setTempIconKey}
            />
          </Box>
        )}

        <Box sx={{ mt: 3 }}>
          {isSubmitting ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1 }}>
              <LinearProgress sx={{ width: '100%', mb: 1, borderRadius: 1 }} />
              <Typography variant="caption" color="text.secondary">
                {t.auth?.loading || 'Processing...'}
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.5}>
              <Button
                fullWidth
                variant="contained"
                onClick={async () => {
                  if (!pendingParsed) return;
                  setIsSubmitting(true);
                  try {
                    const found = availableCategories.find((c) => c.label === pendingParsed.category);
                    const finalCategory = found ? found.value : pendingParsed.category;
                    if (finalCategory) {
                      await ensureCategoryExists(finalCategory, tempIconKey || undefined);
                    }
                    await handleAdd({ ...pendingParsed, category: finalCategory });
                    onClose();
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                sx={{ borderRadius: 2, py: 1 }}
              >
                {t.buttons.add}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="warning"
                onClick={async () => {
                  if (!pendingParsed) return;
                  setIsSubmitting(true);
                  try {
                    setPendingParsed({ ...pendingParsed, category: '' });
                    await handleAdd({ ...pendingParsed, category: '' });
                    onClose();
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                sx={{ borderRadius: 2, py: 1 }}
              >
                {language === 'ru'
                  ? 'Без категории'
                  : (t.categoryLabels as Record<string, string>)?.[''] || 'Without Category'}
              </Button>
              <Button fullWidth variant="text" onClick={onClose} sx={{ borderRadius: 2, color: 'text.secondary' }}>
                {t.buttons.cancel}
              </Button>
            </Stack>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
