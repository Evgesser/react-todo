import * as React from 'react';
import { Box, IconButton, Autocomplete } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearableTextField from '../ClearableTextField';
import type { TranslationKeys } from '@/locales/ru';

export interface TemplateItem {
  name: string;
  quantity?: number;
  category?: string;
}

interface CatOpt { value: string; label: string }
interface Props {
  item: TemplateItem;
  t: TranslationKeys;
  onChange: (item: TemplateItem) => void;
  onRemove: () => void;
  categoryOptions?: CatOpt[]; // available categories for autocomplete
  onCategoryAdd?: (cat: string) => void;
}

export default function TemplateItemRow({
  item,
  t,
  onChange,
  onRemove,
  categoryOptions,
  onCategoryAdd,
}: Props) {
  const handle = (key: keyof TemplateItem, value: string | number) => {
    onChange({ ...item, [key]: value } as TemplateItem);
  };

  // track displayed text separate from stored category value
  const [displayText, setDisplayText] = React.useState(item.category || '');

  React.useEffect(() => {
    if (item.category) {
      const found = (categoryOptions || []).find((o) => o.value === item.category);
      setDisplayText(found ? found.label : item.category);
    } else {
      setDisplayText('');
    }
  }, [item.category, categoryOptions]);

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
        sx={{ mr: 1, width: { xs: '100%', sm: 100, md: 120 } }}
      />

      <Autocomplete
        freeSolo
        options={categoryOptions || []}
        getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.label)}
        value={
          item.category
            ?
              (categoryOptions || []).find((o) => o.value === item.category) ||
              { value: item.category, label: item.category }
            : null
        }
        inputValue={displayText}
        onInputChange={(_, v, reason) => {
          setDisplayText(v);
          if (reason === 'input') {
            handle('category', v);
          }
        }}
        onChange={(_, v) => {
          let val = '';
          let label = '';
          if (typeof v === 'string') {
            val = v;
            label = v;
          } else if (v && typeof v === 'object') {
            val = v.value;
            label = v.label;
          }
          handle('category', val);
          setDisplayText(label);
        }}
        onBlur={() => {
          if (
            onCategoryAdd &&
            item.category &&
            categoryOptions &&
            !categoryOptions.find((o) => o.value === item.category)
          ) {
            onCategoryAdd(item.category);
          }
        }}
        renderInput={(params) => (
          <ClearableTextField
            {...params}
            label={t.dialogs.personalization.itemCategory}
            sx={{ mr: 1, width: { xs: '100%', sm: 140 } }}
          />
        )}
      />


      <IconButton onClick={onRemove}>
        <DeleteIcon />
      </IconButton>
    </Box>
  );
}
