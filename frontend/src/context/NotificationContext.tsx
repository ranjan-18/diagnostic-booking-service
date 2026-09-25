import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (type: NotificationType, message: string, title?: string, duration?: number) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showNotification = useCallback(
    (type: NotificationType, message: string, title?: string, duration: number = 4500) => {
      const id = Math.random().toString(36).substring(2, 9);
      setNotifications((prev) => [...prev, { id, type, title, message, duration }]);

      setTimeout(() => {
        removeNotification(id);
      }, duration);
    },
    [removeNotification]
  );

  const showSuccess = useCallback(
    (message: string, title: string = 'Success') => showNotification('success', message, title),
    [showNotification]
  );
  const showError = useCallback(
    (message: string, title: string = 'Error') => showNotification('error', message, title),
    [showNotification]
  );
  const showWarning = useCallback(
    (message: string, title: string = 'Attention') => showNotification('warning', message, title),
    [showNotification]
  );
  const showInfo = useCallback(
    (message: string, title: string = 'Notice') => showNotification('info', message, title),
    [showNotification]
  );

  const getToastStyles = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return {
          card: 'bg-white border-emerald-200 text-slate-800 shadow-emerald-500/10',
          iconBg: 'bg-emerald-100 text-emerald-600',
          icon: <CheckCircle2 className="w-5 h-5" />,
          progressBar: 'bg-emerald-500',
          titleColor: 'text-emerald-950',
        };
      case 'error':
        return {
          card: 'bg-white border-rose-200 text-slate-800 shadow-rose-500/10',
          iconBg: 'bg-rose-100 text-rose-600',
          icon: <AlertCircle className="w-5 h-5" />,
          progressBar: 'bg-rose-500',
          titleColor: 'text-rose-950',
        };
      case 'warning':
        return {
          card: 'bg-white border-amber-200 text-slate-800 shadow-amber-500/10',
          iconBg: 'bg-amber-100 text-amber-600',
          icon: <AlertTriangle className="w-5 h-5" />,
          progressBar: 'bg-amber-500',
          titleColor: 'text-amber-950',
        };
      case 'info':
      default:
        return {
          card: 'bg-white border-sky-200 text-slate-800 shadow-sky-500/10',
          iconBg: 'bg-sky-100 text-sky-600',
          icon: <Info className="w-5 h-5" />,
          progressBar: 'bg-sky-500',
          titleColor: 'text-sky-950',
        };
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}

      {/* Toast Stack (Top-Right) */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm sm:max-w-md w-full px-4 sm:px-0 pointer-events-none">
        {notifications.map((n) => {
          const style = getToastStyles(n.type);

          return (
            <div
              key={n.id}
              className={`pointer-events-auto relative overflow-hidden flex items-start gap-3.5 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all animate-toast-in ${style.card}`}
            >
              {/* Icon Container */}
              <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${style.iconBg}`}>
                {style.icon}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0 pr-2">
                {n.title && (
                  <h4 className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${style.titleColor}`}>
                    {n.title}
                  </h4>
                )}
                <p className="text-sm font-medium text-slate-700 leading-relaxed break-words">
                  {n.message}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => removeNotification(n.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0 -mt-1 -mr-1"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Countdown Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 overflow-hidden">
                <div className={`h-full animate-toast-progress ${style.progressBar}`} />
              </div>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
