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
} from '@mui/material';
import { Template } from '@/types';

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
        setErrorMsg('Не удалось создать список');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка при создании';
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
      <DialogTitle>Новый список</DialogTitle>
      <DialogContent>
        {errorMsg && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="error">{errorMsg}</Alert>
          </Box>
        )}
        <TextField
          label="Название"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          autoFocus
          sx={{ mb: 2 }}
        />
        <TextField
          select
          label="Шаблон"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          fullWidth
        >
          <MenuItem value="">(нет)</MenuItem>
          {availableTemplates.map((t) => (
            <MenuItem key={t.name} value={t.name}>
              {t.name}
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" onClick={handleCreate} disabled={!name.trim()}>
          Создать
        </Button>
      </DialogActions>
    </Dialog>
  );
}
