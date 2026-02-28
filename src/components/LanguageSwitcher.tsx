import * as React from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectLanguage = (lang: 'ru' | 'en') => {
    setLanguage(lang);
    handleClose();
  };

  return (
    <>
      <IconButton onClick={handleClick} color="inherit" size="small">
        <LanguageIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem
          onClick={() => handleSelectLanguage('ru')}
          selected={language === 'ru'}
        >
          🇷🇺 Русский
        </MenuItem>
        <MenuItem
          onClick={() => handleSelectLanguage('en')}
          selected={language === 'en'}
        >
          🇬🇧 English
        </MenuItem>
      </Menu>
    </>
  );
}
