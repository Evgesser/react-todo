import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LinkIcon from '@mui/icons-material/Link';
import { fetchSharedWithMe } from '@/lib/api';
import { formatDateDDMMYYYY } from '@/utils/formatDate';

interface SharedListEntry {
  _id: string;
  name: string;
  shareToken: string;
  ownerName: string;
  viewedAt: string;
  createdAt: string;
}

interface SharedListsDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  t: any;
}

export default function SharedListsDialog({ open, onClose, userId, t }: SharedListsDialogProps) {
  const [lists, setLists] = React.useState<SharedListEntry[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open && userId) {
      setLoading(true);
      fetchSharedWithMe(userId)
        .then(setLists)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, userId]);

  const handleListClick = (token: string) => {
    window.location.href = `/shared?token=${encodeURIComponent(token)}`;
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {t.lists.sharedWithMe || 'Shared with me'}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Typography>{t.auth.loading}</Typography>
        ) : lists.length === 0 ? (
          <Typography align="center" sx={{ py: 4, color: 'text.secondary' }}>
            {t.lists.noSharedLists || 'No shared lists found'}
          </Typography>
        ) : (
          <List>
            {lists.map((item) => (
              <ListItem key={item.shareToken} disablePadding divider>
                <ListItemButton onClick={() => handleListClick(item.shareToken)}>
                  <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                    <LinkIcon color="action" />
                  </Box>
                  <ListItemText
                    primary={item.name}
                    secondary={
                      <React.Fragment>
                        <Typography component="span" variant="body2" color="text.primary">
                          {t.lists.owner || 'Owner'}: {item.ownerName}
                        </Typography>
                        {` — ${formatDateDDMMYYYY(item.createdAt)}`}
                      </React.Fragment>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}
