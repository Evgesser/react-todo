import * as React from 'react';
import { Todo } from '@/types';
import {
  fetchTodos as apiFetchTodos,
  createTodo as apiCreateTodo,
  updateTodo as apiUpdateTodo,
  deleteTodo as apiDeleteTodo,
  moveTodosCategory as apiMoveTodosCategory,
} from '@/lib/api';
import useAppStore from '@/stores/useAppStore';
import type { UseTodosParams, UseTodosReturn, AddOverride } from '@/types/hooks';

export function useTodos(params: UseTodosParams): UseTodosReturn {
  const {
    currentListId,
    listDefaultColor,
    listType,
    listBudget,
    listCurrency,
    strictBudget,
    categoryBudgets,
    categoryStrictBudgets,
    categoryExchangeRates,
    onSnackbar,
    t,
    nameCategoryMap,
    products,
    formatMessage,
  } = params;
  const fm = formatMessage || ((id: string) => id);

  // Todo list state (migrated to global store)
  const todos = useAppStore((s) => s.todos);
  const setTodos = useAppStore((s) => s.setTodos);
  const todosLoading = useAppStore((s) => s.todosLoading);
  const setTodosLoading = useAppStore((s) => s.setTodosLoading);
  const todosAbort = React.useRef<AbortController | null>(null);

  // Form state
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [quantity, setQuantity] = React.useState(1);
  const [comment, setComment] = React.useState('');
  const [unit, setUnit] = React.useState('');
  const [color, setColor] = React.useState('#ffffff');
  const [amount, setAmount] = React.useState<number | undefined>(undefined);
  const [spentAt, setSpentAt] = React.useState<string>(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = React.useState<string>('');
  const [priority, setPriority] = React.useState<'low' | 'medium' | 'high' | ''>('');
  const [reminderAt, setReminderAt] = React.useState<string>('');
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
      return;
    }

    // check global products catalog
    if (products) {
      const prod = products.find((p) => p.name.trim().toLowerCase() === lower && p.category);
      if (prod && prod.category) {
        setCategoryState(prod.category);
        setAutoAssignedFor(lower);
      }
    }
  }, [name, todos, editingId, category, nameCategoryMap, clearedForName, products]);

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
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
  const [pendingCompleteIds, setPendingCompleteIds] = React.useState<Set<string>>(new Set());
  const reorderInFlight = false;
  const toggleOpRef = React.useRef<Record<string, number>>({});

  // When editing an existing item, prefill form fields from it
  React.useEffect(() => {
    if (!editingId) return;
    const existing = todos.find((t) => t._id === editingId);
    if (!existing) return;
    setName(existing.name || '');
    setDescription(existing.description || '');
    setQuantity(typeof existing.quantity === 'number' ? existing.quantity : 1);
    setComment(existing.comment || '');
    setUnit(existing.unit || '');
    setColor(existing.color || listDefaultColor);
    setCategoryState(existing.category || '');
    setAmount(typeof existing.amount === 'number' ? existing.amount : undefined);
    setSpentAt(existing.spentAt ? (new Date(existing.spentAt)).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    setDueDate(existing.dueDate ? (new Date(existing.dueDate)).toISOString().slice(0, 10) : '');
    setPriority(existing.priority || '');
    setReminderAt(existing.reminderAt ? (new Date(existing.reminderAt)).toISOString().slice(0, 16) : '');
  }, [editingId, todos, listDefaultColor]);

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

  const normalizeIncomingTodos = React.useCallback((data: Todo[], prev: Todo[]) => {
    return data.map((t: Todo) => {
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
    });
  }, []);

  // Fetch todos from API
  const fetchTodos = React.useCallback(async (listId: string, categoryParam?: string, silent = false) => {
    if (!listId) return;
    // cancel previous request if still pending
    if (todosAbort.current) {
      todosAbort.current.abort();
    }
    const controller = new AbortController();
    todosAbort.current = controller;
    if (!silent) setTodosLoading(true);
    try {
      // use explicit parameter first, otherwise fall back to filterCategory (not form
      // category, which is unrelated to filtering)
      const cat = typeof categoryParam === 'undefined' ? filterCategory : categoryParam;
      const data = await apiFetchTodos(listId, cat, { signal: controller.signal });
      setTodos((prev) => normalizeIncomingTodos(data, prev));
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        // ignore cancelled request
      } else {
        // optionally show snackbar or log
      }
    } finally {
      setTodosLoading(false);
      todosAbort.current = null;
    }
  }, [filterCategory, normalizeIncomingTodos, setTodos, setTodosLoading]);

  const persistOrderChanges = React.useCallback(async (listId: string, previous: Todo[], next: Todo[]) => {
    const previousOrderById = new Map(previous.map((item) => [item._id, item.order]));
    const changed = next.filter((item) => previousOrderById.get(item._id) !== item.order);
    if (changed.length === 0) return;
    await Promise.all(
      changed.map((item) => apiUpdateTodo(item._id, { listId, order: item.order as number }))
    );
  }, []);

  // Add or update a todo item
  interface AddOverride {
    name?: string;
    description?: string;
    quantity?: number;
    comment?: string;
    unit?: string;
    color?: string;
    category?: string;
    image?: string;
    amount?: number;
    spentAt?: string;
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high' | '';
    reminderAt?: string;
  }

  const addItem = async (override: AddOverride = {}) => {
    const finalName = (override.name ?? name).trim();
    if (!finalName || !currentListId) return;

    const newAmount = override.amount ?? amount;
    const newCategory = override.category ?? category;

    // compute current spent totals excluding the item being edited (if any)
    const convertToListCurrency = (amount: number, category?: string) => {
      // rate is stored as: 1 list currency = X category currency
      // so to convert an amount in category currency into list currency, divide by the rate.
      if (!category) return amount;
      const rate = categoryExchangeRates?.[category] ?? 1;
      if (typeof rate === 'number' && rate > 0) {
        return amount / rate;
      }
      return amount;
    };

    const totalSpent = todos.reduce((sum, t) => {
      if (t._id === editingId) return sum;
      if (typeof t.amount !== 'number') return sum;
      return sum + convertToListCurrency(t.amount, t.category);
    }, 0);
    const categorySpent = todos.reduce((sum, t) => {
      if (t._id === editingId) return sum;
      if ((t.category || '') !== (newCategory || '')) return sum;
      return sum + (typeof t.amount === 'number' ? t.amount : 0);
    }, 0);

    const projectedTotal =
      totalSpent +
      (typeof newAmount === 'number' ? convertToListCurrency(newAmount, newCategory) : 0);
    const projectedCategory =
      categorySpent + (typeof newAmount === 'number' ? newAmount : 0);

    const overallBudgetExceeded =
      typeof listBudget === 'number' ? projectedTotal > listBudget : false;
    const categoryBudget = categoryBudgets?.[newCategory || ''];
    const categoryBudgetExceeded =
      typeof categoryBudget === 'number' ? projectedCategory > categoryBudget : false;
    const categoryStrict = categoryStrictBudgets?.[newCategory || ''];

    // Strict budget enforcement (expenses mode)
    if (
      listType === 'expenses' &&
      (strictBudget || categoryStrict) &&
      (overallBudgetExceeded || categoryBudgetExceeded)
    ) {
      onSnackbar(t.messages.budgetExceeded);
      return;
    }

    const payload: Partial<Todo> & { listId: string } = {
      listId: currentListId,
      name: finalName,
      description: (override.description ?? description).trim(),
      quantity: override.quantity ?? quantity,
      comment: (override.comment ?? comment).trim(),
      unit: override.unit ?? unit,
      color: override.color ?? color,
      category: newCategory,
      amount: newAmount,
      spentAt: override.spentAt ?? spentAt,
      dueDate: override.dueDate ?? dueDate,
      priority: (override.priority ?? priority) || undefined,
      reminderAt: override.reminderAt ?? reminderAt,
      image: override.image ?? undefined,
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
      setUnit('');
      setColor(listDefaultColor);
      setAmount(undefined);
      setSpentAt(new Date().toISOString().slice(0, 10));
      setDueDate('');
      setPriority('');
      setReminderAt('');
      setCategoryState('');
      setAutoAssignedFor(null);
      setEditingId(null);
      setLastAdded(addedName);
      onSnackbar(editingId ? fm('messages.itemUpdated') : fm('messages.itemAdded'));

      if (listType === 'expenses' && !strictBudget && (overallBudgetExceeded || categoryBudgetExceeded)) {
        onSnackbar(t.messages.budgetExceeded);
      }

      if (currentListId) {
        await fetchTodos(currentListId);
      }
    }
  };

  // Toggle todo completion status
  const toggleComplete = async (todo: Todo) => {
    if (!currentListId) return;
    if (pendingCompleteIds.has(todo._id)) return;

    const current = todos.find((t) => t._id === todo._id) || todo;
    const previousCompleted = !!current.completed;
    const previousStatus = current.status;
    const newCompleted = !previousCompleted;
    const newStatus = newCompleted ? 'done' : 'pending';

    const opId = (toggleOpRef.current[todo._id] || 0) + 1;
    toggleOpRef.current[todo._id] = opId;
    setPendingCompleteIds((prev) => {
      const next = new Set(prev);
      next.add(todo._id);
      return next;
    });

    // Optimistic UI update without touching order.
    setTodos((prev) =>
      prev.map((t) => (t._id === todo._id ? { ...t, completed: newCompleted, status: newStatus } : t))
    );

    let ok = false;
    try {
      ok = await apiUpdateTodo(todo._id, {
        listId: currentListId,
        completed: newCompleted,
        status: newStatus,
      });
    } catch {
      ok = false;
    }

    // Roll back only if this is still the latest toggle operation for this item.
    if (!ok && toggleOpRef.current[todo._id] === opId) {
      setTodos((prev) =>
        prev.map((t) =>
          t._id === todo._id
            ? { ...t, completed: previousCompleted, status: previousStatus }
            : t
        )
      );
      onSnackbar(fm('messages.saveError'));
    }

    setPendingCompleteIds((prev) => {
      const next = new Set(prev);
      next.delete(todo._id);
      return next;
    });
  };

  // Toggle missing/unavailable status
  const toggleMissing = async (todo: Todo) => {
    if (!currentListId) return;
    setTodos((prev) => prev.map((t) => (t._id === todo._id ? { ...t, missing: !todo.missing } : t)));
    await apiUpdateTodo(todo._id, { listId: currentListId, missing: !todo.missing });
    if (todo.missing) {
      onSnackbar(fm('messages.itemUnmarkedMissing'));
    } else {
      onSnackbar(fm('messages.itemMarkedMissing'));
    }
  };

  // Move an entire category block up or down in the ordering.  We recompute a
  // new order array by swapping the category positions and then persist the
  // sequential order values back to the server.
  const moveCategory = async (category: string, direction: 'up' | 'down') => {
    if (!currentListId) {
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
    const blockIdx = blocks.findIndex((b) => b.category === category);
    if (blockIdx === -1) {
      return;
    }
    const targetIdx = direction === 'up' ? blockIdx - 1 : blockIdx + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) {
      console.warn('block move out of bounds', blockIdx, targetIdx, blocks.length);
      return;
    }
    [blocks[blockIdx], blocks[targetIdx]] = [blocks[targetIdx], blocks[blockIdx]];
    console.log('blocks after swap', blocks.map((b) => b.category));
    const flat = blocks.flatMap((b) => b.items.slice());
    const newOrder = flat.map((t, i) => (t.order === i ? t : { ...t, order: i }));
    console.log('newOrder sequence', newOrder.map((t) => ({ id: t._id, cat: t.category, order: t.order })));
    setTodos(newOrder);
    void persistOrderChanges(currentListId, todos, newOrder).catch(() => {
      onSnackbar(fm('messages.saveError'));
    });
  };

  // Delete a todo
  const deleteTodo = async (id: string) => {
    if (!currentListId) return;
    await apiDeleteTodo(id, currentListId);
    await fetchTodos(currentListId);
  };

  const moveTodosCategory = async (fromCategory: string, toCategory: string) => {
    if (!currentListId) return;
    await apiMoveTodosCategory(currentListId, fromCategory, toCategory);
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
  const isInteractiveTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    return Boolean(
      target.closest(
        'button, input, textarea, select, a, [role="button"], [role="checkbox"], .MuiButtonBase-root, [data-no-drag="true"]'
      )
    );
  };

  const onDragStart = (e: React.DragEvent, index: number) => {
    if (isInteractiveTarget(e.target)) {
      e.preventDefault();
      return;
    }
    if (typeof index !== 'number' || index < 0) return;
    const dragged = todos[index];
    const payload = JSON.stringify({ index, category: dragged?.category || '', id: dragged?._id || '' });
    try {
      e.dataTransfer.setData('text/plain', payload);
      e.dataTransfer.effectAllowed = 'move';
    } catch {
      // ignore
    }
  };

  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  const onDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIndex(null);
  };

  const onDrop = async (e: React.DragEvent, rawIndex: number) => {
    e.preventDefault();

    const data = e.dataTransfer.getData('text/plain');
    let draggedIndex = -1;
    let draggedId = '';
    try {
      const parsed = JSON.parse(data);
      if (typeof parsed.index === 'number') draggedIndex = parsed.index;
      if (typeof parsed.id === 'string') draggedId = parsed.id;
    } catch {
      const n = parseInt(data, 10);
      if (!isNaN(n)) draggedIndex = n;
    }
    // Prefer ID-based lookup — more reliable if todos array shifted since drag started
    if (draggedId) {
      const found = todos.findIndex((t) => t._id === draggedId);
      if (found !== -1) draggedIndex = found;
    }
    if (draggedIndex < 0 || draggedIndex >= todos.length) return;

    const draggedItem = todos[draggedIndex];
    if (!draggedItem) return;

    // Determine drop position based on cursor location
    let dropAfter = false;
    const target = (e.currentTarget as HTMLElement) || null;
    if (target) {
      let rect: DOMRect | null = null;
      try {
        if (typeof target.getBoundingClientRect === 'function') {
          rect = target.getBoundingClientRect();
        }
      } catch (err) {
        // sometimes the element can be detached in the middle of the event
        // sequence; don't crash the app, just ignore measurement
        console.warn('drag drop: failed to measure target', err);
        rect = null;
      }
      if (rect) {
        const top = rect.top;
        const height = rect.height;
        dropAfter = e.clientY > top + height / 2;
      } else {
        dropAfter = false;
      }
    } else {
      // if there is no current target at all, treat as before
      dropAfter = false;
    }

    const newIndex = dropAfter ? rawIndex + 1 : rawIndex;

    // Ensure item stays within its category
    const draggedCat = draggedItem.category || '';
    const itemsInCategory = todos
      .map((t, idx) => ({ item: t, idx }))
      .filter((x) => (x.item.category || '') === draggedCat);

    if (itemsInCategory.length === 0) return;

    // Find the min and max indices of items in the same category
    const catMinIdx = itemsInCategory[0].idx;
    const catMaxIdx = itemsInCategory[itemsInCategory.length - 1].idx;

    // Compute constrained position and warn if original intent was outside
    const constrained =
      newIndex < catMinIdx
        ? catMinIdx
        : newIndex > catMaxIdx + 1
        ? catMaxIdx + 1
        : newIndex;

    if (constrained !== newIndex) {
      onSnackbar(fm('messages.cannotMoveBetweenCategories'));
    }

    // Don't move if source and target are the same
    if (constrained === draggedIndex || constrained === draggedIndex + 1) {
      setDragOverIndex(null);
      return;
    }

    // Build reordered array immutably (no in-place mutation)
    const arr = [...todos];
    const [moved] = arr.splice(draggedIndex, 1);
    arr.splice(draggedIndex < constrained ? constrained - 1 : constrained, 0, moved);
    const reordered = arr.map((t, i) => (t.order === i ? t : { ...t, order: i }));

    setTodos(reordered);

    if (currentListId) {
      void persistOrderChanges(currentListId, todos, reordered).catch(() => {
        onSnackbar(fm('messages.saveError'));
      });
    }

    setDragOverIndex(null);
  };

  // Touch drag and drop handlers with delayed activation to preserve scroll
  const touchTimer = React.useRef<number | null>(null);
  const touchStartPos = React.useRef<{x: number; y: number} | null>(null);
  const DRAG_DELAY = 150; // ms before treating press as drag
  const MOVE_CANCEL = 10; // px movement threshold to cancel drag start

  const clearTouchTimer = () => {
    if (touchTimer.current) {
      window.clearTimeout(touchTimer.current);
      touchTimer.current = null;
    }
  };

  const resetTouchDragState = React.useCallback(() => {
    clearTouchTimer();
    touchStartPos.current = null;
    setTouchDragIndex(null);
    setDragOverIndex(null);
  }, []);

  React.useEffect(() => {
    const handleTouchEnd = () => {
      resetTouchDragState();
    };

    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [resetTouchDragState]);

  const onTouchStart = (e: React.TouchEvent, index: number) => {
    if (isInteractiveTarget(e.target)) {
      return;
    }
    // Clear any stale drag state from a previous touch interaction.
    resetTouchDragState();
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    // schedule drag start after delay
    touchTimer.current = window.setTimeout(() => {
      setTouchDragIndex(index);
      touchTimer.current = null;
    }, DRAG_DELAY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchDragIndex !== null) {
      // already dragging – lock scroll
      e.preventDefault();
      return;
    }
    // if timer pending, check for movement that should cancel it
    if (touchTimer.current && touchStartPos.current) {
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartPos.current.x);
      const dy = Math.abs(touch.clientY - touchStartPos.current.y);
      if (dx > MOVE_CANCEL || dy > MOVE_CANCEL) {
        clearTouchTimer();
      }
    }
  };

  const onTouchEnd = async (e: React.TouchEvent, dropIndex: number) => {
    clearTouchTimer();
    if (touchDragIndex === null || touchDragIndex === dropIndex) {
      resetTouchDragState();
      return;
    }

    const dragIdx = touchDragIndex;
    touchStartPos.current = null;
    setTouchDragIndex(null);
    setDragOverIndex(null);

    // Validate and build reordered array immutably before touching state
    const copy = [...todos];
    const [moved] = copy.splice(dragIdx, 1);
    if (!moved) return;

    const targetItem = copy[dropIndex] ?? copy[copy.length - 1];
    const targetCategory = (targetItem && targetItem.category) || '';
    const movedCategory = moved.category || '';

    if (movedCategory !== targetCategory) {
      onSnackbar(fm('messages.cannotMoveBetweenCategories'));
      return;
    }

    copy.splice(dropIndex, 0, moved);
    const reorderedTouch = copy.map((t, idx) => (t.order === idx ? t : { ...t, order: idx }));

    setTodos(reorderedTouch);

    if (currentListId) {
      void persistOrderChanges(currentListId, todos, reorderedTouch).catch(() => {
        onSnackbar(fm('messages.saveError'));
      });
    }

    resetTouchDragState();
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
    todosLoading,
    name,
    description,
    quantity,
    comment,
    unit,
    color,
    amount,
    spentAt,
    dueDate,
    priority,
    reminderAt,
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
    dragOverIndex,
    pendingCompleteIds,
    reorderInFlight,

    // Setters
    setTodos,
    setName,
    setDescription,
    setQuantity,
    setComment,
    setUnit,
    setColor,
    setAmount,
    setSpentAt,
    setDueDate,
    setPriority,
    setReminderAt,
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
    moveTodosCategory,
    toggleSelect,
    clearSelection,
    bulkComplete,
    bulkDelete,
    onDragStart,
    onDragOver,
    onDragEnter,
    onDragLeave,
    onDrop,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    startInlineEdit,
    finishInlineEdit,
    moveCategory,
  };
}
