import * as React from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  Autocomplete,
  Alert,
  Collapse,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import ClearIcon from '@mui/icons-material/Clear';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import { Category, iconMap, iconChoices } from '@/constants';
import useAppStore from '@/stores/useAppStore';
import { UseTodosReturn } from '@/hooks/useTodos';
import { useNameOptions } from '@/hooks/useNameOptions';
import { useCategoryOptions } from '@/hooks/useCategoryOptions';
import CategoryIconPicker from './CategoryIconPicker';
import QuantityDialog from './dialogs/QuantityDialog';
import type { StoredProduct } from '@/types';
import type { TranslationKeys } from '@/locales/ru';

interface Props {
  todoActions: UseTodosReturn;
  availableCategories: Category[];
  setAvailableCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  updateNameCategory: (name: string, category: string, comment: string) => void;
  nameCategoryMap: Record<string, string>;
  products: StoredProduct[];
  listDefaultColor: string;
  t: TranslationKeys;
  formOpen: boolean;
  setFormOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // when true, render inside a dialog instead of collapsing inline
  dialogMode?: boolean;
} 


// parsing logic has been moved to a shared utility so other
// components or tests can use it without dragging TodoForm along.
import { parseSmartInput, ParsedInput, getUnitOptions } from '@/utils/parseSmartInput';

export default function TodoForm({
  todoActions,
  availableCategories,
  setAvailableCategories,
  updateNameCategory,
  nameCategoryMap,
  products,
  listDefaultColor,
  t,
  formOpen,
  setFormOpen,
  dialogMode = false,
}: Props) {
  // local state needed by the form (icon picker + quantity dialog)
  // language context no longer required for parsing
  const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  // convert spoken number words to digits for common languages (ru/en)
  const convertNumberWordsToDigits = (input: string, langCode?: string) => {
    if (!input) return input;
    const lang = (langCode || '').toLowerCase();
    
    const joinTokens = (tokens: string[]) => tokens.join(' ');

    if (lang.startsWith('ru')) {
      const units: Record<string, number> = {
        ноль:0, один:1, одна:1, одно:1, двух:2, два:2, две:2, три:3, четыре:4, пять:5, шесть:6, семь:7, восемь:8, девять:9,
        десять:10, одиннадцать:11, двенадцать:12, тринадцать:13, четырнадцать:14, пятнадцать:15, шестнадцать:16, семнадцать:17, восемнадцать:18, девятнадцать:19
      };
      const tens: Record<string, number> = { двадцать:20, тридцать:30, сорок:40, пятьдесят:50, шестьдесят:60, семьдесят:70, восемьдесят:80, девяносто:90 };
      const hundreds: Record<string, number> = { сто:100, двести:200, триста:300, четыреста:400, пятьсот:500, шестьсот:600, семьсот:700, восемьсот:800, девятьсот:900 };
      const multipliers: Record<string, number> = { тысяча:1000, тысячи:1000, тысяч:1000 };

      // Tokenize preserving digits and Cyrillic letters; trim punctuation from token edges
      const rawTokens = input.trim().split(/\s+/).filter(Boolean);
      const tokens = rawTokens.map((t) =>
        t.replace(/^[^0-9A-Za-z\u0400-\u04FF]+|[^0-9A-Za-z\u0400-\u04FF]+$/g, '').toLowerCase()
      );

      // map common fractional/collapsed forms first (handle 'полтора', 'полторы', 'полтораста')
      for (let k = 0; k < tokens.length; k++) {
        if (tokens[k] === 'полтора' || tokens[k] === 'полторы') tokens[k] = '1.5';
        if (tokens[k] === 'полтораста' || tokens[k] === 'полторыста') tokens[k] = '150';
      }

      const out: string[] = [];
      let i = 0;
      while (i < tokens.length) {
        const tryParse = (start: number) => {
          let total = 0;
          let current = 0;
          let j = start;
          let found = false;
          while (j < tokens.length) {
            const w = tokens[j];
            const numMatch = w.match(/^(\d+(?:[.,]\d+)?)$/);
            if (numMatch) { current += parseFloat(numMatch[1].replace(',', '.')); found = true; j++; continue; }
            if (units[w] !== undefined) { current += units[w]; found = true; j++; continue; }
            if (tens[w] !== undefined) { current += tens[w]; found = true; j++; continue; }
            if (hundreds[w] !== undefined) { current += hundreds[w]; found = true; j++; continue; }
            if (multipliers[w] !== undefined) { if (current === 0) current = 1; current = current * multipliers[w]; total += current; current = 0; found = true; j++; continue; }
            break;
          }
          if (!found) return null;
          return { value: total + current, end: j };
        };

        const parsed = tryParse(i);
        if (parsed) {
          out.push(String(parsed.value));
          i = parsed.end;
        } else {
          out.push(tokens[i]);
          i += 1;
        }
      }
      return joinTokens(out);
    }

    if (lang.startsWith('en')) {
      const units: Record<string, number> = { zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15, sixteen:16, seventeen:17, eighteen:18, nineteen:19 };
      const tens: Record<string, number> = { twenty:20, thirty:30, forty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90 };
      const multipliers: Record<string, number> = { hundred:100, thousand:1000, million:1000000 };

      const rawTokens = input.trim().split(/\s+/).filter(Boolean);
      const tokens = rawTokens.map((t) => t.replace(/^[^0-9A-Za-z\u0400-\u04FF]+|[^0-9A-Za-z\u0400-\u04FF]+$/g, '').toLowerCase());
      const out: string[] = [];
      let i = 0;
      while (i < tokens.length) {
        const tryParse = (start: number) => {
          let total = 0;
          let current = 0;
          let j = start;
          let found = false;
          while (j < tokens.length) {
            const w = tokens[j];
            const numMatch = w.match(/^(\d+(?:[.,]\d+)?)$/);
            if (numMatch) { current += parseFloat(numMatch[1].replace(',', '.')); found = true; j++; continue; }
            if (units[w] !== undefined) { current += units[w]; found = true; j++; continue; }
            if (tens[w] !== undefined) { current += tens[w]; found = true; j++; continue; }
            if (w === 'hundred') { if (current === 0) current = 1; current = current * 100; found = true; j++; continue; }
            if (w in multipliers && multipliers[w] > 100) { if (current === 0) current = 1; current = current * multipliers[w]; total += current; current = 0; found = true; j++; continue; }
            break;
          }
          if (!found) return null;
          return { value: total + current, end: j };
        };

        const parsed = tryParse(i);
        if (parsed) {
          out.push(String(parsed.value));
          i = parsed.end;
        } else {
          out.push(tokens[i]);
          i += 1;
        }
      }
      return joinTokens(out);
    }

    return input;
  };
  const [tempIconKey, setTempIconKey] = React.useState('');
  const [parsed, setParsed] = React.useState<ParsedInput | null>(null);
  const [quantityDialogOpen, setQuantityDialogOpen] = React.useState(false);
  const [tempQuantity, setTempQuantity] = React.useState<number>(
    todoActions.quantity || 1
  );

  // Speech recognition for quick voice input (Web Speech API)
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = React.useState(false);
  const [speechSupported, setSpeechSupported] = React.useState(false);

  const language = useAppStore((s) => s.language);

  // pick only the pieces we need from the todoActions object
  const {
    name,
    description,
    quantity,
    comment,
    unit,
    color,
    category,
    editingId,
    todos,
    clearedForName,
    categoryWarning,
    todosLoading,
    setName,
    setDescription,
    setQuantity,
    setComment,
    setUnit,
    setColor,
    setCategory,
    setCategoryManual,
    setEditingId,
    addItem,
    
  } = todoActions as UseTodosReturn;

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSpeechSupported(false);
      return;
    }
    try {
      try {
        // stop previous instance if any (when changing language)
        recognitionRef.current?.stop?.();
      } catch {}
      const r = new SR();
      const langMap: Record<string, string> = {
        ru: 'ru-RU',
        he: 'he-IL',
        en: (navigator.language as string) || 'en-US',
      };
      const langCode = (language && (langMap[language] || (navigator.language as string) || 'en-US')) || ((navigator.language as string) || 'en-US');
      r.lang = langCode;
      r.interimResults = false;
      r.maxAlternatives = 1;
      r.onresult = (e: SpeechRecognitionEvent) => {
        const last = e.results[e.results.length - 1];
        const transcript = (last?.[0]?.transcript ?? '').trim();
        if (transcript) {
            const converted = convertNumberWordsToDigits(transcript, language);
            const capitalized = capitalize(converted);
            setName(capitalized);
            const p = parseSmartInput(converted);
            setParsed(p);
            try {
              setUnit(p?.unit || '')
            } catch {}
          }
      };
      r.onstart = () => setIsListening(true);
      r.onend = () => setIsListening(false);
      r.onerror = () => setIsListening(false);
      recognitionRef.current = r;
      setSpeechSupported(true);
      } catch {
      setSpeechSupported(false);
    }
    // cleanup
    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {}
      recognitionRef.current = null;
    };
  }, [setName, setUnit, language]);

  // keep tempIconKey in sync when user selects existing category
  React.useEffect(() => {
    const exist = availableCategories.find((c) => c.value === category);
    if (exist) {
      const key =
        Object.keys(iconMap).find((k) => iconMap[k] === exist.icon) || '';
      setTempIconKey(key);
    } else {
      setTempIconKey('');
    }
  }, [category, availableCategories]);

  // computed helpers
  const nameOptions = useNameOptions(todos, products);
  const { categoryOptions } = useCategoryOptions({
    name,
    todos,
    availableCategories,
    nameCategoryMap,
    category,
    clearedForName: clearedForName || '',
    t,
  });

  const displayedCategory = React.useMemo(() => {
    if (category === '' && clearedForName === (name || '').trim().toLowerCase()) {
      return '';
    }
    const found = availableCategories.find((c) => c.value === category);
    return found ? found.label : category;
  }, [availableCategories, category, name, clearedForName]);

  // label to show in the preview area; prefer parser's category but
  // map it to a human-readable label if possible
  const previewCategoryLabel = React.useMemo(() => {
    const cat = parsed?.category || category;
    if (!cat) return '';
    const found = availableCategories.find((c) => c.value === cat);
    return found ? found.label : cat;
  }, [parsed, category, availableCategories]);

  const ensureCategoryExists = React.useCallback(
    async (val: string, iconKey?: string) => {
      const v = val.trim();
      if (!v) return;
      setAvailableCategories((prev) => {
        if (prev.find((c) => c.value === v)) return prev;
        let finalKey = iconKey;
        if (!finalKey) {
          finalKey = Object.keys(iconMap).find(
            (k) => k.toLowerCase() === v.toLowerCase()
          );
        }
        const newCat: Category = {
          value: v,
          label: (t.categoryLabels as Record<string, string>)?.[v] || iconChoices.find((x) => x.key === v)?.label || v,
          icon: finalKey ? iconMap[finalKey] : null,
        };
        return [...prev, newCat];
      });
    },
    [setAvailableCategories, t]
  );

  // add item using whatever values are currently in state
  type Override = Partial<{ name: string; quantity: number; comment: string; category: string; unit: string }>;

  const handleAdd = React.useCallback(async (override?: Override) => {
    // compute parse fresh or use override
    let p = override ?? parsed ?? parseSmartInput(name || '');
    if (!p && (name || '').trim().includes(' ')) {
      const parts = (name || '').trim().split(/\s+/);
      const first = parts.shift() || '';
      p = { name: first, quantity: 1, comment: parts.join(' ') };
    }
    if (p) {
      // apply overrides to state synchronously
      setName(capitalize(p.name || ''));
      setQuantity(p.quantity ?? 1);
      setComment(p.comment || '');
      setUnit(p.unit || '');
      if (p.category) {
        setCategory(p.category);
      }
    }
    // always capitalize name on save (state for UI)
    if (name) {
      setName(capitalize(name));
    }
    await ensureCategoryExists(category, tempIconKey || undefined);
    // add using override so stale state doesn't matter
    const overridePayload: Partial<{ name: string; quantity: number; comment: string; category: string; unit: string }> = {};
    if (p) {
      if (p.name) overridePayload.name = capitalize(p.name);
      if (p.quantity != null) overridePayload.quantity = p.quantity;
      if (p.comment) overridePayload.comment = p.comment;
      if (p.unit) overridePayload.unit = p.unit;
      if (p.category) overridePayload.category = p.category;
    }
    await addItem(overridePayload);
    updateNameCategory(
      overridePayload.name || name || '',
      overridePayload.category || category || '',
      overridePayload.comment || comment || ''
    );
    setTempIconKey('');
    setParsed(null);
  }, [ensureCategoryExists, addItem, setName, setQuantity, setComment, setUnit, setCategory, name, category, comment, tempIconKey, updateNameCategory, parsed]);

  // build inner form container once so dialog/inline both use same markup
  const formInner = (
    <>
      <Paper sx={{ p: 2, mb: 2, width: '100%', borderRadius: 2 }} elevation={3}>
        {/* form header with collapse button - hidden when dialogMode because dialog title shows it */}
        {!dialogMode && (
          <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
            pb: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {editingId ? t.todos.editTask || t.todos.addEdit : t.todos.addTask || t.todos.addEdit}
          </Typography>
          <IconButton size="small" onClick={() => setFormOpen(false)} disabled={todosLoading}>
            <ExpandMoreIcon sx={{ transform: 'rotate(-90deg)' }} />
          </IconButton>
        </Box>
      )}
      {todosLoading && <LinearProgress />}
      <Stack
        spacing={2}
        sx={{
          opacity: todosLoading ? 0.5 : 1,
          pointerEvents: todosLoading ? 'none' : undefined,
        }}
      >
        {/* name field now provides autocomplete based on existing todo names */}
        <Autocomplete
            freeSolo
            options={nameOptions}
            getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.name)}
            inputValue={name || ''}
            onInputChange={(_, v) => {
              setName(capitalize(v));
              const p = parseSmartInput(v);
              setParsed(p);
              setUnit(p?.unit || '');
            }}
            onChange={(_, v) => {
              let newName = '';
              if (typeof v === 'string') {
                newName = capitalize(v);
                setName(newName);
              } else if (v && typeof v === 'object') {
                newName = capitalize(v.name);
                setName(newName);
                if (v.category) todoActions.setCategory(v.category);
              }
              const p = parseSmartInput(newName);
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
                          {data.category}
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
                placeholder={t.todos.namePlaceholder}
                fullWidth
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAdd();
                    e.preventDefault();
                  }
                  if (e.key === ' ' || e.key === 'Spacebar') {
                    // space pressed - update parsed preview
                      const p = parseSmartInput(name || '');
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
                                try {
                                  if (isListening) {
                                    recognitionRef.current?.stop();
                                  } else {
                                    recognitionRef.current?.start();
                                  }
                                } catch {}
                              }}
                              edge="end"
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
              sx={(t) => ({
                mt: 1,
                p: 1,
                bgcolor: t.palette.mode === 'dark' ? t.palette.grey[800] : t.palette.grey[100],
                color: 'text.primary',
                borderRadius: 1,
              })}
            >
              <Typography variant="body2">
                {t.todos.parsedPreview || 'Parsed:'}
              </Typography>
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
              {previewCategoryLabel && (
                <Typography variant="body2">
                  <strong>{t.todos.category}:</strong> {previewCategoryLabel}
                </Typography>
              )}
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<AutoAwesomeIcon />}
                  onClick={() => {
                    handleAdd({
                      name: parsed.name,
                      quantity: parsed.quantity,
                      comment: parsed.comment,
                      unit: parsed.unit,
                      category: parsed.category,
                    });
                  }}
                >
                  {t.buttons?.smartAdd || 'Умное сохранение'}
                </Button>
              </Box>
            </Box>
          )}
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
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
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
              inputValue={unit || ''}
              onInputChange={(_, v) => setUnit(v)}
              sx={{ width: 110 }}
              renderInput={(params) => (
                <TextField {...params} label={t.todos.unit || 'Unit'} />
              )}
            />
          </Box>
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
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          <TextField
            label={t.todos.color}
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            sx={{ width: 80 }}
          />
          <Autocomplete
            freeSolo
            options={categoryOptions}
            getOptionLabel={(opt) =>
              typeof opt === 'string' ? opt : opt.label || opt.value
            }
            value={category === '' && clearedForName === (name || '').trim().toLowerCase() ? null : availableCategories.find((c) => c.value === category) || (category ? { value: category, label: category, icon: null } : null)}
            inputValue={displayedCategory}
            onInputChange={(_, v, reason) => {
              if (reason === 'input') {
                setCategoryManual(v);
              }
            }}
            onChange={(_, v) => {
              let val = '';
              if (typeof v === 'string') {
                val = v;
              } else if (v && typeof v === 'object') {
                val = v.value || '';
              }
              setCategoryManual(val);
              ensureCategoryExists(val);
            }}
            renderOption={(props, option) => (
              <li {...props}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {option.icon ? <option.icon fontSize="small" sx={{ mr: 0.5 }} /> : null}
                  {option.label || option.value}
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} label={t.todos.category} fullWidth />
            )}
          />
          {categoryWarning && (
            <Box sx={{ mt: 1 }}>
              <Alert
                severity="warning"
                onClose={() => setCategoryManual(category)}
              >
                {todoActions.categoryWarning}
              </Alert>
            </Box>
          )}
          {/* if category text doesn't match existing, allow picking icon */}
          {category && !availableCategories.find((c) => c.value === category) && (
              <CategoryIconPicker
                selected={tempIconKey}
                onChange={setTempIconKey}
              />
            )}

          

          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ width: '100%' }}>
            <Button
              variant="contained"
              onClick={() => handleAdd()}
              fullWidth
            >
              {editingId ? t.todos.save : t.todos.addTask || t.todos.add}
            </Button>
            {editingId && (
              <Button
                variant="outlined"
                onClick={() => {
                  setEditingId(null);
                  setName('');
                  setDescription('');
                  setQuantity(1);
                  setComment('');
                  setColor(listDefaultColor);
                }}
                fullWidth
              >
                {t.todos.cancel}
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>
      <QuantityDialog
        open={quantityDialogOpen}
        value={tempQuantity}
        onChange={(v) => {
          setTempQuantity(v);
          todoActions.setQuantity(v);
        }}
        onClose={() => setQuantityDialogOpen(false)}
        t={t}
      />
    </>
  );

  // render according to mode
  if (dialogMode) {
    return (
      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
          <Typography sx={{ fontWeight: 600, flex: 1 }}>
            {editingId ? t.todos.editTask || t.todos.addEdit : t.todos.addTask || t.todos.addEdit}
          </Typography>
          <IconButton size="small" onClick={() => setFormOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>{formInner}</DialogContent>
      </Dialog>
    );
  }

  return (
    <Collapse in={formOpen} timeout={400}>
      {formInner}
    </Collapse>
  );
}
