import { useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Card, CardContent, Typography, TextField, Button, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const token = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setMessage(data.message);
    setLoading(false);
    if (res.ok) setTimeout(() => router.push('/'), 2000);
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <Card sx={{ minWidth: 340, maxWidth: 400, width: '100%', p: 1, boxShadow: 3, borderRadius: 2, background: theme.palette.mode === 'dark' ? 'rgba(2,6,23,0.42)' : 'rgba(255,255,255,0.66)' }}>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>
            Сброс пароля
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              type="password"
              label="Новый пароль"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              fullWidth
              autoFocus
            />
            <Button type="submit" variant="contained" color="primary" disabled={loading} fullWidth>
              {loading ? 'Сохраняем...' : 'Сохранить пароль'}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              disabled={loading}
              fullWidth
              sx={{ mt: 1 }}
              onClick={() => router.push('/')}
            >
              На главную
            </Button>
            {message && <Alert severity={message.includes('успешно') ? 'success' : 'info'} sx={{ mt: 1 }}>{message}</Alert>}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
