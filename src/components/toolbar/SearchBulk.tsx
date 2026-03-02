import * as React from 'react';
import { Box, TextField, MenuItem, Button, InputAdornment, IconButton } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  filterText: string;
  onFilterChange: (text: string) => void;
  bulkMode: boolean;
  selectedCount: number;
  onBulkComplete: () => void;
  onBulkDelete: () => void;
  onCancelBulk: () => void;
  categories?: { value: string; label: string }[];
  currentCategory?: string;
  onCategoryChange?: (value: string) => void;
}

const SearchBulk: React.FC<Props> = ({
  filterText,
  onFilterChange,
  bulkMode,
  selectedCount,
  onBulkComplete,
  onBulkDelete,
  onCancelBulk,
  categories,
  currentCategory,
  onCategoryChange,
}) => {
  const { t } = useLanguage();
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
        <TextField
          label={t.search.placeholder}
      value={filterText}
      onChange={(e) => onFilterChange(e.target.value)}
      fullWidth
      InputProps={{
        endAdornment: filterText ? (
          <InputAdornment position="end">
            <IconButton
              size="small"
              onClick={() => onFilterChange('')}
              edge="end"
            >
              <ClearIcon />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
    />
      {categories && onCategoryChange && (
        <TextField
          select
          label={t.todos.category}
          value={currentCategory || ''}
          onChange={(e) => onCategoryChange(e.target.value)}
          sx={{ width: 200 }}
          size="small"
        >
          <MenuItem value="">{t.todos.all}</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c.value} value={c.value}>
              {c.label}
            </MenuItem>
          ))}
        </TextField>
      )}
    </Box>
    {bulkMode && (
      <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
        <Button variant="contained" onClick={onBulkComplete} disabled={selectedCount === 0}>
          {t.search.bulkComplete}
        </Button>
        <Button variant="outlined" onClick={onBulkDelete} disabled={selectedCount === 0}>
          {t.search.bulkDelete}
        </Button>
        <Button onClick={onCancelBulk}>{t.search.cancelBulk}</Button>
      </Box>
    )}
  </Box>
  );
};

export default SearchBulk;
