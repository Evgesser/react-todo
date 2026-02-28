import * as React from 'react';
import { Todo } from '@/types';
import {
  fetchTodos as apiFetchTodos,
  createTodo as apiCreateTodo,
  updateTodo as apiUpdateTodo,
  deleteTodo as apiDeleteTodo,
} from '@/lib/api';

interface UseTodosParams {
  currentListId: string | null;
  listDefaultColor: string;
  onSnackbar: (message: string) => void;
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
  bulkMode: boolean;
  selectedIds: Set<string>;
  inlineEditId: string | null;
  inlineName: string;
  inlineDescription: string;
  lastAdded: string | null;

  // Setters
  setTodos: (todos: Todo[] | ((prev: Todo[]) => Todo[])) => void;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setQuantity: (quantity: number) => void;
  setComment: (comment: string) => void;
  setColor: (color: string) => void;
  setCategory: (category: string) => void;
  setEditingId: (id: string | null) => void;
  setFilterText: (text: string) => void;
  setBulkMode: (mode: boolean) => void;
  setSelectedIds: (ids: Set<string>) => void;
  setInlineEditId: (id: string | null) => void;
  setInlineName: (name: string) => void;
  setInlineDescription: (description: string) => void;
  setLastAdded: (name: string | null) => void;

  // Methods
  fetchTodos: (listId: string) => Promise<void>;
  addItem: () => Promise<void>;
  toggleComplete: (todo: Todo) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  bulkComplete: () => Promise<void>;
  bulkDelete: () => Promise<void>;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, dropIndex: number) => void;
  startInlineEdit: (todo: Todo) => void;
  finishInlineEdit: (todo: Todo) => Promise<void>;
}

export function useTodos(params: UseTodosParams): UseTodosReturn {
  const { currentListId, listDefaultColor, onSnackbar } = params;

  // Todo list state
  const [todos, setTodos] = React.useState<Todo[]>([]);

  // Form state
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [quantity, setQuantity] = React.useState(1);
  const [comment, setComment] = React.useState('');
  const [color, setColor] = React.useState('#ffffff');
  const [category, setCategory] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // Search/filter state
  const [filterText, setFilterText] = React.useState('');

  // Bulk operations state
  const [bulkMode, setBulkMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Inline editing state
  const [inlineEditId, setInlineEditId] = React.useState<string | null>(null);
  const [inlineName, setInlineName] = React.useState('');
  const [inlineDescription, setInlineDescription] = React.useState('');

  // UI state
  const [lastAdded, setLastAdded] = React.useState<string | null>(null);

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
  const fetchTodos = async (listId: string) => {
    if (!listId) return;
    try {
      const data = await apiFetchTodos(listId);
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
      setCategory('');
      setEditingId(null);
      setLastAdded(addedName);
      onSnackbar(editingId ? 'Item updated' : 'Item added');
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
    bulkMode,
    selectedIds,
    inlineEditId,
    inlineName,
    inlineDescription,
    lastAdded,

    // Setters
    setTodos,
    setName,
    setDescription,
    setQuantity,
    setComment,
    setColor,
    setCategory,
    setEditingId,
    setFilterText,
    setBulkMode,
    setSelectedIds,
    setInlineEditId,
    setInlineName,
    setInlineDescription,
    setLastAdded,

    // Methods
    fetchTodos,
    addItem,
    toggleComplete,
    deleteTodo,
    toggleSelect,
    clearSelection,
    bulkComplete,
    bulkDelete,
    onDragStart,
    onDragOver,
    onDrop,
    startInlineEdit,
    finishInlineEdit,
  };
}
