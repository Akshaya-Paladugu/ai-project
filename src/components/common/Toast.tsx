import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}

interface ToastContextType {
  showToast: (type: ToastMessage['type'], title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: ToastMessage['type'], title: string, description?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          const borderBg = isSuccess
            ? 'border-emerald-200 bg-white text-emerald-950 shadow-lg'
            : isError
            ? 'border-red-200 bg-white text-red-950 shadow-lg'
            : isWarning
            ? 'border-amber-200 bg-white text-amber-950 shadow-lg'
            : 'border-slate-200 bg-white text-slate-900 shadow-lg';

          const icon = isSuccess ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : isError ? (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          ) : isWarning ? (
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          ) : (
            <Info className="w-5 h-5 text-blue-600 shrink-0" />
          );

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border transition-all ${borderBg}`}
            >
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{toast.title}</div>
                {toast.description && (
                  <div className="text-xs text-slate-600 mt-0.5 leading-snug">{toast.description}</div>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-1 -mr-1 -mt-1 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};
