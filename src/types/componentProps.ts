export interface CategoryIconPickerProps {
  selected: string;
  onChange: (key: string) => void;
  title?: string;
}

export interface AuthPanelProps {
  t: TranslationKeys;
  formatMessage: (id: string, values?: any) => string;
  onSnackbar: (msg: string) => void;
}

export interface ListToolbarProps {
  lists: any[];
  currentListId: string | null;
  onSelectList: (id: string) => void;
  listsLoading?: boolean;
  listDefaultColor: string;
  setListDefaultColor: (color: string) => void;
  saveListColor: () => void;
  openNewListDialog: () => void;
  setHistoryOpen: (open: boolean) => void;
  formOpen: boolean;
  bulkMode: boolean;
  toggleBulkMode: () => void;
  menuAnchor: HTMLElement | null;
  openMenu: (e: React.MouseEvent<HTMLElement>) => void;
  closeMenu: () => void;
  setSnackbarMsg: (msg: string) => void;
  setSnackbarOpen: (open: boolean) => void;
  openPersonalDialog: () => void;
  completeCurrentList: () => void;
  updateShareToken: (id: string, token: string) => Promise<void>;
  updateBudget: (id: string, budget: number, currency?: string) => Promise<void>;
  updateStrictBudget: (id: string, strictBudget: boolean) => Promise<void>;
  onOpenBudgetOverview?: () => void;
  onAddCategoryWithBudget?: (budget?: number) => void;
  listType?: ListType | null;
  t: TranslationKeys;
  formatMessage: (id: string, values?: any) => string;
}

export interface SearchBulkProps {
  t: TranslationKeys;
  filterText: string;
  onFilterChange: (text: string) => void;
  bulkMode: boolean;
  selectedCount: number;
  onBulkComplete: () => void;
  onBulkDelete: () => void;
  onCancelBulk: () => void;
  categories?: Category[];
  currentCategory?: string;
  onCategoryChange?: (value: string) => void;
}

export interface HeaderProps {
  headerColor: string;
  effectiveHeaderTextColor: string;
  t: TranslationKeys;
  title?: string;
}
// Централизованные типы Props для компонентов
import type { Category } from '../constants';
import type { UseTodosReturn, UseListsReturn } from './hooks';
import type { ListType } from './list';
import type { StoredProduct } from './index';
import type { TranslationKeys } from '../locales/ru';

export interface AppSnackbarProps {
  open: boolean;
  message: string;
  severity?: 'success' | 'info' | 'warning' | 'error';
  onClose: () => void;
}

export interface TodoFormProps {
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
  dialogMode?: boolean;
  listType?: ListType | null;
  listId?: string | null;
  initialCategory?: string;
}

export interface TodoListProps {
  todoActions: UseTodosReturn;
  listActions: UseListsReturn;
  availableCategories: Category[];
  t: TranslationKeys;
  listType?: ListType | null;
  onEdit?: () => void;
  onAddToCategory?: (category: string) => void;
  onEditCategory?: (category: string) => void;
  onDeleteCategory?: (category: string) => void;
}

export interface TodoListItemProps {
  todo: any; // Заменить на Todo, если тип доступен
  globalIndex: number;
  todoActions: UseTodosReturn;
  listActions: UseListsReturn;
  availableCategories: Category[];
  t: TranslationKeys;
  onEdit?: () => void;
}
