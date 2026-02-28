import * as React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';

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