import { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setMessage(data.message);
    setLoading(false);
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <Card sx={{ minWidth: 340, maxWidth: 400, width: '100%', p: 1, boxShadow: 3, borderRadius: 2, background: theme.palette.mode === 'dark' ? 'rgba(2,6,23,0.42)' : 'rgba(255,255,255,0.66)' }}>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>
            Восстановление пароля
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              type="email"
              label="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              fullWidth
              autoFocus
            />
            <Button type="submit" variant="contained" color="primary" disabled={loading} fullWidth>
              {loading ? 'Отправка...' : 'Отправить ссылку'}
            </Button>
            {message && <Alert severity="info" sx={{ mt: 1 }}>{message}</Alert>}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
