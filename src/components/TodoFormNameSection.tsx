import * as React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import { Box, Button, IconButton, InputAdornment, Stack, TextField, Tooltip, Typography } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import { useTheme } from '@mui/material/styles';
import { parseSmartInput, inferCategorySmart, ParsedInput } from '@/utils/parseSmartInput';
import { iconMap } from '@/constants';
import type { TranslationKeys } from '@/locales/ru';

export interface TodoFormNameSectionProps {
  name: string;
  setName: (name: string) => void;
  nameOptions: Array<string | { name: string; category?: string; comment?: string; icon?: string }>;
  namePlaceholder: string;
  language: string;
  t: TranslationKeys;
  parsed: ParsedInput | null;
  setParsed: (parsed: ParsedInput | null) => void;
  setUnit: (unit: string) => void;
  handleInferCategory: (text: string) => void;
  handleAdd: (override?: Partial<{ name: string; category: string; quantity: number; unit: string; comment: string }>) => Promise<void>;
  speechSupported: boolean;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  todosLoading: boolean;
  category: string;
  setCategory: (category: string) => void;
  previewCategory: { label: string; Icon: React.ElementType | null };
  description: string;
  comment: string;
  quantity: number;
  unit: string;
  setPendingParsed: React.Dispatch<React.SetStateAction<{
    name: string;
    category: string;
    quantity: number;
    unit: string;
    comment: string;
  } | null>>;
  setConfirmCategoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function TodoFormNameSection({
  name,
  setName,
  nameOptions,
  namePlaceholder,
  language,
  t,
  parsed,
  setParsed,
  setUnit,
  handleInferCategory,
  handleAdd,
  speechSupported,
  isListening,
  startListening,
  stopListening,
  todosLoading,
  category,
  setCategory,
  previewCategory,
  description,
  comment,
  quantity,
  unit,
  setPendingParsed,
  setConfirmCategoryOpen,
}: TodoFormNameSectionProps) {
  const theme = useTheme();

  const capitalize = React.useCallback((s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s), []);

  const onSmartAddClick = React.useCallback(async () => {
    const currentName = parsed?.name || name || '';
    const currentCategory = parsed?.category || category || '';
    const currentQuantity = parsed?.quantity || quantity || 1;
    const currentUnit = parsed?.unit || unit || '';
    const currentComment = parsed?.comment || description || comment || '';

    const isCategoryMissing = !currentCategory || currentCategory === 'none';

    if (isCategoryMissing) {
      const detected = await inferCategorySmart(currentName, language);
      setPendingParsed({
        name: currentName,
        category: (detected && detected !== 'none') ? detected : '',
        quantity: currentQuantity,
        unit: currentUnit,
        comment: currentComment,
      });
      setConfirmCategoryOpen(true);
      return;
    }

    await handleAdd({
      name: currentName,
      category: currentCategory,
      quantity: currentQuantity,
      unit: currentUnit,
      comment: currentComment,
    });
  }, [parsed, name, category, quantity, unit, description, comment, handleAdd, language, setPendingParsed, setConfirmCategoryOpen]);

  return (
    <>
      <Stack spacing={1}>
        <Autocomplete
          freeSolo
          options={nameOptions}
          getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.name)}
          inputValue={name || ''}
          onInputChange={(_, v) => {
            setName(capitalize(v));
            const p = parseSmartInput(v, language);
            setParsed(p);
            setUnit(p?.unit || '');
            handleInferCategory(v);
          }}
          onChange={(_, v) => {
            let newName = '';
            if (typeof v === 'string') {
              newName = capitalize(v);
              setName(newName);
              inferCategorySmart(newName, language).then((cat) => {
                if (cat) setCategory(cat);
              });
            } else if (v && typeof v === 'object') {
              newName = capitalize(v.name);
              setName(newName);
              if (v.category) setCategory(v.category);
            }
            const p = parseSmartInput(newName, language);
            setParsed(p);
            setUnit(p?.unit || '');
          }}
          renderOption={(props, option) => {
            const data = typeof option === 'string' ? { name: option } : option;
            return (
              <li {...props}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {data.icon && iconMap[data.icon] ? (
                    <Box sx={{ display: 'flex' }}>
                      {React.createElement(iconMap[data.icon], { fontSize: 'small' })}
                    </Box>
                  ) : null}
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{data.name}</span>
                    {data.category && (
                      <Typography variant="caption" color="text.secondary">
                        {(t.categoryLabels as Record<string, string>)?.[data.category] || data.category}
                      </Typography>
                    )}
                    {data.comment && (
                      <Typography variant="caption" color="text.secondary">
                        {data.comment}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t.todos.name}
              placeholder={namePlaceholder}
              fullWidth
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAdd();
                  e.preventDefault();
                }
                if (e.key === ' ' || e.key === 'Spacebar') {
                  const p = parseSmartInput(name || '', language);
                  setParsed(p);
                  setUnit(p?.unit || '');
                }
              }}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {params.InputProps.endAdornment}
                    {speechSupported ? (
                      <InputAdornment position="end">
                        <Tooltip
                          title={
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                              <span>{isListening ? t.todos.stopListening : t.todos.voiceInput}</span>
                              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                                {t.todos.voiceExamples}
                              </Typography>
                            </Box>
                          }
                        >
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isListening) {
                                stopListening();
                              } else {
                                startListening();
                              }
                            }}
                            edge="end"
                            className={isListening ? 'voice-active' : ''}
                            color={isListening ? 'primary' : undefined}
                            aria-label={isListening ? t.todos.stopListening : t.todos.startListening}
                          >
                            {isListening ? <MicOffIcon /> : <MicIcon />}
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ) : null}
                  </>
                ),
              }}
            />
          )}
        />

        {parsed && (
          <Box
            sx={(theme) => ({
              mt: 0.5,
              p: 1,
              bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
              color: 'text.primary',
              borderRadius: 1,
            })}
          >
            <Typography variant="body2">{t.todos.parsedPreview || 'Parsed:'}</Typography>
            <Typography variant="body2">
              <strong>{t.todos.nameLabel || 'Name'}:</strong> {parsed.name}
            </Typography>
            <Typography variant="body2">
              <strong>{t.todos.quantityLabel || 'Qty'}:</strong> {parsed.quantity}
            </Typography>
            {parsed.unit && (
              <Typography variant="body2">
                <strong>{t.todos.unit || 'Unit'}:</strong> {parsed.unit}
              </Typography>
            )}
            {parsed.comment && (
              <Typography variant="body2">
                <strong>{t.todos.commentLabel || 'Comment'}:</strong> {parsed.comment}
              </Typography>
            )}
            {previewCategory.label && (
              <Typography variant="body2" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <strong>{t.todos.category}:</strong>
                {previewCategory.Icon ? (
                  <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                    {React.createElement(previewCategory.Icon, { fontSize: 'small' })}
                  </Box>
                ) : null}
                <Box component="span">{previewCategory.label}</Box>
              </Typography>
            )}
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<AutoAwesomeIcon sx={{ ml: theme.direction === 'rtl' ? 1 : 0, mr: theme.direction === 'rtl' ? 0 : 1 }} />}
                onClick={onSmartAddClick}
                disabled={todosLoading}
              >
                {t.buttons?.smartAdd || 'Умная подстановка'}
              </Button>
            </Box>
          </Box>
        )}
      </Stack>
    </>
  );
}
