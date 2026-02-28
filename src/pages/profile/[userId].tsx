import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Avatar,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  fetchUserProfile,
  updateUserProfile,
  changePassword,
  deleteUserAccount,
  UserProfile,
} from '@/lib/api';

interface DialogState {
  type: 'delete' | 'changePassword' | null;
  open: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const auth = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');

  // Dialog state
  const [dialog, setDialog] = useState<DialogState>({ type: null, open: false });
  const [deletePassword, setDeletePassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const userId = router.query.userId as string;

  const fetchProfile = async (id: string) => {
    try {
      setLoading(true);
      const data = await fetchUserProfile(id);
      setProfile(data);
      setEmail(data.email || '');
      setBio(data.bio || '');
      setAvatar(data.avatar || '');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchProfile(userId);
  }, [userId]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const data = await updateUserProfile(userId, { email, bio, avatar });
      setProfile(data);
      
      // Update auth hook with new avatar
      await auth.loadAvatar(userId);
      
      setEditing(false);
      setSuccess(t.profile.profileUpdated);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError(t.profile.passwordsDoNotMatch);
      return;
    }

    try {
      setLoading(true);
      await changePassword(userId, currentPassword, newPassword);
      setDialog({ type: null, open: false });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(t.profile.passwordChanged);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error changing password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      await deleteUserAccount(userId, deletePassword);
      setDialog({ type: null, open: false });
      setDeletePassword('');
      
      // Logout and clear all auth data
      auth.logout();
      
      // Show success briefly
      setSuccess(t.profile.accountDeleted);
      
      // Full page reload to reset everything and show login
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting account');
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">Profile not found</Alert>
      </Container>
    );
  }

  return (
    <>
      <Head>
        <title>{profile.username} - Profile</title>
      </Head>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 2 }}>
          <IconButton
            onClick={() => router.push('/')}
            sx={{ color: 'text.primary' }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Box>
        <Paper sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Avatar Section */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                src={avatar}
                sx={{ width: 120, height: 120, mb: 2 }}
              >
                {profile.username.charAt(0).toUpperCase()}
              </Avatar>
              {editing && (
                <Button variant="outlined" component="label" size="small">
                  {t.profile.changeAvatar}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleAvatarChange}
                  />
                </Button>
              )}
            </Box>

            {/* Profile Info */}
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography variant="h5" gutterBottom>
                {profile.username}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {t.profile.memberSince} {new Date(profile.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Editable Fields */}
          {editing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label={t.profile.email}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
              />
              <TextField
                label={t.profile.bio}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                fullWidth
                multiline
                rows={3}
                helperText={`${bio.length}/500`}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleSaveProfile}
                  disabled={loading}
                >
                  {t.profile.saveChanges}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setEditing(false);
                    setEmail(profile.email || '');
                    setBio(profile.bio || '');
                  }}
                  disabled={loading}
                >
                  {t.buttons.cancel}
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  {t.profile.email}
                </Typography>
                <Typography>{profile.email || t.profile.notSet}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  {t.profile.bio}
                </Typography>
                <Typography>{profile.bio || t.profile.notSet}</Typography>
              </Box>
              <Button
                variant="contained"
                onClick={() => setEditing(true)}
              >
                {t.profile.editProfile}
              </Button>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Account Actions */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              color="warning"
              onClick={() => setDialog({ type: 'changePassword', open: true })}
            >
              {t.profile.changePassword}
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDialog({ type: 'delete', open: true })}
            >
              {t.profile.deleteAccount}
            </Button>
          </Box>
        </Paper>
      </Container>

      {/* Change Password Dialog */}
      <Dialog
        open={dialog.type === 'changePassword' && dialog.open}
        onClose={() => setDialog({ type: null, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t.profile.changePassword}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label={t.profile.currentPassword}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            fullWidth
          />
          <TextField
            label={t.profile.newPassword}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
          />
          <TextField
            label={t.profile.confirmPassword}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ type: null, open: false })}>{t.buttons.cancel}</Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            disabled={loading}
          >
            {t.buttons.save}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog
        open={dialog.type === 'delete' && dialog.open}
        onClose={() => setDialog({ type: null, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>{t.profile.deleteAccount}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <Alert severity="error">
            {t.profile.deleteWarning}
          </Alert>
          <TextField
            label={t.profile.enterPasswordToConfirm}
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ type: null, open: false })}>{t.buttons.cancel}</Button>
          <Button
            onClick={handleDeleteAccount}
            variant="contained"
            color="error"
            disabled={loading}
          >
            {t.profile.deleteAccount}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
