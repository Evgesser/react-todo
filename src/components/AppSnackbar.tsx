
import * as React from 'react';
import { Snackbar, Alert, Slide } from '@mui/material';
import type { AppSnackbarProps } from '@/types/componentProps';

export default function AppSnackbar({
  open,
  message,
  severity = 'success',
  onClose,
}: AppSnackbarProps) {
  const handleClose = (_event?: Event | React.SyntheticEvent, reason?: string) => {
    if (reason === 'clickaway') return;
    onClose();
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={2000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      TransitionComponent={(props) => <Slide {...props} direction="down" />}
      sx={{
        top: 'calc(env(safe-area-inset-top) + 8px)',
        pointerEvents: 'none',
      }}
    >
      <Alert
        onClose={() => onClose()}
        severity={severity}
        variant="standard"
        role="status"
        sx={{
          width: 'auto',
          maxWidth: 'min(560px, calc(100vw - 24px))',
          pointerEvents: 'auto',
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(2,6,23,0.08)',
          bgcolor: 'background.paper',
          color: 'text.primary',
          px: 2,
          py: 1,
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
