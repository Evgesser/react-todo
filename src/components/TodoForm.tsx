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
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ClearIcon from '@mui/icons-material/Clear';
import { Category, iconMap } from '@/constants';
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
}

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
}: Props) {
  // local state needed by the form (icon picker + quantity dialog)
  const [tempIconKey, setTempIconKey] = React.useState('');
  const [quantityDialogOpen, setQuantityDialogOpen] = React.useState(false);
  const [tempQuantity, setTempQuantity] = React.useState<number>(
    todoActions.quantity || 1
  );

  // keep tempIconKey in sync when user selects existing category
  React.useEffect(() => {
    const exist = availableCategories.find(
      (c) => c.value === todoActions.category
    );
    if (exist) {
      const key =
        Object.keys(iconMap).find((k) => iconMap[k] === exist.icon) || '';
      setTempIconKey(key);
    } else {
      setTempIconKey('');
    }
  }, [todoActions.category, availableCategories]);

  // computed helpers
  const nameOptions = useNameOptions(todoActions.todos, products);
  const { categoryOptions } = useCategoryOptions({
    name: todoActions.name,
    todos: todoActions.todos,
    availableCategories,
    nameCategoryMap,
    category: todoActions.category,
    clearedForName: todoActions.clearedForName || '',
  });

  const displayedCategory = React.useMemo(() => {
    if (
      todoActions.category === '' &&
      todoActions.clearedForName === todoActions.name.trim().toLowerCase()
    ) {
      return '';
    }
    const found = availableCategories.find(
      (c) => c.value === todoActions.category
    );
    return found ? found.label : todoActions.category;
  }, [availableCategories, todoActions.category, todoActions.name, todoActions.clearedForName]);

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
          label: v,
          icon: finalKey ? iconMap[finalKey] : null,
        };
        return [...prev, newCat];
      });
    },
    [setAvailableCategories]
  );

  const handleAdd = React.useCallback(async () => {
    await ensureCategoryExists(todoActions.category, tempIconKey || undefined);
    await todoActions.addItem();
    updateNameCategory(
      todoActions.name,
      todoActions.category,
      todoActions.comment
    );
    setTempIconKey('');
  }, [ensureCategoryExists, todoActions, tempIconKey, updateNameCategory]);

  return (
    <Collapse in={formOpen} timeout={400}>
      <Paper sx={{ p: 2, mb: 2, width: '100%' }} elevation={3}>
        {/* form header with collapse button */}
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
        >
          <Typography variant="h6">{t.todos.addEdit}</Typography>
          <IconButton size="small" onClick={() => setFormOpen(false)}>
            <ExpandMoreIcon sx={{ transform: 'rotate(-90deg)' }} />
          </IconButton>
        </Box>
        <Stack spacing={2}>
          {/* name field now provides autocomplete based on existing todo names */}
          <Autocomplete
            freeSolo
            options={nameOptions}
            getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.name)}
            inputValue={todoActions.name}
            onInputChange={(_, v) => todoActions.setName(v)}
            onChange={(_, v) => {
              if (typeof v === 'string') {
                todoActions.setName(v);
              } else if (v && typeof v === 'object') {
                todoActions.setName(v.name);
                if (v.category) todoActions.setCategory(v.category);
              }
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
                }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: params.InputProps.endAdornment,
                }}
              />
            )}
          />
          <TextField
            label={t.todos.description}
            placeholder={t.todos.descriptionPlaceholder}
            value={todoActions.description}
            onChange={(e) => todoActions.setDescription(e.target.value)}
            fullWidth
            InputProps={{
              endAdornment: todoActions.description ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => todoActions.setDescription('')}
                    edge="end"
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          <TextField
            label={t.todos.quantity}
            type="number"
            value={todoActions.quantity}
            onClick={() => {
              setTempQuantity(todoActions.quantity || 1);
              setQuantityDialogOpen(true);
            }}
            onFocus={(e) => {
              setTempQuantity(todoActions.quantity || 1);
              setQuantityDialogOpen(true);
              (e.target as HTMLElement).blur();
            }}
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: true }}
            inputProps={{ min: 1 }}
            fullWidth
          />
          <TextField
            label={t.todos.comment}
            placeholder={t.todos.commentPlaceholder}
            value={todoActions.comment}
            onChange={(e) => todoActions.setComment(e.target.value)}
            fullWidth
            InputProps={{
              endAdornment: todoActions.comment ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => todoActions.setComment('')}
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
            value={todoActions.color}
            onChange={(e) => todoActions.setColor(e.target.value)}
            sx={{ width: 80 }}
          />
          <Autocomplete
            freeSolo
            options={categoryOptions}
            getOptionLabel={(opt) =>
              typeof opt === 'string' ? opt : opt.label || opt.value
            }
            value={
              todoActions.category === '' &&
              todoActions.clearedForName ===
                todoActions.name.trim().toLowerCase()
                ? null
                : availableCategories.find((c) => c.value === todoActions.category) ||
                  (todoActions.category
                    ? { value: todoActions.category, label: todoActions.category, icon: null }
                    : null)
            }
            inputValue={displayedCategory}
            onInputChange={(_, v, reason) => {
              if (reason === 'input') {
                todoActions.setCategoryManual(v);
              }
            }}
            onChange={(_, v) => {
              let val = '';
              if (typeof v === 'string') {
                val = v;
              } else if (v && typeof v === 'object') {
                val = v.value || '';
              }
              todoActions.setCategoryManual(val);
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
          {todoActions.categoryWarning && (
            <Box sx={{ mt: 1 }}>
              <Alert
                severity="warning"
                onClose={() => todoActions.setCategoryManual(todoActions.category)}
              >
                {todoActions.categoryWarning}
              </Alert>
            </Box>
          )}
          {/* if category text doesn't match existing, allow picking icon */}
          {todoActions.category &&
            !availableCategories.find((c) => c.value === todoActions.category) && (
              <CategoryIconPicker
                selected={tempIconKey}
                onChange={setTempIconKey}
              />
            )}
          <Stack direction="row" spacing="2">
            <Button variant="contained" onClick={handleAdd}>
              {todoActions.editingId ? t.todos.save : t.todos.add}
            </Button>
            {todoActions.editingId && (
              <Button
                variant="outlined"
                onClick={() => {
                  todoActions.setEditingId(null);
                  todoActions.setName('');
                  todoActions.setDescription('');
                  todoActions.setQuantity(1);
                  todoActions.setComment('');
                  todoActions.setColor(listDefaultColor);
                }}
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
      />
    </Collapse>
  );
}
