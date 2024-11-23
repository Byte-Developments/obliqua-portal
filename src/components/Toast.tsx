import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiAlertCircle, FiInfo } from 'react-icons/fi';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const toastTypeConfig = {
  success: {
    icon: FiCheck,
    className: 'bg-green-50 border-green-200 text-green-800',
    iconClass: 'text-green-400'
  },
  error: {
    icon: FiAlertCircle,
    className: 'bg-red-50 border-red-200 text-red-800',
    iconClass: 'text-red-400'
  },
  warning: {
    icon: FiAlertCircle,
    className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    iconClass: 'text-yellow-400'
  },
  info: {
    icon: FiInfo,
    className: 'bg-blue-50 border-blue-200 text-blue-800',
    iconClass: 'text-blue-400'
  }
};

function Toast({ toast, onDismiss }: ToastProps) {
  const { icon: Icon, className, iconClass } = toastTypeConfig[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`flex items-center justify-between w-full max-w-sm px-4 py-3 rounded-lg shadow-lg border ${className}`}
    >
      <div className="flex items-center space-x-3">
        <Icon className={`w-5 h-5 ${iconClass}`} />
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded-full hover:bg-black/5 transition-colors"
      >
        <FiX className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export default Toast;