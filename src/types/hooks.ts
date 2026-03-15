// Централизованные типы для хуков
import type { List as ListDoc, ListType } from './list';
import type { Category } from '../constants';
import type { TranslationKeys } from '../locales/ru';
import type { Todo } from './todo';
import type { IntlShape } from 'react-intl';

type FormatMessageValues = Parameters<IntlShape['formatMessage']>[1];

export interface UseTodosParams {
  currentListId: string | null;
  listDefaultColor: string;
  listType?: ListType | null;
  listBudget?: number;
  strictBudget?: boolean;
  categoryBudgets?: Record<string, number>;
  categoryStrictBudgets?: Record<string, boolean>;
  categoryExchangeRates?: Record<string, number>;
  listCurrency?: string;
  onSnackbar: (message: string) => void;
  t: TranslationKeys;
  formatMessage?: (id: string, values?: FormatMessageValues) => string;
  nameCategoryMap?: Record<string, string>;
  products?: Array<{ name: string; category?: string }>;
}

export interface AddOverride {
  name?: string;
  description?: string;
  quantity?: number;
  comment?: string;
  unit?: string;
  color?: string;
  category?: string;
}

export interface UseTodosReturn {
  // State
  todos: Todo[];
  todosLoading: boolean;
  name: string;
  description: string;
  quantity: number;
  comment: string;
  unit: string;
  color: string;
  amount?: number;
  spentAt: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | '';
  reminderAt: string;
  category: string;
  editingId: string | null;
  filterText: string;
  filterCategory: string;
  bulkMode: boolean;
  selectedIds: Set<string>;
  inlineEditId: string | null;
  inlineName: string;
  inlineDescription: string;
  lastAdded: string | null;
  // warning/auxiliaries
  categoryWarning: string;
  clearedForName: string | null;
  dragOverIndex: number | null;
  pendingCompleteIds: Set<string>;
  reorderInFlight: boolean;

  // Setters
  setTodos: (todos: Todo[] | ((prev: Todo[]) => Todo[])) => void;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setQuantity: (quantity: number) => void;
  setComment: (comment: string) => void;
  setUnit: (unit: string) => void;
  setColor: (color: string) => void;
  setAmount: (amount?: number) => void;
  setSpentAt: (date: string) => void;
  setDueDate: (date: string) => void;
  setPriority: (priority: 'low' | 'medium' | 'high' | '') => void;
  setReminderAt: (dateTime: string) => void;
  setCategory: (category: string) => void;
  setCategoryManual: (category: string) => void;
  setEditingId: (id: string | null) => void;
  setFilterText: (text: string) => void;
  setFilterCategory: (category: string) => void;
  setBulkMode: (mode: boolean) => void;
  setSelectedIds: (ids: Set<string>) => void;
  setInlineEditId: (id: string | null) => void;
  setInlineName: (name: string) => void;
  setInlineDescription: (description: string) => void;
  setLastAdded: (name: string | null) => void;

  // Methods
  fetchTodos: (listId: string, category?: string, silent?: boolean) => Promise<void>;
  addItem: (override?: AddOverride) => Promise<void>;
  toggleComplete: (todo: Todo) => Promise<void>;
  toggleMissing: (todo: Todo) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  moveTodosCategory: (fromCategory: string, toCategory: string) => Promise<void>;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  bulkComplete: () => Promise<void>;
  bulkDelete: () => Promise<void>;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent, index: number) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, dropIndex: number) => void;
  onTouchStart: (e: React.TouchEvent, index: number) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent, dropIndex: number) => void;
  startInlineEdit: (todo: Todo) => void;
  finishInlineEdit: (todo: Todo) => Promise<void>;
  moveCategory: (category: string, direction: 'up' | 'down') => Promise<void>;
}

export interface UseAuthReturn {
  // State
  userId: string | null;
  username: string | null;
  avatar: string | null;
  isLoading: boolean;
  error: string | null;

  // Methods
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  setAuthData: (userId: string, username: string, avatar?: string) => void;
  loadAvatar: (userId: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export interface UseTodoFormParams {
  todoActions: UseTodosReturn;
  availableCategories: Category[];
  setAvailableCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  updateNameCategory: (name: string, category: string, comment: string) => void;
  t: TranslationKeys;
}

export interface UseTodoFormReturn {
  tempIconKey: string;
  setTempIconKey: React.Dispatch<React.SetStateAction<string>>;
  ensureCategoryExists: (val: string, iconKey?: string) => Promise<void>;
  displayedCategory: string;
  handleAdd: () => Promise<void>;
}

export interface UseListsParams {
  userId: string | null;
  listType?: ListType | null;
  onSnackbar: (message: string) => void;
  t?: TranslationKeys;
  formatMessage: (id: string, values?: FormatMessageValues) => string;
}

export interface UseListsReturn {
  // State
  lists: ListDoc[];
  currentListId: string | null;
  currentList: ListDoc | null;
  listDefaultColor: string;
  viewingHistory: boolean;
  isLoading: boolean;

  // Setters
  setLists: (lists: ListDoc[]) => void;
  setCurrentListId: (id: string | null) => void;
  setCurrentList: (list: ListDoc | null) => void;
  setListDefaultColor: (color: string) => void;
  setViewingHistory: (viewing: boolean) => void;

  // Methods
  loadLists: () => Promise<ListDoc[] | null>;
  selectList: (id: string) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  updateListColor: (id: string, color: string) => Promise<void>;
  updateListBudget: (id: string, budget: number, currency?: string) => Promise<void>;
  updateListStrictBudget: (id: string, strictBudget: boolean) => Promise<void>;
  updateShareToken: (id: string, token: string) => Promise<void>;
  completeList: (id: string) => Promise<void>;
  clearAllLists: () => void;
}

// Добавьте другие интерфейсы хуков по мере необходимости
