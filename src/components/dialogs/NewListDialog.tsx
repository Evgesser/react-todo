import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  MenuItem,
  DialogActions,
  Button,
  Box,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { Template } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface NewListDialogProps {
  open: boolean;
  onClose: () => void;
  availableTemplates: Template[];
  // should return truthy if creation succeeded (dialog will then close)
  onCreate: (name: string, templateName: string) => Promise<boolean> | boolean;
}

export default function NewListDialog({
  open,
  onClose,
  availableTemplates,
  onCreate,
}: NewListDialogProps) {
    const { t } = useLanguage();
  const [name, setName] = React.useState('');
  const [templateName, setTemplateName] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState<string>('');

  const handleCreate = async () => {
    const nm = name.trim();
    if (!nm) return;
    try {
      const result = await onCreate(nm, templateName);
      if (result) {
        setName('');
        setTemplateName('');
        setErrorMsg('');
        onClose();
      } else {
        setErrorMsg(t.dialogs.newList.error);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t.messages.createError;
      setErrorMsg(msg);
    }
  };

  React.useEffect(() => {
    if (!open) {
      setName('');
      setTemplateName('');
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>{t.dialogs.newList.title}</DialogTitle>
      <DialogContent>
        {errorMsg && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="error">{errorMsg}</Alert>
          </Box>
        )}
        <TextField
          label={t.dialogs.newList.name}
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          autoFocus
          sx={{ mb: 2 }}
          InputProps={{
            endAdornment: name ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setName('')}
                  edge="end"
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
        <TextField
          select
          label={t.dialogs.newList.template}
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          fullWidth
        >
          <MenuItem value="">{t.dialogs.newList.noTemplate}</MenuItem>
          {availableTemplates.map((tmpl) => (
            <MenuItem key={tmpl.name} value={tmpl.name}>
              {tmpl.name}
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t.dialogs.newList.cancel}</Button>
        <Button variant="contained" onClick={handleCreate} disabled={!name.trim()}>
          {t.dialogs.newList.create}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
