import * as React from 'react';
import { Snackbar, Alert, Slide } from '@mui/material';

interface Props {
  open: boolean;
  message: string;
  severity?: 'success' | 'info' | 'warning' | 'error';
  onClose: () => void;
}

export default function AppSnackbar({
  open,
  message,
  severity = 'success',
  onClose,
}: Props) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      TransitionComponent={(props) => <Slide {...props} direction="up" />}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="standard"
        role="status"
        sx={{
          width: '100%',
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
