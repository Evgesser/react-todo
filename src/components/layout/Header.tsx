import * as React from 'react';
import { Box, Typography, IconButton, Menu, MenuItem, Avatar, Divider } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/router';
import { ColorModeContext } from '@/pages/_app';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import LanguageSwitcher from '../LanguageSwitcher';
import Link from 'next/link';

interface HeaderProps {
  headerColor: string;
  effectiveHeaderTextColor: string;
}

const Header: React.FC<HeaderProps> = ({ headerColor, effectiveHeaderTextColor }) => {
  const theme = useTheme();
  const router = useRouter();
  const colorMode = React.useContext(ColorModeContext);
  const { t } = useLanguage();
  const { userId, username, avatar, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    // Full page reload to reset all state
    window.location.href = '/';
  };
  return (
    <Box sx={{ mb: 1 }}>
      <Box
        sx={{
          height: 8,
          borderRadius: 1,
          bgcolor: headerColor,
          transition: 'background-color 300ms ease',
        }}
      />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mt: 1,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            color: effectiveHeaderTextColor,
            fontWeight: 500,
            textShadow:
              theme.palette.mode === 'dark'
                ? '0 1px 2px rgba(0,0,0,0.6), 0 0 8px rgba(255,255,255,0.02)'
                : '0 1px 2px rgba(0,0,0,0.06)',
          }}
        >
          {t.header.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <LanguageSwitcher />
          <IconButton
            onClick={() => colorMode.toggleColorMode()}
            sx={{
              color: effectiveHeaderTextColor,
              bgcolor:
                theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(0,0,0,0.04)',
              borderRadius: '50%',
              p: 1,
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
                onClick={handleMenuOpen}
                sx={{
                  color: effectiveHeaderTextColor,
                  bgcolor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(0,0,0,0.04)',
                  borderRadius: '50%',
                  p: 1,
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
                  sx={{ width: 32, height: 32, fontSize: '0.75rem' }}
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
                <Divider />
                <MenuItem
                  component={Link}
                  href={`/profile/${userId}`}
                  onClick={handleMenuClose}
                >
                  <PersonIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                  <Typography variant="body2">{t.header.profile}</Typography>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
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
