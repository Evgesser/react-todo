import * as React from 'react';
import {
  Box,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Button,
  Menu,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getLuminance } from '@/utils/color';
import { List as ListType } from '@/types';

interface ListToolbarProps {
  lists: ListType[];
  currentListId: string | null;
  onSelectList: (id: string) => void;
  listDefaultColor: string;
  setListDefaultColor: (color: string) => void;
  saveListColor: () => void;
  openNewListDialog: () => void;
  setHistoryOpen: (open: boolean) => void;
  formOpen: boolean;
  toggleForm: () => void;
  bulkMode: boolean;
  toggleBulkMode: () => void;
  handleExit: () => void;
  menuAnchor: HTMLElement | null;
  openMenu: (e: React.MouseEvent<HTMLElement>) => void;
  closeMenu: () => void;
  password?: string;
  setSnackbarMsg: (msg: string) => void;
  setSnackbarOpen: (open: boolean) => void;
  openPersonalDialog: () => void;
  completeCurrentList: () => void;
}

export default function ListToolbar({
  lists,
  currentListId,
  onSelectList,
  listDefaultColor,
  setListDefaultColor,
  saveListColor,
  openNewListDialog,
  setHistoryOpen,
  formOpen,
  toggleForm,
  bulkMode,
  toggleBulkMode,
  handleExit,
  menuAnchor,
  openMenu,
  closeMenu,
  password,
  setSnackbarMsg,
  setSnackbarOpen,
  openPersonalDialog,
  completeCurrentList,
}: ListToolbarProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '7fr 5fr' },
        gap: 1,
        alignItems: 'center',
        mb: 2,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextField
          select
          label="Список"
          value={currentListId || ''}
          onChange={(e) => onSelectList(e.target.value)}
          fullWidth
        >
          {lists
            .filter((l) => !l.completed)
            .map((l) => (
              <MenuItem key={l._id} value={l._id}>
                {l.name}
              </MenuItem>
            ))}
        </TextField>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 1,
          justifyContent: { xs: 'stretch', sm: 'flex-end' },
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <Box>
          <IconButton size="small" onClick={toggleForm}>
            {formOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: 1,
              border: '1px solid rgba(0,0,0,0.12)',
              bgcolor: listDefaultColor,
            }}
          />
          <Tooltip
            title={(() => {
              const lum = getLuminance(listDefaultColor);
              if (lum < 0.2 || lum > 0.8) return 'Контраст хороший';
              return 'Внимание: средний контраст';
            })()}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {(() => {
                const lum = getLuminance(listDefaultColor);
                if (lum < 0.2 || lum > 0.8)
                  return <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: 18 }} />;
                return <ErrorOutlineIcon sx={{ color: 'warning.main', fontSize: 18 }} />;
              })()}
            </Box>
          </Tooltip>
        </Box>

        <TextField
          label="Цвет списка"
          type="color"
          value={listDefaultColor}
          onChange={(e) => setListDefaultColor(e.target.value)}
          sx={{ width: 64 }}
        />
        <Button onClick={saveListColor} sx={{ minWidth: 120 }}>
          Сохранить цвет
        </Button>
        <Button onClick={openNewListDialog} sx={{ minWidth: 120 }}>
          Новый список
        </Button>
        <Button onClick={() => setHistoryOpen(true)} disabled={!lists.some((l) => l.completed)} sx={{ minWidth: 96 }}>
          История
        </Button>
        <Button onClick={() => toggleBulkMode()} sx={{ minWidth: 100 }}>
          {bulkMode ? 'Отмена мн. выбора' : 'Мн. выбор'}
        </Button>
        <Button onClick={handleExit} sx={{ minWidth: 96 }}>
          Выйти
        </Button>
        <IconButton onClick={openMenu} size="small">
          <MoreVertIcon />
        </IconButton>
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
          <MenuItem
            onClick={() => {
              closeMenu();
              openPersonalDialog();
            }}
          >
            Настройки персонализации
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeMenu();
              if (!currentListId) return;
              const link = `${window.location.origin}/?listId=${currentListId}`;
              navigator.clipboard.writeText(link);
              setSnackbarMsg('Ссылка скопирована');
              setSnackbarOpen(true);
            }}
          >
            Поделиться
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeMenu();
              completeCurrentList();
            }}
          >
            Завершить
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}
