import { createTheme, ThemeOptions } from "@mui/material/styles";
import { PaletteMode } from "@mui/material";

export function getTheme(mode: PaletteMode) {
  const palette: ThemeOptions['palette'] = {
    mode,
    primary: {
      // user-requested main color
      main: '#2196f3',
    },
    secondary: {
      main: '#4dabf5',
    },
    background: mode === 'dark'
      ? {
          default: '#121212',
          paper: '#1e1e1e',
        }
      : {
          default: '#f5f5f5',
          paper: '#ffffff',
        },
  };

  return createTheme({
    palette,
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: 'Roboto, Arial, sans-serif',
      h4: {
        fontSize: '2.25rem',
        fontWeight: 600,
        letterSpacing: '0.5px',
      },
      h6: {
        fontWeight: 500,
      },
      body1: {
        fontSize: '1rem',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'scale(1.02)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            },
          },
        },
      },
    },
  });
}
