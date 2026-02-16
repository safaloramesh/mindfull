
import { Reminder, User } from '../types';

const AUTH_KEY = 'mindful_remind_auth';
const LOCAL_REMINDERS_KEY = 'mindful_remind_tasks_local';
const LOCAL_USERS_KEY = 'mindful_remind_users_local';
const API_BASE = '/api';

/**
 * Standardized API request helper with error resilience
 */
async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP Error ${response.status}`);
  }

  return await response.json() as T;
}

// Local storage management
const getLocal = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveLocal = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const storage = {
  getUsers: async (): Promise<User[]> => {
    try {
      const users = await apiRequest<User[]>(`${API_BASE}/users`);
      saveLocal(LOCAL_USERS_KEY, users);
      return users;
    } catch {
      return getLocal<User>(LOCAL_USERS_KEY);
    }
  },

  saveUser: async (user: User) => {
    // Save locally immediately
    const users = getLocal<User>(LOCAL_USERS_KEY);
    if (!users.find(u => u.id === user.id)) {
      users.push(user);
      saveLocal(LOCAL_USERS_KEY, users);
    }

    try {
      await apiRequest(`${API_BASE}/users`, {
        method: 'POST',
        body: JSON.stringify(user)
      });
    } catch (e) {
      console.warn("Backend unavailable, user saved locally.");
    }
    return { success: true };
  },

  getReminders: async (userId?: string): Promise<Reminder[]> => {
    // Start with local data
    let localReminders = getLocal<Reminder>(LOCAL_REMINDERS_KEY);
    
    try {
      const url = userId ? `${API_BASE}/reminders?userId=${userId}` : `${API_BASE}/reminders/all`;
      const serverData = await apiRequest<Reminder[]>(url);
      
      // Merge server data into local (server wins on conflict)
      const serverMap = new Map(serverData.map(r => [r.id, r]));
      const merged = [
        ...serverData,
        ...localReminders.filter(r => !serverMap.has(r.id))
      ];
      
      saveLocal(LOCAL_REMINDERS_KEY, merged);
      return userId ? merged.filter(r => r.userId === userId) : merged;
    } catch (e) {
      console.warn("Using local reminders (Sync failed)");
      return userId ? localReminders.filter(r => r.userId === userId) : localReminders;
    }
  },

  addReminder: async (reminder: Reminder) => {
    // SAVE LOCALLY FIRST - guaranteed persistence
    const local = getLocal<Reminder>(LOCAL_REMINDERS_KEY);
    local.push(reminder);
    saveLocal(LOCAL_REMINDERS_KEY, local);

    try {
      await apiRequest(`${API_BASE}/reminders`, {
        method: 'POST',
        body: JSON.stringify(reminder)
      });
    } catch (e) {
      console.error("Task saved locally only. Backend error:", e);
    }
    return { success: true };
  },

  updateReminder: async (updatedReminder: Reminder) => {
    const local = getLocal<Reminder>(LOCAL_REMINDERS_KEY);
    const idx = local.findIndex(r => r.id === updatedReminder.id);
    if (idx !== -1) {
      local[idx] = updatedReminder;
      saveLocal(LOCAL_REMINDERS_KEY, local);
    }

    try {
      await apiRequest(`${API_BASE}/reminders/${updatedReminder.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedReminder)
      });
    } catch {}
    return { success: true };
  },

  deleteReminder: async (id: string) => {
    const local = getLocal<Reminder>(LOCAL_REMINDERS_KEY).filter(r => r.id !== id);
    saveLocal(LOCAL_REMINDERS_KEY, local);

    try {
      await apiRequest(`${API_BASE}/reminders/${id}`, { method: 'DELETE' });
    } catch {}
    return { success: true };
  },

  deleteUser: async (userId: string) => {
    saveLocal(LOCAL_USERS_KEY, getLocal<User>(LOCAL_USERS_KEY).filter(u => u.id !== userId));
    saveLocal(LOCAL_REMINDERS_KEY, getLocal<Reminder>(LOCAL_REMINDERS_KEY).filter(r => r.userId !== userId));
    try {
      await apiRequest(`${API_BASE}/users/${userId}`, { method: 'DELETE' });
    } catch {}
    return { success: true };
  },

  getCurrentAuth: (): User | null => {
    try {
      const data = localStorage.getItem(AUTH_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setAuth: (user: User | null) => {
    if (user) localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    else localStorage.removeItem(AUTH_KEY);
  }
};
