import * as React from 'react';
import { Box, IconButton, MenuItem } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { iconChoices } from '@/constants';
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
  const handleField = (key: keyof StoredCategory, value: string) => {
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
        label={t.dialogs.personalization.categoryValue}
        value={category.value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          handleField('value', e.target.value)
        }
        sx={{ mr: 1, width: { xs: '100%', sm: 120 } }}
      />

      <ClearableTextField
        label={t.dialogs.personalization.categoryLabel}
        value={category.label}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          handleField('label', e.target.value)
        }
        sx={{ mr: 1, width: { xs: '100%', sm: 120 } }}
      />

      <ClearableTextField
        select
        label={t.dialogs.personalization.categoryIcon}
        value={category.icon || ''}
        autoFocus={autoFocusIcon}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          handleField('icon', e.target.value)
        }
        sx={{ mr: 1, width: { xs: '100%', sm: 160, md: 200 } }}
      >
        <MenuItem value="">{t.dialogs.personalization.noIcon}</MenuItem>
        {iconChoices.map((ic) => (
          <MenuItem
            key={ic.key}
            value={ic.key}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <Box component="span" sx={{ mr: 1 }}>
              <ic.icon fontSize="small" />
            </Box>
            {(t.categoryLabels as Record<string, string>)?.[ic.key] || ic.label}
          </MenuItem>
        ))}
      </ClearableTextField>

      <IconButton onClick={onRemove}>
        <DeleteIcon />
      </IconButton>
    </Box>
  );
}
