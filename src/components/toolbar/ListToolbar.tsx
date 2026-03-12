import type { TranslationKeys } from '@/locales/ru';
import { List as ListType } from '@/types';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  MenuItem,
  Skeleton,
  TextField
} from '@mui/material';
import * as React from 'react';
import type { IntlShape } from 'react-intl';

interface ListToolbarProps {
  lists: ListType[];
  currentListId: string | null;
  onSelectList: (id: string) => void;
  listsLoading?: boolean;
  listDefaultColor: string;
  setListDefaultColor: (color: string) => void;
  saveListColor: () => void;
  openNewListDialog: () => void;
  setHistoryOpen: (open: boolean) => void;
  formOpen: boolean;
  bulkMode: boolean;
  toggleBulkMode: () => void;
  menuAnchor: HTMLElement | null;
  openMenu: (e: React.MouseEvent<HTMLElement>) => void;
  closeMenu: () => void;
  setSnackbarMsg: (msg: string) => void;
  setSnackbarOpen: (open: boolean) => void;
  openPersonalDialog: () => void;
  completeCurrentList: () => void;
  // new helper for share functionality
  updateShareToken: (id: string, token: string) => Promise<void>;
  t: TranslationKeys;
  formatMessage: (id: string, values?: Parameters<IntlShape['formatMessage']>[1]) => string;
}

export default function ListToolbar({
  lists,
  currentListId,
  onSelectList,
  listsLoading = false,
  openNewListDialog,
  setHistoryOpen,
  bulkMode,
  toggleBulkMode,
  menuAnchor,
  openMenu,
  closeMenu,
  setSnackbarMsg,
  setSnackbarOpen,
  openPersonalDialog,
  completeCurrentList,
  updateShareToken, // added destructure
  t,
  formatMessage,
}: ListToolbarProps) {
  

  // precompute share token/link when menu opens so copying on click stays within
  // the user gesture (avoid awaiting network calls before clipboard access)
  const [precomputedToken, setPrecomputedToken] = React.useState<string>('');
  const [precomputedLink, setPrecomputedLink] = React.useState<string>('');
  const [shareModalOpen, setShareModalOpen] = React.useState(false);
  const [shareModalLink, setShareModalLink] = React.useState('');
  const [origin, setOrigin] = React.useState<string>('');

  // Initialize origin on client side only to avoid hydration mismatch
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentOrigin = window.location.origin || `${window.location.protocol}//${window.location.host}`;
      setOrigin(currentOrigin);
    }
  }, []);


  const handleOpenMenu = (e: React.MouseEvent<HTMLElement>) => {
    try {
      const tokenFromList = lists.find((l) => l._id === currentListId)?.shareToken || '';
      let token = tokenFromList;
      if (!token && currentListId) {
        const cryptoObj = (globalThis as unknown as { crypto?: { randomUUID?: () => string } }).crypto;
        token = cryptoObj && typeof cryptoObj.randomUUID === 'function'
          ? cryptoObj.randomUUID()
          : Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      }

      const link = token ? `${origin}/shared?token=${encodeURIComponent(token)}` : '';
      
      if (link) {
        setPrecomputedToken(token || '');
        setPrecomputedLink(link || '');
      }
    } catch {
      setPrecomputedToken('');
      setPrecomputedLink('');
    }
    openMenu(e);
  };
    // `t` and `formatMessage` are passed from parent to avoid internal language context subscription
  return (
    <Box
      className="glass"
      sx={(theme) => ({
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '7fr 5fr' },
        gap: 0.25,
        alignItems: 'center',
        mb: 0.25,
        p: 0.5,
        borderRadius: 2,
        // Visual state managed by .glass class
        backgroundImage: theme.palette.mode === 'dark'
          ? 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))'
          : undefined,
      })}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {listsLoading ? (
          <Skeleton variant="rectangular" width="100%" height={48} />
        ) : (
          <>
            <TextField
              size="small"
              select
              variant="outlined"
              label={t.lists.selectList}
              value={currentListId || ''}
              onChange={(e) => onSelectList(e.target.value)}
              fullWidth
              sx={(theme) => ({
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'transparent',
                  borderRadius: 1,
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
                }
              })}
            >
              {lists
                .filter((l) => !l.completed)
                .map((l) => (
                  <MenuItem key={l._id} value={l._id}>
                    {l.name}
                  </MenuItem>
                ))}
            </TextField>
            <IconButton
              size="small"
              onClick={openNewListDialog}
              className="glass"
              sx={(theme) => ({
                marginInlineStart: 0.5,
                color: theme.palette.primary.main,
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  transform: 'scale(1.06)',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
              })}
              aria-label={t.lists.newList}
              title={t.lists.newList}
            >
              <AddIcon />
            </IconButton>
          </>
        )}
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
        {/*
        <TextField
          label={t.lists.listColor}
          type="color"
          value={listDefaultColor}
          onChange={(e) => setListDefaultColor(e.target.value)}
          sx={{ width: 64 }}
        />
        <Button onClick={saveListColor} variant="contained" color="secondary" sx={{ minWidth: 120 }}>
          {t.lists.saveColor}
        </Button>
        */}
        <Button 
          onClick={() => toggleBulkMode()} 
          variant="text" 
          className="glass"
          sx={{ 
            minWidth: 100,
            color: 'secondary.main',
            '&:hover': {
              backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            }
          }}
        >
          {bulkMode ? t.lists.bulkCancel : t.lists.bulkMode}
        </Button>
        <IconButton onClick={(e) => handleOpenMenu(e)} size="small" aria-label={"More actions"} title={"More actions"}>
          <MoreVertIcon />
        </IconButton>
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
          <MenuItem
            onClick={() => {
              closeMenu();
              openPersonalDialog();
            }}
          >
            {t.buttons.personalize}
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeMenu();
              setHistoryOpen(true);
            }}
            disabled={!lists.some((l) => l.completed)}
          >
            {t.lists.history}
          </MenuItem>
          <MenuItem
            onClick={async () => {
              closeMenu();
              if (!currentListId) {
                return;
              }
              
              try {
                const token = precomputedToken || lists.find((l) => l._id === currentListId)?.shareToken || '';
                const link = precomputedLink || (token ? `${origin}/shared?token=${encodeURIComponent(token)}` : '');
                
                if (!link) {
                  setSnackbarMsg(formatMessage('messages.saveError'));
                  setSnackbarOpen(true);
                  return;
                }

                const isiOS = typeof navigator !== 'undefined' && /ipad|iphone|ipod/i.test(navigator.userAgent);
                
                // Try Web Share API first on iOS
                if (isiOS && typeof navigator !== 'undefined' && navigator.share) {
                  try {
                    await navigator.share({
                      title: 'Shared Todo List',
                      text: 'Check out my todo list',
                      url: link,
                    });
                    setSnackbarMsg(formatMessage('lists.linkCopied'));
                    setSnackbarOpen(true);

                    // Persist token in background
                    if (token && !lists.find((l) => l._id === currentListId)?.shareToken) {
                      (async () => {
                        try {
                          await updateShareToken(currentListId, token);
                        } catch {
                          // Silent fail
                        }
                      })();
                    }

                    return;
                  } catch (err: unknown) {
                    const e = err as { name?: string };
                    if (e.name === 'AbortError') {
                      closeMenu();
                      return;
                    }
                    // Fall through to clipboard fallback
                  }
                }
                
                // Fallback: try Clipboard API
                let clipboardSuccess = false;
                
                if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                  try {
                    await navigator.clipboard.writeText(link);
                    clipboardSuccess = true;
                  } catch {
                    // Try textarea fallback
                  }
                }
                
                // Last resort: textarea method
                if (!clipboardSuccess) {
                  try {
                    const textarea = document.createElement('textarea');
                    textarea.value = link;
                    textarea.style.position = 'fixed';
                    textarea.style.top = '0';
                    textarea.style.left = '0';
                    textarea.style.opacity = '0';
                    textarea.style.pointerEvents = 'none';
                    document.body.appendChild(textarea);
                    textarea.focus();
                    textarea.select();
                    const success = document.execCommand('copy');
                    document.body.removeChild(textarea);
                    if (success) {
                      clipboardSuccess = true;
                    }
                  } catch {
                    // Silent fail
                  }
                }
                
                if (clipboardSuccess) {
                  setSnackbarMsg(formatMessage('lists.linkCopied'));
                  setSnackbarOpen(true);
                } else {
                  // Show modal with link for manual copying
                  setShareModalLink(link);
                  setShareModalOpen(true);
                }

                // persist token in background if it wasn't persisted yet
                if (token && !lists.find((l) => l._id === currentListId)?.shareToken) {
                  (async () => {
                    try {
                      await updateShareToken(currentListId, token);
                    } catch {
                      // Silent fail
                    }
                  })();
                }
              } catch {
                closeMenu();
                setSnackbarMsg(formatMessage('messages.saveError'));
                setSnackbarOpen(true);
              }
            }}
          >
            {t.lists.share}
          </MenuItem>
          {lists.find((l) => l._id === currentListId)?.shareToken && (
            <MenuItem
              onClick={async () => {
                closeMenu();
                if (!currentListId) return;
                try {
                  await updateShareToken(currentListId, '');
                  setSnackbarMsg(formatMessage('lists.linkRevoked'));
                  setSnackbarOpen(true);
                } catch {
                  setSnackbarMsg(formatMessage('messages.saveError'));
                  setSnackbarOpen(true);
                }
              }}
            >
              {t.lists.revokeLink}
            </MenuItem>
          )}
          <MenuItem
            onClick={() => {
              closeMenu();
              completeCurrentList();
            }}
          >
            {t.lists.completeList}
          </MenuItem>
        </Menu>

        {/* Share Link Modal - fallback for iOS */}
        <Dialog open={shareModalOpen} onClose={() => setShareModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{t.lists.share}</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <p>{formatMessage('messages.selectAndCopy')}</p>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={shareModalLink}
              inputProps={{ readOnly: true }}
              onClick={(e) => {
                const input = e.target as HTMLInputElement;
                input.select();
              }}
              sx={{
                fontFamily: 'monospace',
                fontSize: '12px',
                bgcolor: 'background.paper',
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShareModalOpen(false)}>{formatMessage('buttons.close')}</Button>
          </DialogActions>
        </Dialog>
        
      </Box>
    </Box>
  );
}

