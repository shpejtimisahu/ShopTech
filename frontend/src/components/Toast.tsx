import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const config = {
    success: { icon: "✓", bg: "bg-green-500", ring: "ring-green-200" },
    error: { icon: "✕", bg: "bg-red-500", ring: "ring-red-200" },
    info: { icon: "ℹ", bg: "bg-indigo-500", ring: "ring-indigo-200" },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
        {toasts.map(toast => {
          const c = config[toast.type];
          return (
            <div
              key={toast.id}
              onClick={() => removeToast(toast.id)}
              className="flex items-center gap-3 bg-white rounded-2xl shadow-lg border border-gray-100 pl-3 pr-4 py-3 min-w-[260px] max-w-sm cursor-pointer animate-[slideIn_0.3s_ease-out]"
              style={{ animation: "slideIn 0.3s ease-out" }}
            >
              <div className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                {c.icon}
              </div>
              <p className="text-sm text-gray-700 font-medium flex-1">{toast.message}</p>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
