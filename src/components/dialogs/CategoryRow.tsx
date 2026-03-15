import * as React from 'react';
import { Box, IconButton, MenuItem } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { iconChoices, currencySymbols } from '@/constants';
import type { StoredCategory } from '@/types';
import type { TranslationKeys } from '@/locales/ru';
import ClearableTextField from '../ClearableTextField';

interface CategoryRowProps {
  category: StoredCategory;
  t: TranslationKeys;
  onChange: (next: StoredCategory) => void;
  onRemove: () => void;
  autoFocusIcon?: boolean;
}

export default function CategoryRow({
  category,
  t,
  onChange,
  onRemove,
  autoFocusIcon,
}: CategoryRowProps) {
  const handleField = (key: keyof StoredCategory, value: string | number | boolean | undefined) => {
    onChange({ ...category, [key]: value });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        mb: 1,
        flexDirection: { xs: 'column', sm: 'row' },
      }}
    >
      <ClearableTextField
        disabled
        label={t.dialogs.personalization.categoryValue}
        value={category.value}
        sx={{ marginInlineEnd: 1, width: { xs: '100%', sm: 120 }, opacity: 0.7 }}
      />

      <ClearableTextField
        label={t.dialogs.personalization.categoryLabel}
        value={category.label}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          handleField('label', e.target.value)
        }
        sx={{ marginInlineEnd: 1, width: { xs: '100%', sm: 120 } }}
      />

      <ClearableTextField
        select
        label={t.dialogs.personalization.categoryIcon}
        value={category.icon || ''}
        autoFocus={autoFocusIcon}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          handleField('icon', e.target.value)
        }
        sx={{ marginInlineEnd: 1, width: { xs: '100%', sm: 160, md: 200 } }}
      >
        <MenuItem value="">{t.dialogs.personalization.noIcon}</MenuItem>
        {iconChoices.map((ic) => (
          <MenuItem
            key={ic.key}
            value={ic.key}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <Box component="span" sx={{ marginInlineEnd: 1 }}>
              <ic.icon fontSize="small" />
            </Box>
            {(t.categoryLabels as Record<string, string>)?.[ic.key] || ic.label}
          </MenuItem>
        ))}
      </ClearableTextField>

      <ClearableTextField
        label={t.dialogs.personalization.categoryBudget}
        type="number"
        value={category.budget ?? ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const v = e.target.value;
          const num = v === '' ? undefined : parseFloat(v);
          handleField('budget', Number.isNaN(num) ? undefined : num);
        }}
        sx={{ marginInlineEnd: 1, width: { xs: '100%', sm: 120 } }}
      />

      <ClearableTextField
        select
        label={t.dialogs.personalization.categoryCurrency}
        value={category.currency || ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          handleField('currency', e.target.value)
        }
        sx={{ marginInlineEnd: 1, width: { xs: '100%', sm: 120 } }}
      >
        <MenuItem value="">{t.dialogs.personalization.none}</MenuItem>
        {Object.keys(currencySymbols).map((code) => (
          <MenuItem key={code} value={code}>
            {code}
          </MenuItem>
        ))}
      </ClearableTextField>

      <ClearableTextField
        label={t.dialogs.personalization.categoryExchangeRate}
        type="number"
        value={category.exchangeRateToListCurrency ?? ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const v = e.target.value;
          const num = v === '' ? undefined : parseFloat(v);
          handleField('exchangeRateToListCurrency', Number.isNaN(num) ? undefined : num);
        }}
        sx={{ marginInlineEnd: 1, width: { xs: '100%', sm: 140 } }}
      />

      <IconButton onClick={onRemove} aria-label={t.buttons.delete} size="small" title={t.buttons.delete}>
        <DeleteIcon />
      </IconButton>
    </Box>
  );
}
