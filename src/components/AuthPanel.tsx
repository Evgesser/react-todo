import * as React from 'react';
import { Box, TextField, Button, IconButton, InputAdornment, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';
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
  const theme = useTheme();

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
      if (result.error && result.error === 'messages.userNotFound') {
        setRegisterDialogOpen(true);
      } else {
        const errorMsg = result.error && result.error.startsWith('messages.') ? formatMessage(result.error) : (result.error || formatMessage('auth.loginFailed'));
        onSnackbar(errorMsg);
      }
    }
  }, [clearError, login, loginUsername, loginPassword, onSnackbar, formatMessage]);

  // enable pressing Enter to submit
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  if (userId) return null;

  return (
    <Box
      sx={(t) => ({
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        mb: 2,
        p: 2,
        backgroundColor: t.palette.mode === 'dark' ? 'rgba(2,6,23,0.42)' : 'rgba(255,255,255,0.66)',
        borderRadius: 2,
        backdropFilter: 'blur(6px) saturate(120%)',
      })}
    >
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
        type="password"
        value={loginPassword}
        onChange={(e) => setLoginPassword(e.target.value)}
        fullWidth
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
      <Box sx={{ textAlign: 'right', mt: -1, mb: 1 }}>
        <a href="/forgot-password" style={{ fontSize: 13, color: theme.palette.primary.main, textDecoration: 'underline', cursor: 'pointer' }}>
          {t.auth.forgotPassword}
        </a>
      </Box>
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
