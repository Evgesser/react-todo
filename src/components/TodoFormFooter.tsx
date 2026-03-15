import * as React from 'react';
import { Button, Stack } from '@mui/material';
import type { TranslationKeys } from '@/locales/ru';

export interface TodoFormFooterProps {
  editingId: string | null;
  handleAdd: (override?: Partial<{ name: string; category: string; quantity: number; unit: string; comment: string }>) => Promise<void>;
  setEditingId: (id: string | null) => void;
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  setQuantity: (value: number) => void;
  setComment: (value: string) => void;
  setColor: (value: string) => void;
  listDefaultColor: string;
  setFormOpen: (open: boolean) => void;
  t: TranslationKeys;
}

export default function TodoFormFooter({
  editingId,
  handleAdd,
  setEditingId,
  setName,
  setDescription,
  setQuantity,
  setComment,
  setColor,
  listDefaultColor,
  setFormOpen,
  t,
}: TodoFormFooterProps) {
  return (
    <Stack direction="row" flexWrap="wrap" sx={{ width: '100%' }}>
      <Button
        variant="text"
        className="glass"
        onClick={() => handleAdd()}
        sx={{
          flex: 1,
          mx: editingId ? '2px' : 0,
          color: 'primary.main',
          '&:hover': {
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.1)'
                : 'rgba(0,0,0,0.05)',
          },
        }}
      >
        {editingId ? t.todos.save : t.todos.addTask || t.todos.add}
      </Button>
      {editingId && (
        <Button
          variant="text"
          className="glass"
          onClick={() => {
            setEditingId(null);
            setName('');
            setDescription('');
            setQuantity(1);
            setComment('');
            setColor(listDefaultColor);
            setFormOpen(false);
          }}
          sx={{
            flex: 1,
            mx: '2px',
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(0,0,0,0.05)',
            },
          }}
        >
          {t.todos.cancel}
        </Button>
      )}
    </Stack>
  );
}
