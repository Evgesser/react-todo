import * as React from 'react';
import { List as ListType } from '@/types';
import {
  fetchLists as apiFetchLists,
  deleteList as apiDeleteList,
  updateList as apiUpdateList,
} from '@/lib/api';
import { TranslationKeys } from '@/locales/ru';

interface UseListsParams {
  userId: string | null;
  onSnackbar: (message: string) => void;
  t: TranslationKeys;
}

interface UseListsReturn {
  // State
  lists: ListType[];
  currentListId: string | null;
  currentList: ListType | null;
  listDefaultColor: string;
  viewingHistory: boolean;

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
  completeList: (id: string) => Promise<void>;
  clearAllLists: () => void;
}

export function useLists({ userId, onSnackbar, t }: UseListsParams): UseListsReturn {
  const [lists, setLists] = React.useState<ListType[]>([]);
  const [currentListId, setCurrentListId] = React.useState<string | null>(null);
  const [currentList, setCurrentList] = React.useState<ListType | null>(null);
  const [listDefaultColor, setListDefaultColor] = React.useState('#ffffff');
  const [viewingHistory, setViewingHistory] = React.useState(false);

  const loadLists = React.useCallback(async (): Promise<ListType[] | null> => {
    if (!userId) return null;
    try {
      let data = await apiFetchLists(userId);

      // purge any lingering placeholder lists named "Список 1" (default from earlier)
      const defaultPattern = /^\s*Список\s*1\s*$/i;
      // repeat until none remain
      while (data.some((l) => defaultPattern.test(l.name))) {
        for (const l of data) {
          if (defaultPattern.test(l.name)) {
            await apiDeleteList(l._id);
          }
        }
        data = await apiFetchLists(userId);
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
    } catch {
      onSnackbar(t.messages.loadListsError);
      return null;
    }
  }, [userId, currentListId, onSnackbar, t]);

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
    [lists]
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
        onSnackbar(t.messages.listDeleted);
      } catch {
        onSnackbar(t.messages.deleteListError);
      }
    },
    [lists, currentListId, onSnackbar, t]
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
        onSnackbar(t.messages.colorSaved);
      } catch {
        onSnackbar(t.messages.colorUpdateError);
      }
    },
    [lists, currentListId, onSnackbar, t]
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
        onSnackbar(t.messages.listCompleted);
      } catch {
        onSnackbar(t.messages.completeListError);
      }
    },
    [lists, currentListId, onSnackbar, t]
  );

  const clearAllLists = React.useCallback(() => {
    setLists([]);
    setCurrentListId(null);
    setCurrentList(null);
    setListDefaultColor('#ffffff');
    setViewingHistory(false);
  }, []);

  return {
    lists,
    currentListId,
    currentList,
    listDefaultColor,
    viewingHistory,
    setLists,
    setCurrentListId,
    setCurrentList,
    setListDefaultColor,
    setViewingHistory,
    loadLists,
    selectList,
    deleteList,
    updateListColor,
    completeList,
    clearAllLists,
  };
}
