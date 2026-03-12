import { createTheme, ThemeOptions } from "@mui/material/styles";
import { PaletteMode } from "@mui/material";

export function getTheme(mode: PaletteMode, direction: 'ltr' | 'rtl' = 'ltr') {
  const palette: ThemeOptions['palette'] = {
    mode,
    primary: {
      main: '#3B82F6', // modern blue
      light: '#60A5FA',
      dark: '#1E40AF',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F59E0B', // amber
      light: '#FCD34D',
      dark: '#D97706',
      contrastText: '#0F172A',
    },
    info: {
      main: '#06B6D4', // cyan
      light: '#22D3EE',
      dark: '#0891B2',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#10B981', // emerald
      light: '#34D399',
      dark: '#059669',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#F97316', // orange
      light: '#FB923C',
      dark: '#EA580C',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#EF4444', // red
      light: '#F87171',
      dark: '#DC2626',
      contrastText: '#FFFFFF',
    },
    background: mode === 'dark'
      ? {
          default: '#0F172A', // dark slate
          paper: '#1E293B',   // Slate 800
        }
      : {
          default: '#FEFEFE', // almost white
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
    direction,
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
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            direction: 'ltr',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(12px) saturate(160%)',
            WebkitBackdropFilter: 'blur(12px) saturate(160%)',
            border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.4)',
            backgroundImage: 'none',
            borderRadius: 16,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(12px) saturate(160%)',
            WebkitBackdropFilter: 'blur(12px) saturate(160%)',
            borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.3)',
            color: mode === 'dark' ? '#F8FAFC' : '#0F172A',
            boxShadow: 'none',
          },
        },
      },
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
            background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
            color: '#FFFFFF',
            '&:hover': {
              background: 'linear-gradient(135deg, #2B6FD8 0%, #4F9AF8 100%)',
            },
            '&:active': {
              background: 'linear-gradient(135deg, #1E40AF 0%, #3B6FE6 100%)',
            },
          },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: ({ theme }) => ({
            justifyContent: theme.direction === 'rtl' ? 'flex-start' : 'flex-end',
            padding: '16px 24px',
            // Ensure space between buttons in RTL
            '& > :not(:first-of-type)': {
              marginLeft: theme.direction === 'rtl' ? 0 : theme.spacing(1),
              marginRight: theme.direction === 'rtl' ? theme.spacing(1) : 0,
            },
          }),
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
          size: 'small',
        },
        styleOverrides: {
          root: ({ theme }) => ({
            '& .MuiInputLabel-root': {
              transformOrigin: theme.direction === 'rtl' ? 'right' : 'left',
              left: theme.direction === 'rtl' ? 'auto' : 0,
              right: theme.direction === 'rtl' ? 0 : 'auto',
              // labels were "anywhere", locking them to consistent top/start alignment
              '&[data-shrink="false"]': {
                transform: theme.direction === 'rtl' ? 'translate(-14px, 9px) scale(1)' : 'translate(14px, 9px) scale(1)',
              },
            },
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              // placeholder was not centered
              '& input::placeholder': {
                textAlign: theme.direction === 'rtl' ? 'right' : 'left',
                opacity: 0.6,
              },
            },
          }),
        },
      },
      MuiInputAdornment: {
        styleOverrides: {
          root: ({ theme }) => ({
            // ensure adornments don't overlap text in RTL
            marginLeft: theme.direction === 'rtl' ? theme.spacing(1) : 0,
            marginRight: theme.direction === 'rtl' ? 0 : theme.spacing(1),
          }),
        },
      },
      MuiButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            textTransform: 'none',
            borderRadius: 12,
            padding: '8px 16px',
            transition: 'all 0.2s ease-in-out',
            boxShadow: 'none',
            // fix for icon sticking to text
            '& .MuiButton-startIcon': {
              marginLeft: theme.direction === 'rtl' ? theme.spacing(1) : theme.spacing(-0.5),
              marginRight: theme.direction === 'rtl' ? theme.spacing(-0.5) : theme.spacing(1),
            },
            '& .MuiButton-endIcon': {
              marginLeft: theme.direction === 'rtl' ? theme.spacing(-0.5) : theme.spacing(1),
              marginRight: theme.direction === 'rtl' ? theme.spacing(1) : theme.spacing(-0.5),
            },
            '&:hover': {
              boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.1)',
              transform: 'translateY(-1px)',
            },
          }),
          contained: {
            '&:active': {
              boxShadow: 'none',
              transform: 'translateY(0)',
            },
          },
          containedPrimary: {
            background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
            color: '#FFFFFF',
            '&:hover': {
              background: 'linear-gradient(135deg, #2B6FD8 0%, #4F9AF8 100%)',
            },
            '&:active': {
              background: 'linear-gradient(135deg, #1E40AF 0%, #3B6FE6 100%)',
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
            background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
            color: '#FFFFFF',
            boxShadow: '0 6px 18px rgba(59,130,246,0.18)',
            '&:hover': {
              background: 'linear-gradient(135deg, #2B6FD8 0%, #4F9AF8 100%)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: mode === 'dark' ? 'rgba(2,6,23,0.5)' : 'rgba(255,255,255,0.36)',
            backdropFilter: 'saturate(180%) blur(8px)',
            WebkitBackdropFilter: 'saturate(180%) blur(8px)',
            boxShadow: mode === 'dark'
              ? '0 6px 20px rgba(2,6,23,0.6)'
              : '0 8px 30px rgba(2,6,23,0.06)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)'}`,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: mode === 'dark'
                ? '0 15px 30px rgba(2,6,23,0.6)'
                : '0 12px 30px rgba(2,6,23,0.08)',
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'dark' ? 'rgba(15,23,42,0.5)' : 'rgba(255,255,255,0.5)',
            backdropFilter: 'saturate(160%) blur(10px)',
            WebkitBackdropFilter: 'saturate(160%) blur(10px)',
            borderRadius: 16,
            border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)'}`,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          standardSuccess: {
            // slightly lighter green for snackbars (improves visibility)
            backgroundColor: mode === 'dark' ? '#388e3c' : '#bbf7d0',
            color: mode === 'dark' ? '#e8f5e9' : '#064e3b',
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
          variant: 'outlined',
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
            // ensure input text, placeholder and labels are visible in dark mode
            '& .MuiFilledInput-input': {
              color: mode === 'dark' ? '#F8FAFC' : undefined,
              '&::placeholder': {
                color: mode === 'dark' ? 'rgba(248,250,252,0.6)' : undefined,
              },
            },
            '& .MuiOutlinedInput-input': {
              color: mode === 'dark' ? '#F8FAFC' : undefined,
              '&::placeholder': {
                color: mode === 'dark' ? 'rgba(248,250,252,0.6)' : undefined,
              },
            },
            '& .MuiInputLabel-root': {
              color: mode === 'dark' ? '#F8FAFC' : undefined,
            },
            '& .MuiInputLabel-root.Mui-focused, & .MuiInputLabel-root.MuiInputLabel-shrink': {
              color: mode === 'dark' ? '#F8FAFC' : undefined,
            },
          },
        },
      },
      MuiFormControl: {
        defaultProps: {
          margin: 'normal',
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            borderRadius: 8,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.8)',
              transform: 'scale(1.05)',
            },
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            minHeight: '100vh',
            background: mode === 'dark'
                ? 'url("/bg-dark.jpg") fixed center/cover'
                  : 'url("/bg-light.jpg") fixed center/cover',
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
