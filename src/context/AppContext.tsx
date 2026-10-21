import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import type {
  UserPublic,
  NotificationItem,
  WebsiteSettings,
  PromptItem,
  BlogPost,
  InstagramMediaItem,
  InstagramIntegrationState,
} from '../shared/types';
import { toggleSavedPromptId } from '../utils/platformLogic';

const SAVED_PROMPTS_STORAGE_KEY = 'keerthi_saved_prompt_ids';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface HomeDataPayload {
  settings: WebsiteSettings;
  counts: {
    publishedPromptsCount: number;
    publishedBlogsCount: number;
    categoriesCount: number;
  };
  featuredPrompts: PromptItem[];
  latestBlogs: BlogPost[];
  instagramMedia: InstagramMediaItem[];
  instagramState: InstagramIntegrationState;
}

interface AppContextValue {
  user: UserPublic | null;
  authLoading: boolean;
  homeData: HomeDataPayload | null;
  homeLoading: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  savedPromptIds: string[];
  isPromptSaved: (promptId: string) => boolean;
  toggleSavePrompt: (prompt: PromptItem) => Promise<boolean>;
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  refreshAuth: () => Promise<void>;
  refreshHomeData: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function readLocalSavedPrompts(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_PROMPTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [homeData, setHomeData] = useState<HomeDataPayload | null>(null);
  const [homeLoading, setHomeLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [savedPromptIds, setSavedPromptIds] = useState<string[]>(() => readLocalSavedPrompts());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `tst-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const persistSavedIds = useCallback((ids: string[]) => {
    setSavedPromptIds(ids);
    try {
      localStorage.setItem(SAVED_PROMPTS_STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const isPromptSaved = useCallback(
    (promptId: string) => savedPromptIds.includes(promptId),
    [savedPromptIds]
  );

  const toggleSavePrompt = useCallback(
    async (prompt: PromptItem): Promise<boolean> => {
      const { savedIds, isSaved } = toggleSavedPromptId(savedPromptIds, prompt.id);
      persistSavedIds(savedIds);

      fetch(`/api/public/prompts/${prompt.id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: isSaved ? 'save' : 'unsave' }),
      }).catch(() => {});

      showToast({
        type: 'success',
        title: isSaved ? 'Saved to Personal Library!' : 'Removed from Saved Library',
        description: isSaved
          ? `"${prompt.title}" is now in your Saved AI Prompts library.`
          : `"${prompt.title}" was removed from your saved prompts.`,
      });

      return isSaved;
    },
    [savedPromptIds, persistSavedIds, showToast]
  );

  const refreshAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const loggedUser: UserPublic | null = data.user || null;
        setUser(loggedUser);
        if (loggedUser?.savedPromptIds?.length) {
          const local = readLocalSavedPrompts();
          const merged = Array.from(new Set([...loggedUser.savedPromptIds, ...local]));
          persistSavedIds(merged);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, [persistSavedIds]);

  const refreshHomeData = useCallback(async () => {
    try {
      setHomeLoading(true);
      const res = await fetch('/api/public/home');
      if (res.ok) {
        const data = await res.json();
        setHomeData(data);
      }
    } catch (err) {
      console.error('Failed to load home data:', err);
    } finally {
      setHomeLoading(false);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const res = await fetch('/api/notifications', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.items || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Ignore network hiccup
    }
  }, [user]);

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // Ignore
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch {
      // Ignore
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
    showToast({ type: 'info', title: 'Signed out', description: 'You have been logged out safely.' });
  }, [showToast]);

  useEffect(() => {
    refreshAuth();
    refreshHomeData();
  }, [refreshAuth, refreshHomeData]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Connect Socket.IO for live notifications when logged in
  useEffect(() => {
    if (!user) return;
    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));
    if (isHeadless) return;

    const socket: Socket = io({
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('notification:new', (notif: NotificationItem) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      showToast({
        type: 'info',
        title: notif.title,
        description: notif.message,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user, showToast]);

  return (
    <AppContext.Provider
      value={{
        user,
        authLoading,
        homeData,
        homeLoading,
        notifications,
        unreadCount,
        savedPromptIds,
        isPromptSaved,
        toggleSavePrompt,
        toasts,
        showToast,
        dismissToast,
        refreshAuth,
        refreshHomeData,
        refreshNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
