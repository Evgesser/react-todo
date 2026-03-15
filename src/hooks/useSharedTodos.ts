import * as React from 'react';
import { Todo } from '@/types';
import {
  fetchSharedList,
  updateSharedTodo,
} from '@/lib/api';
import type { IntlShape } from 'react-intl';
// TranslationKeys not used here

interface UseSharedTodosReturn {
  list: { name: string; defaultColor?: string } | null;
  error: string | null;
  todos: Todo[];
  filterText: string;
  filterCategory: string;
  dragOverIndex: number | null;
  setFilterText: (text: string) => void;
  setFilterCategory: (cat: string) => void;
  toggleComplete: (todo: Todo) => Promise<void>;
  toggleMissing: (todo: Todo) => Promise<void>;
  moveCategory: (category: string, direction: 'up' | 'down') => Promise<void>;
  // drag/drop handlers (a subset of useTodos)
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent, index: number) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, dropIndex: number) => void;
  onTouchStart: (e: React.TouchEvent, index: number) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent, dropIndex: number) => void;
}

export function useSharedTodos(
  token: string,
  onSnackbar: (msg: string) => void,
  formatMessage?: (id: string, values?: Parameters<IntlShape['formatMessage']>[1]) => string,
  viewerId?: string
): UseSharedTodosReturn {
  const [list, setList] = React.useState<{ name: string; defaultColor?: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [todos, setTodos] = React.useState<Todo[]>([]);
  const [filterText, setFilterText] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState('');
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
  const fm = React.useCallback((id: string, values?: Parameters<IntlShape['formatMessage']>[1]) => {
    return formatMessage ? formatMessage(id, values) : id;
  }, [formatMessage]);

  const fetch = React.useCallback(async () => {
    try {
      const data = await fetchSharedList(token, viewerId);
      setList(data.list || null);
      setTodos(data.todos || []);
      setError(null);
    } catch {
      onSnackbar(fm('messages.loadListsError'));
      setError('failed');
    }
  }, [token, onSnackbar, fm, viewerId]);

  React.useEffect(() => {
    if (!token) return;
    fetch();
  }, [token, fetch]);

  const toggleComplete = async (todo: Todo) => {
    const newCompleted = !todo.completed;
    const newStatus = newCompleted ? 'done' : 'pending';
    setTodos((prev) => prev.map((t) => (t._id === todo._id ? { ...t, completed: newCompleted, status: newStatus } : t)));
    await updateSharedTodo(token, { todoId: todo._id, completed: newCompleted, status: newStatus });
    await fetch();
  };

  const toggleMissing = async (todo: Todo) => {
    setTodos((prev) => prev.map((t) => (t._id === todo._id ? { ...t, missing: !todo.missing } : t)));
    await updateSharedTodo(token, { todoId: todo._id, missing: !todo.missing });
    if (todo.missing) {
        onSnackbar(fm('messages.itemUnmarkedMissing'));
    } else {
      onSnackbar(fm('messages.itemMarkedMissing'));
    }
    fetch();
  };

  const moveCategory = async (category: string, direction: 'up' | 'down') => {
    // replicate logic from useTodos.moveCategory but using shared API
    const sorted = [...todos].sort((a, b) => (a.order || 0) - (b.order || 0));
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
    if (blockIdx === -1) return;
    const targetIdx = direction === 'up' ? blockIdx - 1 : blockIdx + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    [blocks[blockIdx], blocks[targetIdx]] = [blocks[targetIdx], blocks[blockIdx]];
    const flat = blocks.flatMap((b) => b.items.slice());
    const newOrder = flat.map((t, i) => (t.order === i ? t : { ...t, order: i }));
    setTodos(newOrder);
    // persist all orders
    await Promise.all(
      newOrder.map((t) =>
        updateSharedTodo(token, { todoId: t._id, order: t.order as number })
      )
    );
    await fetch();
  };

  // drag/drop handlers (copied from useTodos)
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

  const onDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('text/plain');
    let startIndex = -1;
    let draggedId = '';
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed.index === 'number') startIndex = parsed.index;
      if (typeof parsed.id === 'string') draggedId = parsed.id;
    } catch {
      const n = parseInt(raw, 10);
      if (!isNaN(n)) startIndex = n;
    }
    if (draggedId) {
      const found = todos.findIndex((t) => t._id === draggedId);
      if (found !== -1) startIndex = found;
    }
    if (startIndex < 0 || startIndex >= todos.length) return;

    const copy = [...todos];
    const [moved] = copy.splice(startIndex, 1);
    if (!moved) return;

    const targetItem = copy[dropIndex] ?? copy[copy.length - 1];
    const targetCategory = (targetItem && targetItem.category) || '';
    const movedCategory = moved.category || '';

    if (movedCategory !== targetCategory) {
      onSnackbar(fm('messages.cannotMoveBetweenCategories'));
      return;
    }

    copy.splice(dropIndex, 0, moved);
    const reordered = copy.map((t, idx) => (t.order === idx ? t : { ...t, order: idx }));

    setTodos(reordered);

    await Promise.all(
      reordered.map((t) => updateSharedTodo(token, { todoId: t._id, order: t.order as number }))
    );
    setDragOverIndex(null);
    await fetch();
  };

  // touch handlers copied from useTodos, now with delayed start
  const [touchDragIndex, setTouchDragIndex] = React.useState<number | null>(null);
  const touchTimer = React.useRef<number | null>(null);
  const touchStartPos = React.useRef<{x: number; y: number} | null>(null);
  const DRAG_DELAY = 150;
  const MOVE_CANCEL = 10;

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
    resetTouchDragState();
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    touchTimer.current = window.setTimeout(() => {
      setTouchDragIndex(index);
      touchTimer.current = null;
    }, DRAG_DELAY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchDragIndex !== null) {
      e.preventDefault();
      return;
    }
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
    const reordered = copy.map((t, idx) => (t.order === idx ? t : { ...t, order: idx }));

    setTodos(reordered);

    await Promise.all(
      reordered.map((t) => updateSharedTodo(token, { todoId: t._id, order: t.order as number }))
    );
    await fetch();
    resetTouchDragState();
  };

  return {
    list,
    error,
    todos,
    filterText,
    filterCategory,
    dragOverIndex,
    setFilterText,
    setFilterCategory,
    toggleComplete,
    toggleMissing,
    moveCategory,
    onDragStart,
    onDragOver,
    onDragEnter,
    onDragLeave,
    onDrop,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
