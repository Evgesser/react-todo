import * as React from 'react';
import { Box, TextField, Button } from '@mui/material';

interface Props {
  filterText: string;
  onFilterChange: (text: string) => void;
  bulkMode: boolean;
  selectedCount: number;
  onBulkComplete: () => void;
  onBulkDelete: () => void;
  onCancelBulk: () => void;
}

const SearchBulk: React.FC<Props> = ({
  filterText,
  onFilterChange,
  bulkMode,
  selectedCount,
  onBulkComplete,
  onBulkDelete,
  onCancelBulk,
}) => (
  <Box sx={{ mb: 2 }}>
    <TextField
      label="Поиск"
      value={filterText}
      onChange={(e) => onFilterChange(e.target.value)}
      fullWidth
    />
    {bulkMode && (
      <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
        <Button variant="contained" onClick={onBulkComplete} disabled={selectedCount === 0}>
          Пометить выполненными
        </Button>
        <Button variant="outlined" onClick={onBulkDelete} disabled={selectedCount === 0}>
          Удалить выбранные
        </Button>
        <Button onClick={onCancelBulk}>Отменить</Button>
      </Box>
    )}
  </Box>
);

export default SearchBulk;
