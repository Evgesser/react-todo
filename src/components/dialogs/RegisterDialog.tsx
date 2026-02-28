import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
  Typography,
} from '@mui/material';
import { useLanguage } from '@/contexts/LanguageContext';

interface RegisterDialogProps {
  open: boolean;
  username: string;
  password: string;
  onClose: () => void;
  onRegisterSuccess: (userId: string, username: string) => void;
}

export default function RegisterDialog({
  open,
  username,
  password,
  onClose,
  onRegisterSuccess,
}: RegisterDialogProps) {
  const { t } = useLanguage();
  const [captchaQuestion, setCaptchaQuestion] = React.useState<string>('');
  const [captchaAnswer, setCaptchaAnswer] = React.useState<string>('');
  const [error, setError] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(false);

  // Load captcha question when dialog opens
  React.useEffect(() => {
    if (open && username) {
      // Reset state when opening
      setCaptchaAnswer('');
      setError('');
      setCaptchaQuestion('');
      
      fetch(`/api/auth/captcha?username=${encodeURIComponent(username)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.question) {
            setCaptchaQuestion(data.question);
          }
        })
        .catch((err) => {
          console.error('Failed to load captcha:', err);
          setError('Failed to load captcha');
        });
    }
  }, [open, username]);

  const handleRegister = async () => {
    setError('');
    
    if (!captchaAnswer || isNaN(Number(captchaAnswer))) {
      setError(t.register.captchaError);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          captchaAnswer: Number(captchaAnswer),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.error === 'User already exists') {
          setError(t.register.userExists);
        } else if (errorData.error === 'Incorrect captcha answer') {
          setError(t.register.captchaError);
        } else {
          setError(errorData.error || 'Registration failed');
        }
        return;
      }

      const data = await res.json();
      // Reset form state
      setCaptchaAnswer('');
      setError('');
      // Don't call onClose here - parent will handle it in onRegisterSuccess
      onRegisterSuccess(data.userId, data.username);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCaptchaAnswer('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t.register.title}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Typography variant="body1" sx={{ mb: 3 }}>
            {t.auth.userNotFound}
          </Typography>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t.register.captchaLabel}
          </Typography>
          
          <Typography variant="h5" sx={{ mb: 2, fontFamily: 'monospace', fontWeight: 'bold' }}>
            {captchaQuestion}
          </Typography>

          <TextField
            label={t.register.captchaPlaceholder}
            type="number"
            value={captchaAnswer}
            onChange={(e) => setCaptchaAnswer(e.target.value)}
            fullWidth
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleRegister();
              }
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          {t.register.cancel}
        </Button>
        <Button
          onClick={handleRegister}
          variant="contained"
          disabled={isLoading || !captchaAnswer}
        >
          {isLoading ? t.register.registering : t.register.register}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
