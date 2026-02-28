import * as React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTheme } from '@mui/material/styles';
import { ColorModeContext } from '@/pages/_app';

interface HeaderProps {
  headerColor: string;
  effectiveHeaderTextColor: string;
}

const Header: React.FC<HeaderProps> = ({ headerColor, effectiveHeaderTextColor }) => {
  const theme = useTheme();
  const colorMode = React.useContext(ColorModeContext);
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
          Список покупок
        </Typography>
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
      </Box>
    </Box>
  );
};

export default Header;
