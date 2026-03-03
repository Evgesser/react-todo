import * as React from 'react';
import { Box, Typography, IconButton, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
// clear icon now comes from ClearableTextField, no need to import separately
import ClearableTextField from '../ClearableTextField';
import TemplateItemRow, { TemplateItem } from './TemplateItemRow';
import type { TranslationKeys } from '@/locales/ru';
import type { Template } from '@/types';

interface Props {
  template: Template;
  t: TranslationKeys;
  onChange: (tmpl: Template) => void;
  onRemove: () => void;
}

export default function TemplateEditor({ template, t, onChange, onRemove }: Props) {
  const handleName = (name: string) => onChange({ ...template, name });

  const updateItem = (index: number, item: TemplateItem) => {
    const items = [...template.items];
    items[index] = item;
    onChange({ ...template, items });
  };

  const addItem = () => {
    onChange({ ...template, items: [...template.items, { name: '', quantity: 1, category: '' }] });
  };

  const removeItem = (index: number) => {
    const items = [...template.items];
    items.splice(index, 1);
    onChange({ ...template, items });
  };

  return (
    <Box sx={{ border: '1px solid rgba(0,0,0,0.2)', p: 1, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <ClearableTextField
          label={t.dialogs.personalization.templateName}
          value={template.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleName(e.target.value)
          }
          fullWidth
          sx={{ mr: 1 }}
        />
        <IconButton onClick={onRemove}>
          <DeleteIcon />
        </IconButton>
      </Box>

      <Typography variant="body2" sx={{ mb: 1 }}>
        {t.dialogs.personalization.items}
      </Typography>

      {template.items.map((item, idx) => (
        <TemplateItemRow
          key={idx}
          item={item}
          t={t}
          onChange={(it) => updateItem(idx, it)}
          onRemove={() => removeItem(idx)}
        />
      ))}

      <Button size="small" onClick={addItem}>
        {t.dialogs.personalization.addItem}
      </Button>
    </Box>
  );
}
