import * as React from 'react';
import { Box, Typography, IconButton, Menu, MenuItem, Avatar, Divider, Badge } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { useTheme, alpha } from '@mui/material/styles';
import { ColorModeContext } from '@/pages/_app';
import type { HeaderProps } from '@/types/componentProps';
import useAppStore from '@/stores/useAppStore';
import LanguageSwitcher from '../LanguageSwitcher';
import Link from 'next/link';
import { formatDateDDMMYYYY } from '@/utils/formatDate';
import PeopleIcon from '@mui/icons-material/People';
import SharedListsDialog from '../dialogs/SharedListsDialog';

const Header: React.FC<HeaderProps> = ({ headerColor, effectiveHeaderTextColor, t, title }) => {
  const theme = useTheme();
  const colorMode = React.useContext(ColorModeContext);
  const userId = useAppStore((s) => s.userId);
  const username = useAppStore((s) => s.username);
  const avatar = useAppStore((s) => s.avatar);
  const listType = useAppStore((s) => s.listType);
  const setListType = useAppStore((s) => s.setListType);
  const logout = useAppStore((s) => s.logout);
  const reminders = useAppStore((s) => s.reminders);
  const setReminders = useAppStore((s) => s.setReminders);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = React.useState<null | HTMLElement>(null);
  const [sharedListsOpen, setSharedListsOpen] = React.useState(false);
  const open = Boolean(anchorEl);
  const notifOpen = Boolean(notifAnchor);

  React.useEffect(() => {
    if (!userId) {
      setReminders([]);
      return;
    }

    let mounted = true;
    const POLL_INTERVAL_MS = 1000 * 60 * 60 * 2; // 2 hours

    const loadReminders = async () => {
      try {
        const res = await fetch(`/api/reminders/check?userId=${encodeURIComponent(userId)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setReminders(data.reminders);
      } catch {
        // ignore
      }
    };

    loadReminders();
    const intervalId = window.setInterval(loadReminders, POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [userId, setReminders]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotifOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchor(event.currentTarget);
  };

  const handleNotifClose = () => {
    setNotifAnchor(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    // Full page reload to reset all state
    window.location.href = '/';
  };
  return (
    <Box sx={{ mb: 0.5 }}>
      <Box
        sx={{
          height: 6,
          borderRadius: 1,
          bgcolor: alpha(headerColor, 0.85),
          transition: 'background-color 300ms ease',
        }}
      />
      <Box
        className="glass"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mt: 0,
          px: 1,
          py: 0.5,
          borderRadius: 2,
        }}
      >
        <Typography
          variant="h5"
          component="h1"
          sx={{
            color: effectiveHeaderTextColor,
            fontWeight: 500,
            textShadow:
              theme.palette.mode === 'dark'
                ? '0 1px 2px rgba(0,0,0,0.6), 0 0 8px rgba(255,255,255,0.02)'
                : '0 1px 2px rgba(0,0,0,0.06)',
          }}
        >
          {title || t.header.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <LanguageSwitcher />
          <IconButton
            onClick={() => colorMode.toggleColorMode()}
            size="small"
            aria-label={theme.palette.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme.palette.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            sx={{
              color: effectiveHeaderTextColor,
              bgcolor:
                theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(0,0,0,0.04)',
              borderRadius: '50%',
              p: 0.5,
              '&:hover': {
                bgcolor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.06)',
              },
            }}
          >
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>

          {userId && username && (
            <>
              <IconButton
                onClick={handleNotifOpen}
                size="small"
                aria-label={t.header.notifications}
                title={t.header.notifications}
                sx={{
                  color: effectiveHeaderTextColor,
                  bgcolor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(0,0,0,0.04)',
                  borderRadius: '50%',
                  p: 0.5,
                  '&:hover': {
                    bgcolor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,0,0,0.06)',
                  },
                }}
              >
                <Badge badgeContent={reminders.length} color="error">
                  <NotificationsNoneIcon />
                </Badge>
              </IconButton>

              <IconButton
                onClick={() => setSharedListsOpen(true)}
                size="small"
                aria-label={t.lists.sharedWithMe}
                title={t.lists.sharedWithMe}
                sx={{
                  color: effectiveHeaderTextColor,
                  bgcolor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(0,0,0,0.04)',
                  borderRadius: '50%',
                  p: 0.5,
                  ml: 1,
                  '&:hover': {
                    bgcolor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,0,0,0.06)',
                  },
                }}
              >
                <PeopleIcon />
              </IconButton>

              <SharedListsDialog
                open={sharedListsOpen}
                onClose={() => setSharedListsOpen(false)}
                userId={userId}
                t={t}
              />

              <Menu
                anchorEl={notifAnchor}
                open={notifOpen}
                onClose={handleNotifClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem disabled sx={{ py: 1 }}>
                  <Typography variant="body2">{t.header.notifications}</Typography>
                </MenuItem>
                {reminders.length === 0 ? (
                  <MenuItem disabled>
                    <Typography variant="body2">{t.header.noNotifications}</Typography>
                  </MenuItem>
                ) : (
                  <>
                    <MenuItem
                      onClick={() => {
                        setReminders([]);
                        handleNotifClose();
                      }}
                    >
                      <Typography variant="body2">{t.header.markAllRead}</Typography>
                    </MenuItem>
                    {reminders.map((r) => (
                      <MenuItem key={r.todoId} onClick={handleNotifClose}>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {r.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {r.listName} • {formatDateDDMMYYYY(r.reminderAt)}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </>
                )}
              </Menu>
            </>
          )}

          {userId && username && (
            <>
              <IconButton
                onClick={handleMenuOpen}
                size="small"
                aria-label={username ? `Account menu for ${username}` : 'Account menu'}
                title={username ? `Account menu for ${username}` : 'Account menu'}
                sx={{
                  color: effectiveHeaderTextColor,
                  bgcolor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(0,0,0,0.04)',
                  borderRadius: '50%',
                  p: 0.5,
                  '&:hover': {
                    bgcolor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,0,0,0.06)',
                  },
                }}
              >
                <Avatar
                  src={avatar || ''}
                  sx={{ width: 28, height: 28, fontSize: '0.7rem' }}
                >
                  {username.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem disabled sx={{ py: 1 }}>
                  <Typography variant="body2">
                    {username}
                  </Typography>
                </MenuItem>
                {listType ? (
                  <MenuItem
                    onClick={() => {
                      setListType(null);
                      handleMenuClose();
                    }}
                  >
                    <SwapHorizIcon sx={{ marginInlineEnd: 1, fontSize: '1.2rem' }} />
                    <Typography variant="body2">{t.header.changeType}</Typography>
                  </MenuItem>
                ) : null}
                <Divider />
                <MenuItem
                  component={Link}
                  href={`/profile/${userId}`}
                  onClick={handleMenuClose}
                >
                  <PersonIcon sx={{ marginInlineEnd: 1, fontSize: '1.2rem' }} />
                  <Typography variant="body2">{t.header.profile}</Typography>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ marginInlineEnd: 1, fontSize: '1.2rem' }} />
                  <Typography variant="body2">{t.header.logout}</Typography>
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Header;
