import * as React from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  IconButton,
  Collapse,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  useMediaQuery,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';
import { iconMap, iconChoices } from '@/constants';
import { useNameOptions } from '@/hooks/useNameOptions';
import { useCategoryOptions } from '@/hooks/useCategoryOptions';
import { useTodoFormLogic } from '@/hooks/useTodoFormLogic';

import TodoFormNameSection from './TodoFormNameSection';
import TodoFormDetailsSection from './TodoFormDetailsSection';
import TodoFormCategorySection from './TodoFormCategorySection';
import TodoFormFooter from './TodoFormFooter';
import ConfirmCategoryDialog from './ConfirmCategoryDialog';
import type { TodoFormProps } from '@/types/componentProps';
import type { UseTodosReturn } from '@/types/hooks';

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
  listType = null,
  listId = null,
  initialCategory,
}: TodoFormProps) {
  // local state needed by the form (icon picker + quantity dialog)
  // language context no longer required for parsing
  const namePlaceholder =
    listType === 'expenses'
      ? t.todos.namePlaceholderExpenses
      : listType === 'todo'
      ? t.todos.namePlaceholderTodo
      : t.todos.namePlaceholderShopping || t.todos.namePlaceholder;

  const {
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
    ensureCategoryExists,
    handleAdd,
    handleImageChange,
    handleInferCategory,
  } = useTodoFormLogic({
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
    dialogMode,
    listType,
    listId,
    initialCategory,
  });

  // pick only the pieces we need from the todoActions object
  const theme = useTheme();
  const fullScreenDialog = useMediaQuery(theme.breakpoints.down('sm'));


  const {
    name,
    description,
    quantity,
    comment,
    unit,
    amount,
    spentAt,
    dueDate,
    priority,
    reminderAt,
    category,
    editingId,
    todos,
    clearedForName,
    todosLoading,
    setName,
    setDescription,
    setQuantity,
    setComment,
    setUnit,
    setAmount,
    setSpentAt,
    setDueDate,
    setPriority,
    setReminderAt,
    setColor,
    setCategory,
    setCategoryManual,
    categoryWarning,
    setEditingId,
  } = todoActions as UseTodosReturn;


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
  }, [category, availableCategories, setTempIconKey]);

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
    language,
  });

  // info for preview area: prefer parser's category but map to
  // a human-readable label and pick an icon when available
  const previewCategory = React.useMemo(() => {
    const cat = parsed?.category || category;
    if (!cat) return { label: '', Icon: null as React.ElementType | null };
    const localized = (t.categoryLabels as Record<string, string>)?.[cat];
    const found = availableCategories.find((c) => c.value === cat);

    // Prefer a localized label for built-in categories so UI matches current locale.
    if (localized) {
      const Icon = found?.icon || iconChoices.find((x) => x.key === cat)?.icon || null;
      return { label: localized, Icon };
    }

    // Fall back to user-provided category label (may be custom)
    if (found) return { label: found.label, Icon: found.icon };

    // Finally fall back to iconChoices default label
    const choice = iconChoices.find((x) => x.key === cat);
    if (choice) return { label: choice.label, Icon: choice.icon };
    return { label: cat, Icon: null };
  }, [parsed, category, availableCategories, t]);

  // build inner form container once so dialog/inline both use same markup
  const formInner = (
    <>
      <Paper className="glass" sx={{ p: 1, mb: 1, width: '100%', borderRadius: 2 }} elevation={0}>
        {/* form header with collapse button - hidden when dialogMode because dialog title shows it */}
          {!dialogMode && (
          <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 0.5,
            pb: 0.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {editingId ? t.todos.editTask || t.todos.addEdit : t.todos.addTask || t.todos.addEdit}
          </Typography>
          <IconButton size="small" onClick={() => setFormOpen(false)} disabled={todosLoading} aria-label={t.todos.cancel} title={t.todos.cancel}>
            <ExpandMoreIcon sx={{ transform: 'rotate(-90deg)' }} />
          </IconButton>
        </Box>
      )}
      {todosLoading && <LinearProgress />}
      <Stack
        spacing={1}
        sx={{
          opacity: todosLoading ? 0.5 : 1,
          pointerEvents: todosLoading ? 'none' : undefined,
        }}
      >
        <TodoFormNameSection
          name={name}
          setName={setName}
          nameOptions={nameOptions}
          namePlaceholder={namePlaceholder}
          language={language}
          t={t}
          parsed={parsed}
          setParsed={setParsed}
          setUnit={setUnit}
          handleInferCategory={handleInferCategory}
          handleAdd={handleAdd}
          speechSupported={speechSupported}
          isListening={isListening}
          startListening={startListening}
          stopListening={stopListening}
          todosLoading={todosLoading}
          category={category}
          setCategory={setCategory}
          previewCategory={previewCategory}
          description={description}
          comment={comment}
          quantity={quantity}
          unit={unit}
          setPendingParsed={setPendingParsed}
          setConfirmCategoryOpen={setConfirmCategoryOpen}
        />
        <TodoFormDetailsSection
          listType={listType}
          description={description}
          setDescription={setDescription}
          quantity={quantity}
          setQuantity={setQuantity}
          comment={comment}
          setComment={setComment}
          unit={unit}
          setUnit={setUnit}
          amount={amount}
          setAmount={setAmount}
          spentAt={spentAt}
          setSpentAt={setSpentAt}
          dueDate={dueDate}
          setDueDate={setDueDate}
          priority={priority}
          setPriority={setPriority}
          reminderAt={reminderAt}
          setReminderAt={setReminderAt}
          language={language}
          t={t}
          imageData={imageData}
          setImageData={setImageData}
          imagePreviewOpen={imagePreviewOpen}
          setImagePreviewOpen={setImagePreviewOpen}
          handleImageChange={handleImageChange}
          quantityDialogOpen={quantityDialogOpen}
          setQuantityDialogOpen={setQuantityDialogOpen}
          tempQuantity={tempQuantity}
          setTempQuantity={setTempQuantity}
        />

        <TodoFormCategorySection
          category={category}
          setCategoryManual={setCategoryManual}
          availableCategories={availableCategories}
          categoryOptions={categoryOptions}
          t={t}
          language={language}
          ensureCategoryExists={ensureCategoryExists}
          tempIconKey={tempIconKey}
          setTempIconKey={setTempIconKey}
          categoryWarning={categoryWarning}
        />

        <TodoFormFooter
          editingId={editingId}
          handleAdd={handleAdd}
          setEditingId={setEditingId}
          setName={setName}
          setDescription={setDescription}
          setQuantity={setQuantity}
          setComment={setComment}
          setColor={setColor}
          listDefaultColor={listDefaultColor}
          setFormOpen={setFormOpen}
          t={t}
        />

      </Stack>
      </Paper>
      <ConfirmCategoryDialog
        open={confirmCategoryOpen}
        onClose={() => setConfirmCategoryOpen(false)}
        pendingParsed={pendingParsed}
        setPendingParsed={setPendingParsed}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
        availableCategories={availableCategories}
        categoryOptions={categoryOptions}
        t={t}
        language={language}
        ensureCategoryExists={ensureCategoryExists}
        handleAdd={handleAdd}
        tempIconKey={tempIconKey}
        setTempIconKey={setTempIconKey}
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
        fullScreen={fullScreenDialog}
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
    <Collapse
      in={formOpen}
      timeout={{
        enter: 400,
        exit: 300,
      }}
      easing={{
        enter: 'cubic-bezier(0.4, 0, 0.2, 1)',
        exit: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {formInner}
    </Collapse>
  );
}
