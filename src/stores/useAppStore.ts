import { create } from 'zustand';
import { login as apiLogin, fetchUserProfile } from '@/lib/api';
import { Language } from '@/locales';
import { Category, templates as defaultTemplates, categories as defaultCategories } from '@/constants';
import type { Template, StoredProduct } from '@/types';
import type { List as ListType, Todo } from '@/types';

type AuthState = {
  userId: string | null;
  username: string | null;
  avatar: string | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  setAuthData: (userId: string, username: string, avatar?: string) => void;
  loadAvatar: (userId: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  hydrateAuth: () => void;
};

type LanguageState = {
  language: Language;
  setLanguage: (lang: Language) => void;
  hydrateLanguage: () => void;
};

type PersonalizationState = {
  availableCategories: Category[];
  availableTemplates: Template[];
  nameCategoryMap: Record<string, string>;
  products: StoredProduct[];
  personalDialogOpen: boolean;
  setAvailableCategories: (cats: Category[] | ((prev: Category[]) => Category[])) => void;
  setAvailableTemplates: (tmpls: Template[] | ((prev: Template[]) => Template[])) => void;
  setNameCategoryMap: (map: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  setProducts: (prods: StoredProduct[] | ((prev: StoredProduct[]) => StoredProduct[])) => void;
  setPersonalDialogOpen: (open: boolean) => void;
};

type ListsState = {
  lists: ListType[];
  currentListId: string | null;
  currentList: ListType | null;
  listDefaultColor: string;
  viewingHistory: boolean;
  listsLoading: boolean;
  setLists: (lists: ListType[]) => void;
  setCurrentListId: (id: string | null) => void;
  setCurrentList: (list: ListType | null) => void;
  setListDefaultColor: (color: string) => void;
  setViewingHistory: (v: boolean) => void;
  setListsLoading: (v: boolean) => void;
};

type TodosState = {
  todos: Todo[];
  todosLoading: boolean;
  setTodos: (todos: Todo[] | ((prev: Todo[]) => Todo[])) => void;
  setTodosLoading: (v: boolean) => void;
};

type AppStore = AuthState & LanguageState & PersonalizationState & ListsState & TodosState;

export const useAppStore = create<AppStore>((set, get) => ({
  // Auth initial
  userId: null,
  username: null,
  avatar: null,
  isLoading: false,
  error: null,

  // Language initial
  language: 'ru',

  // Auth actions
  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiLogin(username, password);
      let userAvatar: string | null = null;
      try {
        const profile = await fetchUserProfile(data.userId);
        userAvatar = profile.avatar || null;
      } catch {
        userAvatar = null;
      }
      set({ userId: data.userId, username: data.username, avatar: userAvatar });
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('auth', JSON.stringify({ userId: data.userId, username: data.username, avatar: userAvatar }));
        } catch {}
      }
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  setAuthData: (userId, username, avatar) => {
    set({ userId, username, avatar: avatar || null });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('auth', JSON.stringify({ userId, username, avatar: avatar || null }));
      } catch {}
    }
  },

  loadAvatar: async (userId) => {
    try {
      const profile = await fetchUserProfile(userId);
      const newAvatar = profile.avatar || null;
      set({ avatar: newAvatar });
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('auth');
        if (stored) {
          try {
            const data = JSON.parse(stored);
            localStorage.setItem('auth', JSON.stringify({ ...data, avatar: newAvatar }));
          } catch {}
        }
      }
    } catch {
      set({ avatar: null });
    }
  },

  logout: () => {
    set({ userId: null, username: null, avatar: null, error: null });
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem('auth'); } catch {}
    }
  },

  clearError: () => set({ error: null }),

  hydrateAuth: () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('auth');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          set({ userId: data.userId || null, username: data.username || null, avatar: data.avatar || null });
        } catch {
          try { localStorage.removeItem('auth'); } catch {}
        }
      }
    }
  },

  // Language actions
  setLanguage: (lang) => {
    set({ language: lang });
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('language', lang); } catch {}
      try { document.cookie = `language=${encodeURIComponent(lang)}; path=/; max-age=${60 * 60 * 24 * 365}`; } catch {}
      if (typeof document !== 'undefined') {
        const isRtl = lang === 'he';
        document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
        const langCode = lang === 'ru' ? 'ru' : lang === 'he' ? 'he' : 'en';
        document.documentElement.lang = langCode;
      }
    }
  },

  // Personalization state
  availableCategories: defaultCategories as Category[],
  availableTemplates: defaultTemplates as Template[],
  nameCategoryMap: {} as Record<string, string>,
  products: [] as StoredProduct[],
  personalDialogOpen: false,

  // Personalization setters (support direct value or functional updater)
  setAvailableCategories: (catsOrFn: Category[] | ((prev: Category[]) => Category[])) => {
    const next = typeof catsOrFn === 'function' ? (catsOrFn as (prev: Category[]) => Category[])(get().availableCategories) : catsOrFn;
    set({ availableCategories: next });
  },
  setAvailableTemplates: (tmplsOrFn: Template[] | ((prev: Template[]) => Template[])) => {
    const next = typeof tmplsOrFn === 'function' ? (tmplsOrFn as (prev: Template[]) => Template[])(get().availableTemplates) : tmplsOrFn;
    set({ availableTemplates: next });
  },
  setNameCategoryMap: (mapOrFn: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => {
    const next = typeof mapOrFn === 'function' ? (mapOrFn as (prev: Record<string, string>) => Record<string, string>)(get().nameCategoryMap) : mapOrFn;
    set({ nameCategoryMap: next });
  },
  setProducts: (prodsOrFn: StoredProduct[] | ((prev: StoredProduct[]) => StoredProduct[])) => {
    const next = typeof prodsOrFn === 'function' ? (prodsOrFn as (prev: StoredProduct[]) => StoredProduct[])(get().products) : prodsOrFn;
    set({ products: next });
  },
  setPersonalDialogOpen: (open: boolean) => set({ personalDialogOpen: open }),
  
  // Lists state
  lists: [] as ListType[],
  currentListId: null as string | null,
  currentList: null as ListType | null,
  listDefaultColor: '#ffffff',
  viewingHistory: false,
  listsLoading: false,

  // Lists setters
  setLists: (lists: ListType[]) => set({ lists }),
  setCurrentListId: (id: string | null) => set({ currentListId: id }),
  setCurrentList: (list: ListType | null) => set({ currentList: list }),
  setListDefaultColor: (color: string) => set({ listDefaultColor: color }),
  setViewingHistory: (v: boolean) => set({ viewingHistory: v }),
  setListsLoading: (v: boolean) => set({ listsLoading: v }),
  
  // Todos state
  todos: [] as Todo[],
  todosLoading: false,

  // Todos setters
  setTodos: (todos: Todo[] | ((prev: Todo[]) => Todo[])) => {
    const next = typeof todos === 'function' ? (todos as (prev: Todo[]) => Todo[])(get().todos) : todos;
    set({ todos: next });
  },
  setTodosLoading: (v: boolean) => set({ todosLoading: v }),

  hydrateLanguage: () => {
    if (typeof window !== 'undefined') {
      let saved = localStorage.getItem('language');
      if (!saved) {
        const match = document.cookie.match(/(?:^|; )language=([^;]+)/);
        if (match && match[1]) saved = decodeURIComponent(match[1]);
      }
      if (saved && (saved === 'ru' || saved === 'en' || saved === 'he')) {
        set({ language: saved as Language });
        const isRtl = saved === 'he';
        if (typeof document !== 'undefined') {
          document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
          const langCode = saved === 'ru' ? 'ru' : saved === 'he' ? 'he' : 'en';
          document.documentElement.lang = langCode;
        }
      }
    }
  },
}));

export default useAppStore;
