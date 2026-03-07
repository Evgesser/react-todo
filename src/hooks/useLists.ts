import * as React from 'react';
import { List as ListType } from '@/types';
import {
  fetchLists as apiFetchLists,
  deleteList as apiDeleteList,
  updateList as apiUpdateList,
} from '@/lib/api';
import { TranslationKeys } from '@/locales/ru';
import type { IntlShape } from 'react-intl';
import useAppStore from '@/stores/useAppStore';

interface UseListsParams {
  userId: string | null;
  onSnackbar: (message: string) => void;
  t?: TranslationKeys;
  formatMessage: (id: string, values?: Parameters<IntlShape['formatMessage']>[1]) => string;
}

export interface UseListsReturn {
  // State
  lists: ListType[];
  currentListId: string | null;
  currentList: ListType | null;
  listDefaultColor: string;
  viewingHistory: boolean;
  isLoading: boolean;

  // Setters
  setLists: (lists: ListType[]) => void;
  setCurrentListId: (id: string | null) => void;
  setCurrentList: (list: ListType | null) => void;
  setListDefaultColor: (color: string) => void;
  setViewingHistory: (viewing: boolean) => void;

  // Methods
  loadLists: () => Promise<ListType[] | null>;
  selectList: (id: string) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  updateListColor: (id: string, color: string) => Promise<void>;
  updateShareToken: (id: string, token: string) => Promise<void>;
  completeList: (id: string) => Promise<void>;
  clearAllLists: () => void;
}

export function useLists({ userId, onSnackbar, formatMessage }: UseListsParams): UseListsReturn {
  const abortRef = React.useRef<AbortController | null>(null);

  const lists = useAppStore((s) => s.lists);
  const setLists = useAppStore((s) => s.setLists);
  const isLoading = useAppStore((s) => s.listsLoading);
  const setIsLoading = useAppStore((s) => s.setListsLoading);
  const currentListId = useAppStore((s) => s.currentListId);
  const setCurrentListId = useAppStore((s) => s.setCurrentListId);
  const currentList = useAppStore((s) => s.currentList);
  const setCurrentList = useAppStore((s) => s.setCurrentList);
  const listDefaultColor = useAppStore((s) => s.listDefaultColor);
  const setListDefaultColor = useAppStore((s) => s.setListDefaultColor);
  const viewingHistory = useAppStore((s) => s.viewingHistory);
  const setViewingHistory = useAppStore((s) => s.setViewingHistory);

  const loadLists = React.useCallback(async (): Promise<ListType[] | null> => {
    if (!userId) return null;
    // cancel any previous pending call
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);

    try {
      let data = await apiFetchLists(userId, { signal: controller.signal });

      // purge any lingering placeholder lists named "Список 1" (default from earlier)
      const defaultPattern = /^\s*Список\s*1\s*$/i;
      // repeat until none remain
      while (data.some((l) => defaultPattern.test(l.name))) {
        for (const l of data) {
          if (defaultPattern.test(l.name)) {
            await apiDeleteList(l._id);
          }
        }
        data = await apiFetchLists(userId, { signal: controller.signal });
      }
      // also filter them out of local data just in case
      data = data.filter((l) => !defaultPattern.test(l.name));

      setLists(data);

      const active = data.filter((l) => !l.completed);
      if (active.length > 0) {
        const preserved = currentListId ? data.find((l) => l._id === currentListId) || null : null;
        const first = preserved || data.find((l) => !l.completed) || data[0];
        setCurrentListId(first._id);
        setCurrentList(first);
        setListDefaultColor(first.defaultColor || '#ffffff');
        setViewingHistory(first.completed);
      }

      return data;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        // aborted by caller, ignore
        return null;
      }
      onSnackbar(formatMessage('messages.loadListsError'));
      return null;
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [userId, currentListId, onSnackbar, formatMessage, setIsLoading, setLists, setCurrentListId, setCurrentList, setListDefaultColor, setViewingHistory]);

  const selectList = React.useCallback(
    async (id: string) => {
      const selected = lists.find((l) => l._id === id) || null;
      if (selected) {
        setCurrentListId(id);
        setCurrentList(selected);
        setListDefaultColor(selected.defaultColor || '#ffffff');
        setViewingHistory(selected.completed);
      }
    },
    [lists, setCurrentListId, setCurrentList, setListDefaultColor, setViewingHistory]
  );

  const deleteList = React.useCallback(
    async (id: string) => {
      try {
        await apiDeleteList(id);
        const updated = lists.filter((l) => l._id !== id);
        setLists(updated);

        if (currentListId === id) {
          if (updated.length > 0) {
            const first = updated.find((l) => !l.completed) || updated[0];
            setCurrentListId(first._id);
            setCurrentList(first);
            setListDefaultColor(first.defaultColor || '#ffffff');
            setViewingHistory(first.completed);
          } else {
            setCurrentListId(null);
            setCurrentList(null);
            setListDefaultColor('#ffffff');
            setViewingHistory(false);
          }
        }
        onSnackbar(formatMessage('messages.listDeleted'));
      } catch {
        onSnackbar(formatMessage('messages.deleteListError'));
      }
    },
    [lists, currentListId, onSnackbar, formatMessage, setLists, setCurrentListId, setCurrentList, setListDefaultColor, setViewingHistory]
  );

  const updateListColor = React.useCallback(
    async (id: string, color: string) => {
      try {
        await apiUpdateList(id, { defaultColor: color });
        const updated = lists.map((l) => (l._id === id ? { ...l, defaultColor: color } : l));
        setLists(updated);

        if (currentListId === id) {
          setListDefaultColor(color);
          setCurrentList(updated.find((l) => l._id === id) || null);
        }
        onSnackbar(formatMessage('messages.colorSaved'));
      } catch {
        onSnackbar(formatMessage('messages.colorUpdateError'));
      }
    },
    [lists, currentListId, onSnackbar, formatMessage, setLists, setListDefaultColor, setCurrentList]
  );

  const updateShareToken = React.useCallback(
    async (id: string, token: string) => {
      try {
        const ok = await apiUpdateList(id, { shareToken: token });
        if (!ok) {
          throw new Error('Failed to update share token');
        }
        const updated = lists.map((l) => (l._id === id ? { ...l, shareToken: token } : l));
        setLists(updated);

        if (currentListId === id) {
          setCurrentList(updated.find((l) => l._id === id) || null);
        }
      } catch {
        onSnackbar(formatMessage('messages.saveError'));
        throw new Error('Failed to save share token');
      }
    },
    [lists, currentListId, onSnackbar, formatMessage, setLists, setCurrentList]
  );

  const completeList = React.useCallback(
    async (id: string) => {
      try {
        await apiUpdateList(id, { completed: true });
        const updated = lists.map((l) => (l._id === id ? { ...l, completed: true } : l));
        setLists(updated);

        if (currentListId === id) {
          const active = updated.filter((l) => !l.completed);
          if (active.length > 0) {
            const first = active[0];
            setCurrentListId(first._id);
            setCurrentList(first);
            setListDefaultColor(first.defaultColor || '#ffffff');
            setViewingHistory(first.completed);
          } else {
            setCurrentListId(null);
            setCurrentList(null);
            setViewingHistory(true);
          }
        }
        onSnackbar(formatMessage('messages.listCompleted'));
      } catch {
        onSnackbar(formatMessage('messages.completeListError'));
      }
    },
    [lists, currentListId, onSnackbar, formatMessage, setLists, setCurrentListId, setCurrentList, setListDefaultColor, setViewingHistory]
  );

  const clearAllLists = React.useCallback(() => {
    setLists([]);
    setCurrentListId(null);
    setCurrentList(null);
    setListDefaultColor('#ffffff');
    setViewingHistory(false);
  }, [setLists, setCurrentListId, setCurrentList, setListDefaultColor, setViewingHistory]);

  return {
    lists,
    currentListId,
    currentList,
    listDefaultColor,
    viewingHistory,
    isLoading,
    setLists,
    setCurrentListId,
    setCurrentList,
    setListDefaultColor,
    setViewingHistory,
    loadLists,
    selectList,
    deleteList,
    updateListColor,
    updateShareToken,
    completeList,
    clearAllLists,
  };
}
