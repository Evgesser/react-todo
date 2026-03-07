import { createTheme, ThemeOptions } from "@mui/material/styles";
import { PaletteMode } from "@mui/material";

export function getTheme(mode: PaletteMode) {
  const palette: ThemeOptions['palette'] = {
    mode,
    primary: {
      main: '#3B82F6', // Modern blue
      light: '#60A5FA',
      dark: '#2563EB',
    },
    secondary: {
      main: '#8B5CF6', // Purple base
    },
    background: mode === 'dark'
      ? {
          default: '#000000', // pure black for mobile-style look
          paper: '#1E293B',   // Slate 800
        }
      : {
          default: '#F8FAFC', // Slate 50
          paper: '#FFFFFF',
        },
    text: mode === 'dark'
      ? {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
        }
      : {
          primary: '#0F172A',
          secondary: '#64748B',
        },
  };

  return createTheme({
    palette,
    shape: {
      borderRadius: 16, // Softer, modern corners
    },
    typography: {
      fontFamily: '"Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
      h4: {
        fontSize: '2rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h6: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      button: {
        fontWeight: 600,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 12,
            padding: '8px 16px',
            transition: 'all 0.2s ease-in-out',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.1)',
              transform: 'translateY(-1px)',
            },
          },
          contained: {
            '&:active': {
              boxShadow: 'none',
              transform: 'translateY(0)',
            },
          },
          // primary buttons use a purple-pink gradient like mobile design
          containedPrimary: {
            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
            color: '#ffffff',
            '&:hover': {
              background: 'linear-gradient(135deg, #9333ea 0%, #db2777 100%)',
            },
            '&:active': {
              background: 'linear-gradient(135deg, #7e22ce 0%, #be185d 100%)',
            },
          },
          outlined: {
            borderColor: mode === 'dark' ? 'rgba(255,255,255,0.3)' : undefined,
            color: mode === 'dark' ? '#ffffff' : undefined,
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
            color: '#ffffff',
            boxShadow: 'none',
            '&:hover': {
              background: 'linear-gradient(135deg, #9333ea 0%, #db2777 100%)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: mode === 'dark' ? '#1a1a1a' : undefined,
            boxShadow: mode === 'dark' 
              ? '0 1px 3px rgba(0,0,0,0.3)' 
              : '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            border: `1px solid ${mode === 'dark' ? '#334155' : '#E2E8F0'}`,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: mode === 'dark' 
                ? '0 10px 15px -3px rgba(0,0,0,0.5)' 
                : '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            // darker paper background for dark theme to match mobile card
            backgroundColor: mode === 'dark' ? '#121212' : undefined,
            borderRadius: 16,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'dark' ? '#121212' : undefined,
            borderRadius: 16,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          standardSuccess: {
            // more distinguishable green
            backgroundColor: mode === 'dark' ? '#2e7d32' : '#a5d6a7',
            color: mode === 'dark' ? '#e8f5e9' : '#0b3d0b',
          },
        },
      },
      MuiFilledInput: {
        styleOverrides: {
          underline: {
            '&:before, &:after': {
              borderBottom: 'none !important',
            },
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          margin: 'normal',
          fullWidth: false,
          variant: 'filled', // use filled style for darker inputs
        },
        styleOverrides: {
          root: {
            '& .MuiFilledInput-root': {
              borderRadius: 12,
              backgroundColor: mode === 'dark' ? '#1f1f1f' : '#f5f5f5',
              border: mode === 'dark' ? '1px solid #333' : '1px solid #ccc',
              '&:hover': {
                backgroundColor: mode === 'dark' ? '#272727' : '#e0e0e0',
              },
            },
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              transition: 'box-shadow 0.2s ease',
              '&:hover': {
                boxShadow: mode === 'dark' ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : '0 0 0 2px rgba(59, 130, 246, 0.1)',
              },
              '&.Mui-focused': {
                boxShadow: mode === 'dark' ? '0 0 0 3px rgba(59, 130, 246, 0.3)' : '0 0 0 3px rgba(59, 130, 246, 0.2)',
              }
            },
          },
        },
      },
      MuiFormControl: {
        defaultProps: {
          margin: 'normal',
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            boxShadow: 'none',
            borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#E2E8F0'}`,
            color: mode === 'dark' ? '#F8FAFC' : '#0F172A',
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: mode === 'dark' ? '#475569' : '#CBD5E1',
              borderRadius: '8px',
            },
          },
        },
      },
    },
  });
}
