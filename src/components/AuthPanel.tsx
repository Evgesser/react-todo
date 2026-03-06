import * as React from 'react';
import { Box, TextField, Button, IconButton, InputAdornment, Alert } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import RegisterDialog from './dialogs/RegisterDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { TranslationKeys } from '@/locales/ru';

interface AuthPanelProps {
  t: TranslationKeys;
  onSnackbar: (msg: string) => void;
}

export default function AuthPanel({ t, onSnackbar }: AuthPanelProps) {
  const auth = useAuth();
  const { formatMessage } = useLanguage();
  const [loginUsername, setLoginUsername] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');
  const [registerDialogOpen, setRegisterDialogOpen] = React.useState(false);

  const handleRegisterSuccess = React.useCallback(
    async (userId: string, username: string) => {
      setRegisterDialogOpen(false);
      auth.setAuthData(userId, username);
      await auth.loadAvatar(userId);
      setLoginUsername('');
      setLoginPassword('');
      onSnackbar(formatMessage('register.success'));
    },
    [auth, onSnackbar, formatMessage]
  );

  const handleLogin = React.useCallback(async () => {
    auth.clearError();
    const result = await auth.login(loginUsername, loginPassword);
    if (result.success) {
      setLoginUsername('');
      setLoginPassword('');
    } else {
      if (result.error && result.error.includes('User not found')) {
        setRegisterDialogOpen(true);
      } else {
        onSnackbar(result.error || formatMessage('auth.loginFailed'));
      }
    }
  }, [auth, loginUsername, loginPassword, onSnackbar, formatMessage]);

  // enable pressing Enter to submit
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  if (auth.userId) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
      {auth.error && (
        <Alert severity="error" onClose={() => auth.clearError()}>
          {auth.error}
        </Alert>
      )}
      <TextField
        label={t.auth.username}
        placeholder={t.auth.usernamePlaceholder}
        value={loginUsername}
        onChange={(e) => setLoginUsername(e.target.value)}
        fullWidth
        onKeyPress={handleKeyPress}
        InputProps={{
          endAdornment: loginUsername ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => setLoginUsername('')}
                edge="end"
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />
      <TextField
        label={t.auth.password}
        placeholder={t.auth.passwordPlaceholder}
        value={loginPassword}
        onChange={(e) => setLoginPassword(e.target.value)}
        fullWidth
        type="password"
        onKeyPress={handleKeyPress}
        InputProps={{
          endAdornment: loginPassword ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => setLoginPassword('')}
                edge="end"
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />
      <Button variant="contained" onClick={handleLogin} disabled={auth.isLoading}>
        {auth.isLoading ? t.auth.loading : t.auth.login}
      </Button>

      <RegisterDialog
        open={registerDialogOpen}
        username={loginUsername}
        password={loginPassword}
        onClose={() => setRegisterDialogOpen(false)}
        onRegisterSuccess={handleRegisterSuccess}
      />
    </Box>
  );
}
