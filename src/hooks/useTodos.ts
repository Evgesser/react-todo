import * as React from 'react';
import { Todo } from '@/types';
import {
  fetchTodos as apiFetchTodos,
  createTodo as apiCreateTodo,
  updateTodo as apiUpdateTodo,
  deleteTodo as apiDeleteTodo,
} from '@/lib/api';
import { TranslationKeys } from '@/locales/ru';

interface UseTodosParams {
  currentListId: string | null;
  listDefaultColor: string;
  onSnackbar: (message: string) => void;
  t: TranslationKeys;
  // optional global name->category mapping for inference
  nameCategoryMap?: Record<string, string>;
}

interface UseTodosReturn {
  // State
  todos: Todo[];
  name: string;
  description: string;
  quantity: number;
  comment: string;
  color: string;
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
  // missing flag is stored on individual todos; form doesn't need its own state

  // Setters
  setTodos: (todos: Todo[] | ((prev: Todo[]) => Todo[])) => void;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setQuantity: (quantity: number) => void;
  setComment: (comment: string) => void;
  setColor: (color: string) => void;
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
  fetchTodos: (listId: string, category?: string) => Promise<void>;
  addItem: () => Promise<void>;
  toggleComplete: (todo: Todo) => Promise<void>;
  toggleMissing: (todo: Todo) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  bulkComplete: () => Promise<void>;
  bulkDelete: () => Promise<void>;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, dropIndex: number) => void;
  onTouchStart: (e: React.TouchEvent, index: number) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent, dropIndex: number) => void;
  startInlineEdit: (todo: Todo) => void;
  finishInlineEdit: (todo: Todo) => Promise<void>;
  moveCategory: (category: string, direction: 'up' | 'down') => Promise<void>;
}

export function useTodos(params: UseTodosParams): UseTodosReturn {
  const { currentListId, listDefaultColor, onSnackbar, t, nameCategoryMap } = params;

  // Todo list state
  const [todos, setTodos] = React.useState<Todo[]>([]);

  // Form state
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [quantity, setQuantity] = React.useState(1);
  const [comment, setComment] = React.useState('');
  const [color, setColor] = React.useState('#ffffff');
  // category selected in add/edit form
  const [category, setCategoryState] = React.useState('');
  // remember which name triggered automatic assignment
  const [autoAssignedFor, setAutoAssignedFor] = React.useState<string | null>(null);
  const [categoryWarning, setCategoryWarning] = React.useState('');
  const [clearedForName, setClearedForName] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // filter state (used by search toolbar) – kept separate so form changes
  // don't affect the list filter
  const [filterCategory, setFilterCategory] = React.useState('');

  // when the name field changes, try to infer a category from existing todos
  // (only for new items, not when editing an existing one).  this implements:
  // "если товар уже существует в какой‑то категории, то он сразу подставится".
  React.useEffect(() => {
    if (!name.trim()) return;
    // if user explicitly cleared this name and hasn't changed it yet, do not reassign
    const lower = name.trim().toLowerCase();
    if (clearedForName === lower) {
      return;
    }
    if (category && category.trim()) return; // user already picked

    // first check global map
    if (nameCategoryMap && nameCategoryMap[lower]) {
      const assigned = nameCategoryMap[lower];
      setCategoryState(assigned);
      setAutoAssignedFor(lower);
      return;
    }

    const match = todos.find(
      (t) =>
        t.name.trim().toLowerCase() === lower &&
        t.category &&
        t.category.trim() &&
        t._id !== editingId // don't match the item we're currently editing
    );
    if (match && match.category) {
      setCategoryState(match.category);
      setAutoAssignedFor(lower);
    }
  }, [name, todos, editingId, category, nameCategoryMap, clearedForName]);

  // Search/filter state
  const [filterText, setFilterText] = React.useState('');
  // note: filterCategory is defined above

  // Bulk operations state
  const [bulkMode, setBulkMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Inline editing state
  const [inlineEditId, setInlineEditId] = React.useState<string | null>(null);
  const [inlineName, setInlineName] = React.useState('');
  const [inlineDescription, setInlineDescription] = React.useState('');

  // UI state
  const [lastAdded, setLastAdded] = React.useState<string | null>(null);
  const [touchDragIndex, setTouchDragIndex] = React.useState<number | null>(null);

  // Handle click outside inline edit
  React.useEffect(() => {
    if (!inlineEditId) return;
    const handleClick = (e: MouseEvent) => {
      const root = document.querySelector(`[data-inline-edit-root="${inlineEditId}"]`);
      if (root && !root.contains(e.target as Node)) {
        setInlineEditId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [inlineEditId]);

  // Fetch todos from API
  const fetchTodos = async (listId: string, categoryParam?: string) => {
    if (!listId) return;
    try {
      // use explicit parameter first, otherwise fall back to filterCategory (not form
      // category, which is unrelated to filtering)
      const cat = typeof categoryParam === 'undefined' ? filterCategory : categoryParam;
      const data = await apiFetchTodos(listId, cat);
      setTodos((prev) =>
        data.map((t: Todo) => {
          const incomingColor = typeof t.color === 'string' ? t.color : '';
          const preservedColor =
            incomingColor && incomingColor.trim() !== ''
              ? incomingColor
              : prev.find((p) => p._id === t._id)?.color || '';
          const incomingCat = typeof t.category === 'string' ? t.category : '';
          const preservedCat =
            incomingCat && incomingCat.trim() !== ''
              ? incomingCat
              : prev.find((p) => p._id === t._id)?.category || '';
          return { ...t, color: preservedColor, category: preservedCat } as Todo;
        })
      );
    } catch {
      // Error handling could be added here
    }
  };

  // Add or update a todo item
  const addItem = async () => {
    if (!name.trim() || !currentListId) return;
    const payload: Partial<Todo> & { listId: string } = {
      listId: currentListId,
      name: name.trim(),
      description: description.trim(),
      quantity,
      comment: comment.trim(),
      color,
      category,
    };
    // when editing, preserve the missing flag if it already existed
    if (editingId) {
      const existing = todos.find((t) => t._id === editingId);
      if (existing && existing.missing) {
        payload.missing = true;
      }
    }
    let result: Partial<Todo> | null = null;

    if (editingId) {
      const ok = await apiUpdateTodo(editingId, { ...payload, listId: currentListId });
      if (ok) {
        // Update will be reflected in fetchTodos
      }
    } else {
      result = await apiCreateTodo(payload);
    }

    if (editingId || result) {
      const addedName = name.trim();
      setTodos((prev) => {
        if (editingId) {
          return prev.map((t) =>
            t._id === editingId
              ? {
                  ...t,
                  ...(result || {}),
                  color:
                    typeof result?.color === 'string' && result.color.trim() !== ''
                      ? result.color
                      : payload.color || t.color,
                  category:
                    typeof result?.category === 'string' && result.category.trim() !== ''
                      ? result.category
                      : payload.category || t.category,
                }
              : t
          );
        }
        const incoming = result as Todo;
        const newItem: Todo = {
          ...incoming,
          color:
            typeof incoming?.color === 'string' && incoming.color.trim() !== ''
              ? incoming.color
              : payload.color || '#ffffff',
          category:
            typeof incoming?.category === 'string' && incoming.category.trim() !== ''
              ? incoming.category
              : payload.category || '',
        } as Todo;
        return [...prev, newItem];
      });

      setName('');
      setDescription('');
      setQuantity(1);
      setComment('');
      setColor(listDefaultColor);
      setCategoryState('');
    setAutoAssignedFor(null);
      setEditingId(null);
      setLastAdded(addedName);
      onSnackbar(editingId ? t.messages.itemUpdated : t.messages.itemAdded);
      if (currentListId) {
        await fetchTodos(currentListId);
      }
    }
  };

  // Toggle todo completion status
  const toggleComplete = async (todo: Todo) => {
    if (!currentListId) return;
    await apiUpdateTodo(todo._id, { listId: currentListId, completed: !todo.completed });
    await fetchTodos(currentListId);
  };

  // Toggle missing/unavailable status
  const toggleMissing = async (todo: Todo) => {
    if (!currentListId) return;
    await apiUpdateTodo(todo._id, { listId: currentListId, missing: !todo.missing });
    if (todo.missing) {
      onSnackbar(t.messages.itemUnmarkedMissing || '');
    } else {
      onSnackbar(t.messages.itemMarkedMissing || '');
    }
    await fetchTodos(currentListId);
  };

  // Move an entire category block up or down in the ordering.  We recompute a
  // new order array by swapping the category positions and then persist the
  // sequential order values back to the server.
  const moveCategory = async (category: string, direction: 'up' | 'down') => {
    console.log('moveCategory called', category, direction, { todos });
    if (!currentListId) {
      console.warn('no list id');
      return;
    }
    // sort todos by current order
    const sorted = [...todos].sort((a, b) => (a.order || 0) - (b.order || 0));
    // form blocks of contiguous same-category items
    type Block = { category: string; items: Todo[] };
    const blocks: Block[] = [];
    sorted.forEach((t) => {
      const cat = t.category || '';
      if (blocks.length === 0 || blocks[blocks.length - 1].category !== cat) {
        blocks.push({ category: cat, items: [t] });
      } else {
        blocks[blocks.length - 1].items.push(t);
      }
    });
    console.log('initial blocks', blocks.map((b) => b.category));
    const blockIdx = blocks.findIndex((b) => b.category === category);
    if (blockIdx === -1) {
      console.warn('category block not found', category);
      return;
    }
    const targetIdx = direction === 'up' ? blockIdx - 1 : blockIdx + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) {
      console.warn('block move out of bounds', blockIdx, targetIdx, blocks.length);
      return;
    }
    [blocks[blockIdx], blocks[targetIdx]] = [blocks[targetIdx], blocks[blockIdx]];
    console.log('blocks after swap', blocks.map((b) => b.category));
    const newOrder = blocks.flatMap((b) => b.items.slice());
    newOrder.forEach((t, i) => {
      t.order = i;
    });
    console.log('newOrder sequence', newOrder.map((t) => ({ id: t._id, cat: t.category, order: t.order })));
    setTodos(newOrder);
    await Promise.all(
      newOrder.map((t, i) => apiUpdateTodo(t._id, { listId: currentListId, order: i }))
    );
    if (currentListId) {
      await fetchTodos(currentListId);
    }
  };

  // Delete a todo
  const deleteTodo = async (id: string) => {
    if (!currentListId) return;
    await apiDeleteTodo(id, currentListId);
    await fetchTodos(currentListId);
  };

  // Toggle selection for bulk operations
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  // Clear all selections
  const clearSelection = () => setSelectedIds(new Set());

  // Complete all selected todos
  const bulkComplete = async () => {
    if (!currentListId) return;
    const ids = Array.from(selectedIds);
    await Promise.all(
      ids.map((id) => apiUpdateTodo(id, { listId: currentListId, completed: true }))
    );
    clearSelection();
    setBulkMode(false);
    await fetchTodos(currentListId);
  };

  // Delete all selected todos
  const bulkDelete = async () => {
    if (!currentListId) return;
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) => apiDeleteTodo(id, currentListId)));
    clearSelection();
    setBulkMode(false);
    await fetchTodos(currentListId);
  };

  // Drag and drop handlers
  const onDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  const onDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const startIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(startIndex)) return;
    setTodos((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(startIndex, 1);
      copy.splice(dropIndex, 0, moved);
      // Persist order to server
      if (currentListId) {
        copy.forEach((t, idx) => {
          apiUpdateTodo(t._id, { listId: currentListId, order: idx });
        });
      }
      return copy;
    });
  };

  // Touch drag and drop handlers
  const onTouchStart = (e: React.TouchEvent, index: number) => {
    setTouchDragIndex(index);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    // Prevent default scrolling while dragging
    if (touchDragIndex !== null) {
      e.preventDefault();
    }
  };

  const onTouchEnd = (e: React.TouchEvent, dropIndex: number) => {
    if (touchDragIndex === null || touchDragIndex === dropIndex) {
      setTouchDragIndex(null);
      return;
    }

    setTodos((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(touchDragIndex, 1);
      copy.splice(dropIndex, 0, moved);
      // Persist order to server
      if (currentListId) {
        copy.forEach((t, idx) => {
          apiUpdateTodo(t._id, { listId: currentListId, order: idx });
        });
      }
      return copy;
    });
    setTouchDragIndex(null);
  };

  // Start inline editing
  const startInlineEdit = (todo: Todo) => {
    setInlineEditId(todo._id);
    setInlineName(todo.name);
    setInlineDescription(todo.description);
  };

  // Finish inline editing
  const finishInlineEdit = async (todo: Todo) => {
    if (!currentListId) return;
    await apiUpdateTodo(todo._id, {
      listId: currentListId,
      name: inlineName,
      description: inlineDescription,
    });
    setInlineEditId(null);
    await fetchTodos(currentListId);
  };

  const setCategory = (val: string) => {
    setCategoryState(val);
  };
  const setCategoryManual = (val: string) => {
    setCategoryState(val);
    setAutoAssignedFor(null);
    setCategoryWarning('');
    if (val === '') {
      // remember that user cleared category for current name
      setClearedForName(name.trim().toLowerCase() || null);
    } else {
      setClearedForName(null);
    }
  };

  React.useEffect(() => {
    if (autoAssignedFor && name.trim().toLowerCase() !== autoAssignedFor) {
      setCategoryWarning(
        t.messages.possibleCategoryMismatch || 'Категория может быть неверной'
      );
    } else {
      setCategoryWarning('');
    }
    // clear cleared flag when name changes
    if (clearedForName && name.trim().toLowerCase() !== clearedForName) {
      setClearedForName(null);
    }
  }, [name, autoAssignedFor, clearedForName, t.messages]);

  return {
    // State
    todos,
    name,
    description,
    quantity,
    comment,
    color,
    category,
    editingId,
    filterText,
    filterCategory,
    bulkMode,
    selectedIds,
    inlineEditId,
    inlineName,
    inlineDescription,
    lastAdded,
    categoryWarning,
    clearedForName,

    // Setters
    setTodos,
    setName,
    setDescription,
    setQuantity,
    setComment,
    setColor,
    setCategory,
    setCategoryManual,
    setEditingId,
    setFilterText,
    setFilterCategory,
    setBulkMode,
    setSelectedIds,
    setInlineEditId,
    setInlineName,
    setInlineDescription,
    setLastAdded,
    // warnings

    // Methods
    fetchTodos,
    addItem,
    toggleComplete,
    toggleMissing,
    deleteTodo,
    toggleSelect,
    clearSelection,
    bulkComplete,
    bulkDelete,
    onDragStart,
    onDragOver,
    onDrop,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    startInlineEdit,
    finishInlineEdit,
    moveCategory,
  };
}
