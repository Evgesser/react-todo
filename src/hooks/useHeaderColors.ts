import { useTheme } from '@mui/material/styles';
import { getLuminance, getTextColor } from '@/utils/color';

interface HeaderColors {
  headerTextColor: string;
  effectiveHeaderTextColor: string;
}

/**
 * Determine an appropriate text color for a header bar given its background
 * color and current theme.  Also return a version that accounts for an open
 * menu anchor (makes text more visible when menu is shown).
 */
export function useHeaderColors(headerColor: string, menuAnchor: HTMLElement | null): HeaderColors {
  const theme = useTheme();
  const themeBg =
    (theme.palette.background?.default as string) ||
    (theme.palette.mode === 'dark' ? '#121212' : '#ffffff');
  const bgLum =
    themeBg && themeBg.startsWith('#')
      ? getLuminance(themeBg)
      : theme.palette.mode === 'dark'
      ? 0
      : 1;
  const headerLum = getLuminance(headerColor);

  let headerTextColor =
    theme.palette.getContrastText ? theme.palette.getContrastText(headerColor) : getTextColor(headerColor);
  const LIGHT_WHITE = 'rgba(255,255,255,0.95)';
  if (!headerTextColor) headerTextColor = getTextColor(headerColor);

  if (Math.abs(headerLum - bgLum) < 0.35) {
    headerTextColor = bgLum > 0.5 ? '#000000' : theme.palette.mode === 'dark' ? LIGHT_WHITE : '#ffffff';
  } else {
    if ((headerTextColor === '#fff' || headerTextColor === '#ffffff') && theme.palette.mode === 'dark')
      headerTextColor = LIGHT_WHITE;
  }

  if (theme.palette.mode === 'light') {
    try {
      const ht = (headerTextColor || '').toString().toLowerCase();
      if (
        ht === '#fff' ||
        ht === '#ffffff' ||
        ht === 'white' ||
        ht === LIGHT_WHITE.toLowerCase()
      ) {
        headerTextColor = 'rgba(0,0,0,0.87)';
      }
    } catch {
      headerTextColor = 'rgba(0,0,0,0.87)';
    }
  }

  const headerTextIsHex = typeof headerTextColor === 'string' && headerTextColor.startsWith('#');
  const headerTextLum = headerTextIsHex ? getLuminance(headerTextColor) : null;
  if (headerTextLum === null || Math.abs((headerTextLum || 0) - bgLum) < 0.32) {
    headerTextColor = theme.palette.text.primary;
  }

  const menuActiveHeaderColor =
    theme.palette.mode === 'light' ? 'rgba(0,0,0,0.87)' : LIGHT_WHITE;
  const effectiveHeaderTextColor = menuAnchor ? menuActiveHeaderColor : headerTextColor;

  return { headerTextColor, effectiveHeaderTextColor };
}
