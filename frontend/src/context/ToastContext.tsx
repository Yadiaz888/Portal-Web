import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { CheckCircle, Info, X, XCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  notify: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const styles = {
  success: {
    icon: CheckCircle,
    className: 'border-green-100 bg-green-50 text-green-800',
    iconClassName: 'text-green-600',
  },
  error: {
    icon: XCircle,
    className: 'border-red-100 bg-red-50 text-red-800',
    iconClassName: 'text-red-600',
  },
  info: {
    icon: Info,
    className: 'border-orange-100 bg-orange-50 text-[#1A1F36]',
    iconClassName: 'text-[#E8450A]',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const value = useMemo<ToastContextValue>(() => ({
    notify: (message, type = 'info') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      window.setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, 3500);
    },
  }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-5 top-5 z-[70] flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-3">
        {toasts.map(toast => {
          const style = styles[toast.type];
          const Icon = style.icon;

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${style.className}`}
            >
              <Icon size={18} className={`mt-0.5 flex-shrink-0 ${style.iconClassName}`} />
              <p className="min-w-0 flex-1 text-sm font-medium leading-snug">{toast.message}</p>
              <button
                onClick={() => setToasts(prev => prev.filter(item => item.id !== toast.id))}
                className="rounded-md p-0.5 text-gray-400 hover:bg-white/70 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
