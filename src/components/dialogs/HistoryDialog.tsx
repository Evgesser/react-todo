import * as React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem, ListItemButton, ListItemText, Grow } from '@mui/material';
import { List as ListType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface HistoryDialogProps {
  open: boolean;
  lists: ListType[];
  onSelect: (l: ListType) => void;
  onClose: () => void;
}

export default function HistoryDialog({ open, lists, onSelect, onClose }: HistoryDialogProps) {
  const { t, language } = useLanguage();
  return (
    <Dialog open={open} onClose={onClose} fullWidth>
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
                  >
                    <ListItemText
                      primary={l.name}
                      secondary={
                        l.finishedAt
                          ? new Date(l.finishedAt).toLocaleString(language === 'en' ? 'en-US' : 'ru-RU', {
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
      <DialogActions>
        <Button onClick={onClose}>{t.dialogs.history.close}</Button>
      </DialogActions>
    </Dialog>
  );
}