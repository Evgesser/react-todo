import * as React from 'react';
import { Box, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearableTextField from '../ClearableTextField';
import type { TranslationKeys } from '@/locales/ru';

export interface TemplateItem {
  name: string;
  quantity?: number;
  category?: string;
}

interface Props {
  item: TemplateItem;
  t: TranslationKeys;
  onChange: (item: TemplateItem) => void;
  onRemove: () => void;
}

export default function TemplateItemRow({
  item,
  t,
  onChange,
  onRemove,
}: Props) {
  const handle = (key: keyof TemplateItem, value: string | number) => {
    onChange({ ...item, [key]: value } as TemplateItem);
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
        label={t.dialogs.personalization.itemName}
        value={item.name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          handle('name', e.target.value)
        }
        sx={{ mr: 1, width: { xs: '100%', sm: 'auto' } }}
      />

      <ClearableTextField
        label={t.dialogs.personalization.itemQuantity}
        type="number"
        value={item.quantity || ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          handle('quantity', parseInt(e.target.value, 10) || 0)
        }
        sx={{ mr: 1, width: { xs: '100%', sm: 80 } }}
      />

      <ClearableTextField
        label={t.dialogs.personalization.itemCategory}
        value={item.category || ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          handle('category', e.target.value)
        }
        sx={{ mr: 1, width: { xs: '100%', sm: 'auto' } }}
      />

      <IconButton onClick={onRemove}>
        <DeleteIcon />
      </IconButton>
    </Box>
  );
}
