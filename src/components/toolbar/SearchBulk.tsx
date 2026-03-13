import * as React from 'react';
import {
  Box,
  TextField,
  Button,
  IconButton,
  Tooltip,
  InputAdornment,
  Menu,
  MenuItem,
  FormControl,
  Select,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { Category } from '@/constants';
import type { SearchBulkProps } from '@/types/componentProps';

const SearchBulk: React.FC<SearchBulkProps> = ({
  t,
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
  return (
    <Box sx={(t) => ({ mb: 1, p: 0.5, borderRadius: 2, backgroundColor: t.palette.mode === 'dark' ? alpha(t.palette.background.paper, 0.08) : alpha(t.palette.background.paper, 0.6), backdropFilter: 'blur(8px) saturate(130%)' })}>
      <Box sx={{ display: 'flex', gap: 1, mb: 0.5, alignItems: 'center' }}>
        <TextField
          size="small"
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
              aria-label={`Clear ${t.search.placeholder}`}
              title={`Clear ${t.search.placeholder}`}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {c.icon ? React.createElement(c.icon, { fontSize: 'small' }) : null}
                <Box>{c.label}</Box>
              </Box>
            </MenuItem>
          ))}
        </TextField>
      )}
    </Box>
    {bulkMode && (
      <Box sx={{ mt: 0.5, display: 'flex', gap: 1 }}>
        <Button size="small" variant="contained" color="primary" onClick={onBulkComplete} disabled={selectedCount === 0} sx={{ minWidth: 100 }}>
          {t.search.bulkComplete}
        </Button>
        <Button size="small" variant="outlined" onClick={onBulkDelete} disabled={selectedCount === 0} sx={{ minWidth: 100 }}>
          {t.search.bulkDelete}
        </Button>
        <Button size="small" color="inherit" onClick={onCancelBulk}>{t.search.cancelBulk}</Button>
      </Box>
    )}
  </Box>
  );
};

export default SearchBulk;
