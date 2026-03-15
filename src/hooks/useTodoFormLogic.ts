import * as React from 'react';
import { useAppStore } from '../stores/useAppStore';
import { useSpeechRecognition } from './useSpeechRecognition';
import { compressImage } from '@/utils/compressImage';
import { parseSmartInput, inferCategorySmart, ParsedInput } from '@/utils/parseSmartInput';
import { convertNumberWordsToDigits } from '@/utils/convertNumberWords';
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
}: UseTodoFormLogicParams) {
  const language = useAppStore((s) => s.language);

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

  const { isListening, supported: speechSupported, start: startListening, stop: stopListening } =
    useSpeechRecognition(language, (transcript) => {
      const converted = convertNumberWordsToDigits(transcript, language);
      const capitalized = capitalize(converted);
      setName(capitalized);
      const p = parseSmartInput(converted, language);
      setParsed(p);
      try {
        setUnit(p?.unit || '');
      } catch {
        // ignore
      }
    });

  const ensureCategoryExists = React.useCallback(
    async (val: string, iconKey?: string) => {
      const v = val.trim();
      if (!v) return;
      setAvailableCategories((prev) => {
        if (prev.find((c) => c.value === v)) return prev;
        let finalKey = iconKey;
        if (!finalKey) {
          finalKey = Object.keys(iconMap).find((k) => k.toLowerCase() === v.toLowerCase());
        }
        const newCat: Category = {
          value: v,
          label:
            (t.categoryLabels as Record<string, string>)?.[v] ||
            iconChoices.find((x) => x.key === v)?.label ||
            v,
          icon: finalKey ? iconMap[finalKey] : null,
          listId: listId || undefined,
        };
        return [...prev, newCat];
      });
    },
    [setAvailableCategories, t, listId]
  );

  const handleAdd = React.useCallback(
    async (override?: Partial<{ name: string; quantity: number; comment: string; category: string; unit: string; image: string }>) => {
      let p: Partial<{ name: string; quantity: number; comment: string; category: string; unit: string; image: string }> | ParsedInput | null =
        override ?? parsed ?? parseSmartInput(name || '', language);

      let finalCategory: string | undefined;
      if (p && override?.category === undefined && (!p.category || p.category === 'none')) {
        finalCategory = await inferCategorySmart(p.name || name || '', language);
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
        if (finalCategory) setCategory(finalCategory);
      }

      if (name) setName(capitalize(name));

      await ensureCategoryExists(category, tempIconKey || undefined);

      const overridePayload: Partial<{ name: string; quantity: number; comment: string; category: string; unit: string; image: string }> = {};
      if (p) {
        if (p.name) overridePayload.name = capitalize(p.name);
        if (p.quantity != null) overridePayload.quantity = p.quantity;
        if (p.comment) overridePayload.comment = p.comment;
        if (p.unit) overridePayload.unit = p.unit;
        if (finalCategory) overridePayload.category = finalCategory;
        if (override?.image) overridePayload.image = override.image;
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
    [language, todoActions]
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
