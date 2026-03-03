import * as React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, useTheme, useMediaQuery } from '@mui/material';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuantityDialogProps {
  open: boolean;
  value: number;
  onChange: (val: number) => void;
  onClose: () => void;
}

export default function QuantityDialog({ open, value, onChange, onClose }: QuantityDialogProps) {
    const { t, language } = useLanguage();
  // temp as string to allow empty field when dialog opens
  const [temp, setTemp] = React.useState<string>(value?.toString() || '');
  // when the dialog opens we always start with an empty input, treat a prop value of 1 as equivalent to no value
  React.useEffect(() => {
    if (open || value === 1) {
      setTemp('');
    } else {
      setTemp(value != null ? value.toString() : '');
    }
  }, [open, value]);
  // always render fullscreen; mobile/desktop both covered
  const fullScreen = true;

  // prevent background content from scrolling when dialog is open (mobile especially)
  React.useEffect(() => {
    const prevent = (e: TouchEvent) => {
      e.preventDefault();
    };

    if (open) {
      document.body.style.overflow = 'hidden';
      // prevent touch scrolling on iOS/Android
      document.body.addEventListener('touchmove', prevent, { passive: false });
    } else {
      document.body.style.overflow = '';
      document.body.removeEventListener('touchmove', prevent);
    }
    return () => {
      document.body.style.overflow = '';
      document.body.removeEventListener('touchmove', prevent);
    };
  }, [open]);

  return (
    <Dialog
      open={open}
      fullScreen={fullScreen}
      /* ignore clicks/escapes so user can't interact outside */
      onClose={(e, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          return;
        }
        onClose();
      }}
      disableEscapeKeyDown
      PaperProps={{ dir: 'ltr' }}
    >
      <DialogTitle>{t.dialogs.quantity.title}</DialogTitle>
      <DialogContent>
        <TextField
          label={t.dialogs.quantity.title}
          type="text"
          /* prevent mobile keyboards by making the field read-only – users enter via the custom keypad */
          inputProps={{ readOnly: true, dir: 'ltr' }}
          value={temp}
          /* avoid autoFocus so the virtual keyboard doesn't trigger on open */
          fullWidth
          sx={{ mb: 2 }}
        />
        {/* numeric keypad as 3×4 grid with backspace/clear */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 48px)',
            gap: 4,
            justifyContent: 'center',
          }}
        >
          {(() => {
            const dec = language === 'ru' ? ',' : '.';
            return ['1','2','3','4','5','6','7','8','9','←','0',dec,'C'];
          })().map((label) => (
            <Button
              key={label}
              size="small"
              variant="outlined"
              onClick={() => {
                if (label === '←') {
                  setTemp((prev) => prev.slice(0, -1));
                } else if (label === 'C') {
                  setTemp('');
                } else if (label === '.') {
                  setTemp((prev) => {
                    if (prev.includes('.') || prev.includes(',')) return prev;
                    return prev === '' ? '0.' : prev + '.';
                  });
                } else {
                  const n = label;
                  setTemp((prev) => prev === '' ? n : prev + n);
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
        {/* action buttons placed directly under keypad */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
          <Button onClick={onClose}>{t.dialogs.quantity.cancel}</Button>
          <Button
            onClick={() => {
              const num = parseFloat(temp.replace(',', '.'));
              onChange(isNaN(num) ? 0 : num);
              onClose();
            }}
            variant="contained"
          >
            {t.dialogs.quantity.save}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}