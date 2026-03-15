import * as React from 'react';
import { IconButton, Box } from '@mui/material';
import { iconChoices } from '@/constants';
import type { CategoryIconPickerProps } from '@/types/componentProps';

export default function CategoryIconPicker({ selected, onChange, title }: CategoryIconPickerProps) {
  return (
    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }} title={title}>
      {iconChoices.map((ic) => (
        <IconButton
          key={ic.key}
          size="small"
          color={selected === ic.key ? 'primary' : 'default'}
          onClick={() => onChange(ic.key)}
          aria-label={ic.label}
          title={ic.label}
          sx={() => ({
            transition: 'transform 0.12s ease, box-shadow 0.12s',
            ...(selected === ic.key
              ? { boxShadow: '0 6px 18px rgba(99,102,241,0.18)', transform: 'scale(1.04)' }
              : { '&:hover': { transform: 'scale(1.06)' } }),
          })}
        >
          <ic.icon fontSize="small" />
        </IconButton>
      ))}
      <IconButton
        size="small"
        onClick={() => onChange('')}
        aria-label={title ? `${title}: no icon` : 'no icon'}
        title={title ? `${title}: no icon` : 'no icon'}
        sx={() => ({ marginInlineStart: 1, '&:hover': { transform: 'scale(1.06)' } })}
      >
        ✖️
      </IconButton>
    </Box>
  );
}
