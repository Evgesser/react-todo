import { Todo, List, TemplateItem, Template } from '../types';

const BASE = '/api';

// --- auth ---------------------------------------------------------------
export async function login(username: string, password: string): Promise<{ userId: string; username: string }> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Login failed');
  }
  return res.json();
}

// --- todos ---------------------------------------------------------------
export async function fetchTodos(listId: string, category?: string): Promise<Todo[]> {
  if (!listId) return [];
  let url = `${BASE}/todos?listId=${encodeURIComponent(listId)}`;
  if (category && category.trim() !== '') {
    url += `&category=${encodeURIComponent(category)}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load todos');
  return res.json();
}

export async function createTodo(item: Partial<Todo> & { listId: string }) {
  const res = await fetch(`${BASE}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  return res.json();
}

export async function updateTodo(id: string, data: Partial<Todo> & { listId?: string }) {
  const res = await fetch(`${BASE}/todos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.ok;
}

export async function deleteTodo(id: string, listId: string) {
  const res = await fetch(`${BASE}/todos/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listId }),
  });
  return res.ok;
}

// --- lists ---------------------------------------------------------------
export async function fetchLists(userId: string): Promise<List[]> {
  const res = await fetch(`${BASE}/lists?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to load lists');
  return res.json();
}

export async function deleteList(id: string) {
  const res = await fetch(`${BASE}/lists/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  return res.ok;
}

export async function updateList(id: string, data: Partial<List>) {
  const res = await fetch(`${BASE}/lists/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.ok;
}

export async function createList(userId: string, name: string, defaultColor: string) {
  const res = await fetch(`${BASE}/lists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, name, defaultColor }),
  });
  return res.json();
}

// bulk helpers used by templates
export async function createTodosBulk(listId: string, items: TemplateItem[]) {
  return Promise.all(
    items.map((item, idx) =>
      createTodo({
        listId,
        name: item.name,
        description: item.description || '',
        quantity: item.quantity || 1,
        comment: item.comment || '',
        color: item.color || '',
        category: item.category || '',
        order: idx,
      })
    )
  );
}

// --- personalization ---------------------------------------------------
export interface StoredCategory {
  value: string;
  label: string;
  icon?: string; // key from constants.iconMap
}

export async function fetchPersonalization(userId: string): Promise<{
  categories?: StoredCategory[];
  templates?: Template[];
  nameCategoryMap?: Record<string, string>;
}> {
  const res = await fetch(`${BASE}/personalization?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to load personalization');
  return res.json();
}

export async function savePersonalization(
  userId: string,
  categories?: StoredCategory[],
  templates?: Template[],
  nameCategoryMap?: Record<string, string>
): Promise<{
  categories?: StoredCategory[];
  templates?: Template[];
  nameCategoryMap?: Record<string, string>;
}> {
  const body: Record<string, unknown> = { userId };
  if (categories) body.categories = categories;
  if (templates) body.templates = templates;
  if (nameCategoryMap) body.nameCategoryMap = nameCategoryMap;
  const res = await fetch(`${BASE}/personalization`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// --- user profile ---------------------------------------------------
export interface UserProfile {
  userId: string;
  username: string;
  email?: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
}

export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const res = await fetch(`${BASE}/user/${encodeURIComponent(userId)}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to load profile');
  }
  return res.json();
}

export async function updateUserProfile(
  userId: string,
  profile: { email?: string; bio?: string; avatar?: string }
): Promise<UserProfile> {
  const res = await fetch(`${BASE}/user/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update profile');
  }
  return res.json();
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  const res = await fetch(`${BASE}/user/change-password?userId=${encodeURIComponent(userId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to change password');
  }
  return res.json();
}

export async function deleteUserAccount(userId: string, password: string): Promise<{ message: string }> {
  const res = await fetch(`${BASE}/user/delete?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete account');
  }
  return res.json();
}

