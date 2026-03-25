import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { API_CONFIG } from '../config/api.config';
import * as Notifications from 'expo-notifications';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  notificationType: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
  timestamp: string;
  userId: string;
  actionRoute?: string;
}

type UserType = 'student' | 'staff' | 'hod' | 'hr' | 'security';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loadNotifications: (userId: string, userType: UserType) => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const currentUserRef = useRef<{ userId: string; userType: UserType } | null>(null);
  const shownNotificationIdsRef = useRef<Set<number>>(new Set());

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchFromBackend = async (userId: string, userType: UserType) => {
    try {
      const url = `${API_CONFIG.BASE_URL}/notifications/${userType}/${userId}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success && Array.isArray(data.notifications)) {
        const latest = data.notifications as Notification[];
        const unreadNew = latest.filter(n => !n.isRead && !shownNotificationIdsRef.current.has(n.id));
        for (const n of unreadNew) {
          shownNotificationIdsRef.current.add(n.id);
          await Notifications.scheduleNotificationAsync({
            content: {
              title: n.title || 'New Notification',
              body: n.message || '',
              data: { actionRoute: n.actionRoute || '' },
              sound: 'default',
            },
            trigger: null,
          });
        }
        setNotifications(latest);
      }
    } catch (error) {
      // silent — polling will retry
    }
  };

  const loadNotifications = async (userId: string, userType: UserType) => {
    currentUserRef.current = { userId, userType };
    await fetchFromBackend(userId, userType);
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await fetch(`${API_CONFIG.BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async (userId: string) => {
    try {
      await fetch(`${API_CONFIG.BASE_URL}/notifications/user/${userId}/read-all`, {
        method: 'PUT',
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const refreshNotifications = () => {
    if (currentUserRef.current) {
      fetchFromBackend(currentUserRef.current.userId, currentUserRef.current.userType);
    }
  };

  // Poll every 15 seconds for near-real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentUserRef.current) {
        fetchFromBackend(currentUserRef.current.userId, currentUserRef.current.userType);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loadNotifications, markAsRead, markAllAsRead, refreshNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
