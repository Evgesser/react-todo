import * as React from 'react';
import { useAppStore } from '../stores/useAppStore';
import { useSpeechRecognition } from './useSpeechRecognition';
import { compressImage } from '@/utils/compressImage';
import { parseSmartInput, inferCategorySmart, ParsedInput } from '@/utils/parseSmartInput';
import { convertNumberWordsToDigits } from '@/utils/convertNumberWords';
import { v4 as uuidv4 } from 'uuid';
import type { Category } from '@/constants';
import { iconChoices, iconMap } from '@/constants';
import type { TranslationKeys } from '@/locales/ru';
import type { UseTodosReturn } from '@/types/hooks';

export interface UseTodoFormLogicParams {
  todoActions: UseTodosReturn;
  availableCategories: Category[];
  setAvailableCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  updateNameCategory: (name: string, category: string, comment: string) => void;
  nameCategoryMap: Record<string, string>;
  products: Array<{ name: string; category?: string }>;
  listDefaultColor: string;
  t: TranslationKeys;
  formOpen: boolean;
  setFormOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dialogMode?: boolean;
  listType?: string | null;
  listId?: string | null;
  initialCategory?: string;
  smartEnabled?: boolean;
  categoryLocked?: boolean;
}

export function useTodoFormLogic({
  todoActions,
  availableCategories: _availableCategories,
  setAvailableCategories,
  updateNameCategory,
  nameCategoryMap: _nameCategoryMap,
  products: _products,
  listDefaultColor,
  t,
  formOpen,
  setFormOpen,
  dialogMode = false,
  listType: _listType = null,
  listId = null,
  initialCategory,
  smartEnabled = true,
  categoryLocked = false,
}: UseTodoFormLogicParams) {
  const language = useAppStore((s) => s.language);
  const isSmartEnabled = smartEnabled;

  // These are passed for future flexibility (e.g. smarter suggestions) and may be
  // used once the logic expands.
  void _availableCategories;
  void _nameCategoryMap;
  void _products;
  void _listType;

  const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

  const [tempIconKey, setTempIconKey] = React.useState('');
  const [parsed, setParsed] = React.useState<ParsedInput | null>(null);
  const [quantityDialogOpen, setQuantityDialogOpen] = React.useState(false);
  const [tempQuantity, setTempQuantity] = React.useState<number>(todoActions.quantity || 1);
  const [confirmCategoryOpen, setConfirmCategoryOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [pendingParsed, setPendingParsed] = React.useState<{
    name: string;
    category: string;
    quantity: number;
    unit: string;
    comment: string;
  } | null>(null);

  const [imageData, setImageData] = React.useState<string | null>(null);
  const [imagePreviewOpen, setImagePreviewOpen] = React.useState(false);

  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const { name, category, comment, setName, setQuantity, setComment, setUnit, setCategory } =
    todoActions as UseTodosReturn;

  const handleSpeechResult = React.useCallback(
    (transcript: string) => {
      const converted = convertNumberWordsToDigits(transcript, language);
      const capitalized = capitalize(converted);
      setName(capitalized);
      if (isSmartEnabled) {
        const p = parseSmartInput(converted, language);
        setParsed(p);
        try {
          setUnit(p?.unit || '');
        } catch {
          // ignore
        }
      }
    },
    [language, setName, setParsed, setUnit, capitalize, isSmartEnabled]
  );

  const { isListening, supported: speechSupported, start: startListening, stop: stopListening } =
    useSpeechRecognition(language, handleSpeechResult);

  const ensureCategoryExists = React.useCallback(
    async (val: string, iconKey?: string) => {
      const v = val.trim();
      if (!v) return null;

      const existingByValue = _availableCategories.find((c) => c.value === v);
      const existingByLabel = _availableCategories.find(
        (c) => c.label.trim().toLowerCase() === v.toLowerCase()
      );

      if (existingByValue) return existingByValue.value;
      if (existingByLabel) return existingByLabel.value;

      let finalKey = iconKey;
      if (!finalKey) {
        finalKey = Object.keys(iconMap).find((k) => k.toLowerCase() === v.toLowerCase());
      }

      const label =
        (t.categoryLabels as Record<string, string>)?.[v] ||
        iconChoices.find((x) => x.key === v)?.label ||
        v;

      // Double check if the resolved label already exists to avoid duplicates after translation
      const existingByResolvedLabel = _availableCategories.find(
        (c) => c.label.trim().toLowerCase() === label.trim().toLowerCase()
      );
      if (existingByResolvedLabel) {
        return existingByResolvedLabel.value;
      }

      const newValue = uuidv4();
      const newCat: Category = {
        value: newValue,
        label,
        icon: finalKey ? iconMap[finalKey] : null,
        listId: listId || undefined,
      };

      setAvailableCategories((prev) => [...prev, newCat]);
      return newValue;
    },
    [_availableCategories, setAvailableCategories, t, listId]
  );

  const handleAdd = React.useCallback(
    async (override?: Partial<{ name: string; quantity: number; comment: string; category: string; unit: string; image: string }>) => {
      let p: Partial<{ name: string; quantity: number; comment: string; category: string; unit: string; image: string }> | ParsedInput | null =
        override ?? parsed ?? (isSmartEnabled ? parseSmartInput(name || '', language) : null);

      let finalCategory: string | undefined;
      if (!categoryLocked && isSmartEnabled && p && override?.category === undefined && (!p.category || p.category === 'none')) {
        finalCategory = await inferCategorySmart(p.name || name || '', language);
      }
      if (categoryLocked) {
        finalCategory = category; // preserve locked category
      }

      if (!p && (name || '').trim().includes(' ')) {
        const parts = (name || '').trim().split(/\s+/);
        const first = parts.shift() || '';
        p = { name: first, quantity: 1, comment: parts.join(' ') };
      }

      if (p) {
        setName(capitalize(p.name || ''));
        setQuantity(p.quantity ?? 1);
        setComment(p.comment || '');
        setUnit(p.unit || '');
        finalCategory = p.category ?? finalCategory;
        if (!categoryLocked && finalCategory) setCategory(finalCategory);
      }

      if (name) setName(capitalize(name));

      const actualCategoryValue = await ensureCategoryExists(category, tempIconKey || undefined);

      const overridePayload: Partial<{ name: string; quantity: number; comment: string; category: string; unit: string; image: string }> = {};
      if (p) {
        if (p.name) overridePayload.name = capitalize(p.name);
        if (p.quantity != null) overridePayload.quantity = p.quantity;
        if (p.comment) overridePayload.comment = p.comment;
        if (p.unit) overridePayload.unit = p.unit;
        if (finalCategory) {
          // If we just resolved a custom name to a UUID, use that UUID
          overridePayload.category = (finalCategory === category && actualCategoryValue) 
            ? actualCategoryValue 
            : finalCategory;
        }
        if (override?.image) overridePayload.image = override.image;
      }
      
      // Fallback for non-parsed or simple adds
      if (!overridePayload.category && (actualCategoryValue || category)) {
        overridePayload.category = actualCategoryValue || category;
      }

      if (imageData) overridePayload.image = imageData;

      await todoActions.addItem(overridePayload);
      updateNameCategory(
        overridePayload.name || name || '',
        overridePayload.category || category || '',
        overridePayload.comment || comment || ''
      );

      setTempIconKey('');
      setParsed(null);
      setImageData(null);

      if (dialogMode) setFormOpen(false);
    },
    [
      ensureCategoryExists,
      todoActions,
      setName,
      setQuantity,
      setComment,
      setUnit,
      setCategory,
      name,
      category,
      comment,
      tempIconKey,
      updateNameCategory,
      parsed,
      imageData,
      dialogMode,
      setFormOpen,
      language,
    ]
  );

  const handleImageChange = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const data = await compressImage(file);
      setImageData(data);
    },
    []
  );

  const handleInferCategory = React.useCallback(
    (text: string) => {
      if (categoryLocked) return;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current as unknown as number);
      }
      if (text.trim().length > 2) {
        debounceTimerRef.current = setTimeout(async () => {
          const cat = await inferCategorySmart(text, language);
          if (cat) todoActions.setCategory(cat);
        }, 500);
      }
    },
    [language, todoActions, categoryLocked]
  );

  React.useEffect(() => {
    if (!formOpen) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current as unknown as number);
        debounceTimerRef.current = null;
      }
      stopListening();
      setParsed(null);
      setImageData(null);
      setTempIconKey('');
      if (!todoActions.editingId) {
        setName('');
        todoActions.setDescription('');
        setQuantity(1);
        setComment('');
        setUnit('');
        todoActions.setColor(listDefaultColor);
        setCategory('');
      }
    } else if (!todoActions.editingId && formOpen && initialCategory) {
      setCategory(initialCategory);
    }
  }, [
    formOpen,
    dialogMode,
    listDefaultColor,
    initialCategory,
    stopListening,
    setParsed,
    setImageData,
    setTempIconKey,
    setName,
    setQuantity,
    setComment,
    setUnit,
    setCategory,
    todoActions,
  ]);

  React.useEffect(() => {
    if (dialogMode && formOpen) {
      const prevBody = document.body.style.overflow;
      const prevHtml = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevBody;
        document.documentElement.style.overflow = prevHtml;
      };
    }
    return undefined;
  }, [dialogMode, formOpen]);

  const ensureCategoryExistsMemo = React.useMemo(() => ensureCategoryExists, [ensureCategoryExists]);

  return {
    language,
    tempIconKey,
    setTempIconKey,
    parsed,
    setParsed,
    quantityDialogOpen,
    setQuantityDialogOpen,
    tempQuantity,
    setTempQuantity,
    confirmCategoryOpen,
    setConfirmCategoryOpen,
    isSubmitting,
    setIsSubmitting,
    pendingParsed,
    setPendingParsed,
    imageData,
    setImageData,
    imagePreviewOpen,
    setImagePreviewOpen,
    speechSupported,
    isListening,
    startListening,
    stopListening,
    ensureCategoryExists: ensureCategoryExistsMemo,
    handleAdd,
    handleImageChange,
    handleInferCategory,
  };
}
