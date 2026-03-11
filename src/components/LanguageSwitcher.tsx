import * as React from 'react';
import { IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import { useIntl } from 'react-intl';
import useAppStore from '@/stores/useAppStore';
import { Language } from '@/locales';

export default function LanguageSwitcher() {
  const intl = useIntl();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang);
    handleClose();
  };

  const flagMap: Record<string, string> = {
    ru: '🇷🇺',
    en: '🇬🇧',
    he: '🇮🇱',
  };

  return (
    <>
      <Tooltip title={intl.formatMessage({ id: 'header.language' })}>
        <IconButton
          onClick={handleClick}
          color="inherit"
          size="small"
          aria-label={intl.formatMessage({ id: 'header.language' })}
          title={intl.formatMessage({ id: 'header.language' })}
          sx={(t) => ({
            p: 0.75,
            borderRadius: '50%',
            backgroundColor: t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)',
            '&:hover': {
              backgroundColor: t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
            }
          })}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>{flagMap[language] || '🌐'}</span>
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={() => handleSelectLanguage('ru')} selected={language === 'ru'}>
          🇷🇺 Русский
        </MenuItem>
        <MenuItem onClick={() => handleSelectLanguage('en')} selected={language === 'en'}>
          🇬🇧 English
        </MenuItem>
        <MenuItem onClick={() => handleSelectLanguage('he')} selected={language === 'he'}>
          🇮🇱 עברית
        </MenuItem>
      </Menu>
    </>
  );
}
