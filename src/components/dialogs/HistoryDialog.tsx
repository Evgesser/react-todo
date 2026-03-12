import * as React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem, ListItemButton, ListItemText, Grow, useTheme, useMediaQuery } from '@mui/material';
import { List as ListType } from '@/types';
import useAppStore from '@/stores/useAppStore';
import type { TranslationKeys } from '@/locales/ru';

interface HistoryDialogProps {
  open: boolean;
  lists: ListType[];
  onSelect: (l: ListType) => void;
  onClose: () => void;
  loading?: boolean;
  t: TranslationKeys;
}

export default function HistoryDialog({ open, lists, onSelect, onClose, t }: HistoryDialogProps) {
  const language = useAppStore((s) => s.language);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen} PaperProps={{ className: 'glass' }}>
      <DialogTitle>{t.dialogs.history.title}</DialogTitle>
      <DialogContent>
        <List>
          {lists
            .filter((l) => l.completed)
            .map((l) => (
              <Grow key={l._id} in timeout={300}>
                <ListItem>
                  <ListItemButton
                    onClick={() => {
                      onSelect(l);
                    }}
                    aria-label={`${t.dialogs.history.view}: ${l.name}`}
                  >
                    <ListItemText
                      primary={l.name}
                      secondary={
                        l.finishedAt
                          ? new Date(l.finishedAt).toLocaleString(language === 'he' ? 'he-IL' : language === 'en' ? 'en-US' : 'ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''
                      }
                    />
                  </ListItemButton>
                </ListItem>
              </Grow>
            ))}
        </List>
      </DialogContent>
      <DialogActions sx={{ justifyContent: theme.direction === 'rtl' ? 'flex-start' : 'flex-end' }}>
        <Button onClick={onClose} variant="outlined">{t.dialogs.history.close}</Button>
      </DialogActions>
    </Dialog>
  );
}