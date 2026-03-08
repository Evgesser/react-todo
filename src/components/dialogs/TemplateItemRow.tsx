import * as React from 'react';
import { Box, IconButton, Autocomplete, InputAdornment } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearableTextField from '../ClearableTextField';
import type { TranslationKeys } from '@/locales/ru';
import { iconChoices } from '@/constants';

export interface TemplateItem {
  name: string;
  quantity?: number;
  category?: string;
}

interface CatOpt { value: string; label: string; icon?: string }
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
        sx={{ marginInlineEnd: 1, width: { xs: '100%', sm: 'auto' } }}
      />

      <ClearableTextField
        label={t.dialogs.personalization.itemQuantity}
        type="number"
        value={item.quantity || ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          handle('quantity', parseInt(e.target.value, 10) || 0)
        }
        sx={{ marginInlineEnd: 1, width: { xs: '100%', sm: 100, md: 120 } }}
      />

      <Autocomplete
        fullWidth
        freeSolo
        options={categoryOptions || []}
        getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.label)}
        value={
          item.category
            ?
              (categoryOptions || []).find((o) => o.value === item.category) ||
              { value: item.category, label: item.category, icon: undefined }
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
        renderOption={(props, option) => (
          <li {...props}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {option.icon ? (
                (() => {
                  const ic = iconChoices.find((x) => x.key === option.icon);
                  return ic ? React.createElement(ic.icon, { fontSize: 'small' }) : null;
                })()
              ) : null}
              <Box sx={{ ml: option.icon ? 1 : 0 }}>{option.label}</Box>
            </Box>
          </li>
        )}
        renderInput={(params) => {
          const sel = (categoryOptions || []).find((o) => o.value === item.category) as CatOpt | undefined;
          let IconComp: any = null;
          if (sel && sel.icon) {
            const found = iconChoices.find((x) => x.key === sel.icon);
            IconComp = found ? found.icon : null;
          } else if (item.category) {
            const found = iconChoices.find((x) => x.key === item.category);
            IconComp = found ? found.icon : null;
          }
          return (
            <ClearableTextField
              {...params}
              label={t.dialogs.personalization.itemCategory}
              sx={{ marginInlineEnd: { xs: 0, sm: 1 }, width: { xs: '100%', sm: 160 } }}
              InputProps={{
                ...params.InputProps,
                startAdornment: IconComp ? (
                  <InputAdornment position="start">
                    {React.createElement(IconComp, { fontSize: 'small' })}
                  </InputAdornment>
                ) : params.InputProps?.startAdornment,
              }}
            />
          );
        }}
      />


      <IconButton onClick={onRemove}>
        <DeleteIcon />
      </IconButton>
    </Box>
  );
}
