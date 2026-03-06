import * as React from 'react';
import { Box, TextField, Button, IconButton, InputAdornment, Alert } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import RegisterDialog from './dialogs/RegisterDialog';
import useAppStore from '@/stores/useAppStore';
import type { TranslationKeys } from '@/locales/ru';
import type { IntlShape } from 'react-intl';

interface AuthPanelProps {
  t: TranslationKeys;
  formatMessage: (id: string, values?: Parameters<IntlShape['formatMessage']>[1]) => string;
  onSnackbar: (msg: string) => void;
}

export default function AuthPanel({ t, formatMessage, onSnackbar }: AuthPanelProps) {
  const userId = useAppStore((s) => s.userId);
  const error = useAppStore((s) => s.error);
  const clearError = useAppStore((s) => s.clearError);
  const setAuthData = useAppStore((s) => s.setAuthData);
  const loadAvatar = useAppStore((s) => s.loadAvatar);
  const login = useAppStore((s) => s.login);
  const isLoading = useAppStore((s) => s.isLoading);
  const [loginUsername, setLoginUsername] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');
  const [registerDialogOpen, setRegisterDialogOpen] = React.useState(false);

  const handleRegisterSuccess = React.useCallback(
    async (userId: string, username: string) => {
      setRegisterDialogOpen(false);
      setAuthData(userId, username);
      await loadAvatar(userId);
      setLoginUsername('');
      setLoginPassword('');
      onSnackbar(formatMessage('register.success'));
    },
    [setAuthData, loadAvatar, onSnackbar, formatMessage]
  );

  const handleLogin = React.useCallback(async () => {
    clearError();
    const result = await login(loginUsername, loginPassword);
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
  }, [clearError, login, loginUsername, loginPassword, onSnackbar, formatMessage]);

  // enable pressing Enter to submit
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  if (userId) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
      {error && (
        <Alert severity="error" onClose={() => clearError()}>
          {error}
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
      <Button variant="contained" onClick={handleLogin} disabled={isLoading}>
        {isLoading ? t.auth.loading : t.auth.login}
      </Button>

      <RegisterDialog
        open={registerDialogOpen}
        username={loginUsername}
        password={loginPassword}
        onClose={() => setRegisterDialogOpen(false)}
        onRegisterSuccess={handleRegisterSuccess}
        t={t}
      />
    </Box>
  );
}
