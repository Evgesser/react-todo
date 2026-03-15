import * as React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import type { TranslationKeys } from '@/locales/ru';
import { getUnitOptions } from '@/utils/parseSmartInput';
import QuantityDialog from './dialogs/QuantityDialog';

export interface TodoFormDetailsSectionProps {
  listType: string | null;
  description: string;
  setDescription: (value: string) => void;
  quantity: number;
  setQuantity: (value: number) => void;
  comment: string;
  setComment: (value: string) => void;
  unit: string;
  setUnit: (value: string) => void;
  amount?: number;
  setAmount: (value?: number) => void;
  spentAt: string;
  setSpentAt: (value: string) => void;
  dueDate: string;
  setDueDate: (value: string) => void;
  priority: 'low' | 'medium' | 'high' | '';
  setPriority: (value: 'low' | 'medium' | 'high' | '') => void;
  reminderAt: string;
  setReminderAt: (value: string) => void;
  language: string;
  t: TranslationKeys;
  imageData: string | null;
  setImageData: (value: string | null) => void;
  imagePreviewOpen: boolean;
  setImagePreviewOpen: (open: boolean) => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  quantityDialogOpen: boolean;
  setQuantityDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  tempQuantity: number;
  setTempQuantity: React.Dispatch<React.SetStateAction<number>>;
}

export default function TodoFormDetailsSection({
  listType,
  description,
  setDescription,
  quantity,
  setQuantity,
  comment,
  setComment,
  unit,
  setUnit,
  amount,
  setAmount,
  spentAt,
  setSpentAt,
  dueDate,
  setDueDate,
  priority,
  setPriority,
  reminderAt,
  setReminderAt,
  language,
  t,
  imageData,
  setImageData,
  imagePreviewOpen,
  setImagePreviewOpen,
  handleImageChange,
  quantityDialogOpen,
  setQuantityDialogOpen,
  tempQuantity,
  setTempQuantity,
}: TodoFormDetailsSectionProps) {
  return (
    <>
      <TextField
        label={t.todos.description}
        placeholder={t.todos.descriptionPlaceholder}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        fullWidth
        InputProps={{
          endAdornment: description ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => setDescription('')}
                edge="end"
                aria-label={t.buttons.cancel}
                title={t.buttons.cancel}
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />

      {listType === 'shopping' && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            label={t.todos.quantity}
            type="number"
            value={quantity}
            onClick={() => {
              setTempQuantity(quantity || 1);
              setQuantityDialogOpen(true);
            }}
            onFocus={(e) => {
              setTempQuantity(quantity || 1);
              setQuantityDialogOpen(true);
              (e.target as HTMLElement).blur();
            }}
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: true }}
            inputProps={{ min: 1 }}
            sx={{ flex: 1 }}
          />
          <Autocomplete
            freeSolo
            options={getUnitOptions(language)}
            disablePortal
            inputValue={unit || ''}
            onInputChange={(_, v) => setUnit(v)}
            sx={{ width: 110 }}
            renderInput={(params) => (
              <TextField {...params} label={t.todos.unit || 'Unit'} />
            )}
          />
        </Box>
      )}

      <TextField
        label={t.todos.comment}
        placeholder={t.todos.commentPlaceholder}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        fullWidth
        InputProps={{
          endAdornment: comment ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => setComment('')}
                edge="end"
                aria-label="Очистить комментарий"
                title="Очистить комментарий"
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />

      {listType === 'expenses' && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          <TextField
            label={t.todos.amount}
            placeholder={t.todos.amountPlaceholder}
            type="number"
            value={amount ?? ''}
            onChange={(e) => setAmount(e.target.value === '' ? undefined : Number(e.target.value))}
            fullWidth
            InputProps={{ inputProps: { min: 0, step: 0.01 } }}
          />
          <TextField
            label={t.todos.spentAt}
            type="date"
            value={spentAt}
            onChange={(e) => setSpentAt(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      )}

      {listType === 'todo' && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          <TextField
            label={t.todos.dueDate}
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            select
            label={t.todos.priority}
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high' | '')}
            fullWidth
            InputLabelProps={{ shrink: true }}
          >
            <MenuItem value="">{t.todos.priority}</MenuItem>
            <MenuItem value="low">{t.todos.priorityLow}</MenuItem>
            <MenuItem value="medium">{t.todos.priorityMedium}</MenuItem>
            <MenuItem value="high">{t.todos.priorityHigh}</MenuItem>
          </TextField>
          <TextField
            label={t.todos.reminder}
            type="datetime-local"
            value={reminderAt}
            onChange={(e) => setReminderAt(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      )}

      <Box sx={{ mt: 0.5 }}>
        <Button variant="outlined" component="label" size="small">
          {t.todos.attachImage || 'Прикрепить изображение'}
          <input hidden accept="image/*" type="file" onChange={handleImageChange} />
        </Button>
        {imageData && (
        <>
          <Box
            sx={{ mt: 0.5, position: 'relative', display: 'inline-block', cursor: 'pointer' }}
            onClick={() => setImagePreviewOpen(true)}
          >
            <img
              src={imageData}
              alt="preview"
              style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 4 }}
              onClick={() => setImagePreviewOpen(true)}
            />
            <IconButton
              size="small"
              sx={{ position: 'absolute', top: 2, insetInlineEnd: 2 }}
              onClick={(event) => {
                event.stopPropagation();
                setImageData(null);
              }}
              aria-label="Удалить изображение"
              title="Удалить изображение"
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </Box>

          <Dialog
            open={imagePreviewOpen}
            onClose={() => setImagePreviewOpen(false)}
            maxWidth="md"
            sx={{ zIndex: (theme) => theme.zIndex.modal + 200 }}
          >
            <DialogContent sx={{ p: 0, background: 'black' }}>
              <img src={imageData || ''} alt="full" style={{ width: '100%', height: 'auto' }} />
            </DialogContent>
          </Dialog>
        </>
      )}
      </Box>

      <QuantityDialog
        open={quantityDialogOpen}
        value={tempQuantity}
        onChange={(v) => {
          setTempQuantity(v);
          setQuantity(v);
        }}
        onClose={() => setQuantityDialogOpen(false)}
        t={t}
      />
    </>
  );
}
