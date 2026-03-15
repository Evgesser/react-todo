import * as React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import { Box, Alert, Chip, TextField } from '@mui/material';
import type { TranslationKeys } from '@/locales/ru';
import { categoryKeywords, iconChoices } from '@/constants';
import CategoryIconPicker from './CategoryIconPicker';
import type { Category } from '@/constants';

export type CategoryOption =
  | string
  | {
      value: string;
      label?: string;
      icon?: React.ElementType | null;
    };

export interface TodoFormCategorySectionProps {
  category: string;
  setCategoryManual: (value: string) => void;
  availableCategories: Category[];
  categoryOptions: CategoryOption[];
  t: TranslationKeys;
  language: string;
  ensureCategoryExists: (val: string, iconKey?: string) => Promise<void>;
  tempIconKey: string;
  setTempIconKey: React.Dispatch<React.SetStateAction<string>>;
  categoryWarning: string;
  categoryLocked?: boolean;
}

export default function TodoFormCategorySection({
  category,
  setCategoryManual,
  availableCategories,
  categoryOptions,
  t,
  language,
  ensureCategoryExists,
  tempIconKey,
  setTempIconKey,
  categoryWarning,
  categoryLocked,
}: TodoFormCategorySectionProps) {
  return (
    <>
      <Autocomplete
        freeSolo
        disabled={!!categoryLocked}
        options={categoryOptions}
        getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.label || opt.value)}
        filterOptions={(opts, state) => {
          const q = (state.inputValue || '').trim().toLowerCase();
          if (!q) return opts;

          const langKeywords = categoryKeywords[language] || categoryKeywords.en;

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
        disablePortal
        value={
          category === ''
            ? null
            : availableCategories.find((c) => c.value === category) ||
              (category
                ? {
                    value: category,
                    label:
                      (t.categoryLabels as Record<string, string>)?.[category] ||
                      iconChoices.find((x) => x.key === category)?.label ||
                      category,
                    icon: iconChoices.find((x) => x.key === category)?.icon || null,
                  }
                : null)
        }
        inputValue={
          category === ''
            ? ''
            : (typeof category === 'string'
                ? ( (t.categoryLabels as Record<string, string>)?.[category] ||
                    availableCategories.find((c) => c.value === category)?.label ||
                    category )
                : '')
        }
        onInputChange={(_, v, reason) => {
          if (reason === 'input' && !categoryLocked) {
            setCategoryManual(v);
          }
        }}
        onChange={(_, v) => {
          if (categoryLocked) return;
          let val = '';
          if (typeof v === 'string') {
            val = v;
          } else if (v && typeof v === 'object') {
            val = v.value || '';
          }
          setCategoryManual(val);
          ensureCategoryExists(val);
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
        renderInput={(params) => <TextField {...params} label={t.todos.category} fullWidth />}
      />

      {category && (
        <Box sx={{ mt: 0.5 }}>
          <Chip
            label={
              (t.categoryLabels as Record<string, string>)?.[category] ||
              availableCategories.find((c) => c.value === category)?.label ||
              category
            }
            icon={
              iconChoices.find((x) => x.key === category)?.icon
                ? React.createElement(iconChoices.find((x) => x.key === category)!.icon, {
                    fontSize: 'small',
                  })
                : undefined
            }
            onDelete={categoryLocked ? undefined : () => setCategoryManual('')}
            color="primary"
            variant="outlined"
          />
        </Box>
      )}

      {categoryWarning && (
        <Box sx={{ mt: 0.5 }}>
          <Alert severity="warning" onClose={() => setCategoryManual(category)}>
            {categoryWarning}
          </Alert>
        </Box>
      )}

      {category && !availableCategories.find((c) => c.value === category) && (
        <Box sx={{ mt: 1 }}>
          <CategoryIconPicker selected={tempIconKey} onChange={setTempIconKey} />
        </Box>
      )}
    </>
  );
}
