import * as React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box } from '@mui/material';

interface QuantityDialogProps {
  open: boolean;
  value: number;
  onChange: (val: number) => void;
  onClose: () => void;
}

export default function QuantityDialog({ open, value, onChange, onClose }: QuantityDialogProps) {
  const [temp, setTemp] = React.useState<number>(value || 1);
  React.useEffect(() => setTemp(value || 1), [value]);
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Количество</DialogTitle>
      <DialogContent>
        {/* numeric keypad as 3×4 grid with backspace/clear */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 48px)',
            gap: 4,
            mb: 2,
            justifyContent: 'center',
          }}
        >
          {['1','2','3','4','5','6','7','8','9','←','0','C'].map((label) => (
            <Button
              key={label}
              size="small"
              variant="outlined"
              onClick={() => {
                if (label === '←') {
                  setTemp((prev) => Math.floor(prev / 10));
                } else if (label === 'C') {
                  setTemp(0);
                } else {
                  const n = parseInt(label, 10);
                  setTemp((prev) => {
                    if (prev === 0) return n;
                    const appended = parseInt(`${prev}${n}`, 10);
                    return appended;
                  });
                }
              }}
              sx={{
                width: 44,
                minWidth: 44,
                height: 32,
                fontSize: '0.875rem',
                bgcolor: 'background.paper',
                borderColor: 'grey.400',
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              {label}
            </Button>
          ))}
        </Box>
        <TextField
          label="Количество"
          type="number"
          autoFocus
          value={temp}
          onChange={(e) => setTemp(parseInt(e.target.value) || 1)}
          inputProps={{ min: 1 }}
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button
          onClick={() => {
            onChange(temp || 1);
            onClose();
          }}
          variant="contained"
        >
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
}