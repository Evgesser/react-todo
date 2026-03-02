import * as React from 'react';
import { IconButton, Box } from '@mui/material';
import { iconChoices } from '@/constants';

interface Props {
  selected: string;
  onChange: (key: string) => void;
  title?: string;
}

export default function CategoryIconPicker({ selected, onChange, title }: Props) {
  return (
    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }} title={title}>
      {iconChoices.map((ic) => (
        <IconButton
          key={ic.key}
          size="small"
          color={selected === ic.key ? 'primary' : 'default'}
          onClick={() => onChange(ic.key)}
        >
          <ic.icon fontSize="small" />
        </IconButton>
      ))}
      <IconButton
        size="small"
        onClick={() => onChange('')}
        sx={{ ml: 1 }}
        title={title ? `${title}: ${'no icon'}` : 'no icon'}
      >
        ✖️
      </IconButton>
    </Box>
  );
}
