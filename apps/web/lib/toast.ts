import toast, { ToastOptions } from 'react-hot-toast';

export const showSuccess = (message: string, options?: ToastOptions) => {
  toast.success(message, options);
};

export const showError = (message: string, options?: ToastOptions) => {
  toast.error(message, options);
};

export const showWarning = (message: string, options?: ToastOptions) => {
  toast(message, {
    icon: '⚠️',
    style: {
      background: '#1A1A2E',
      color: '#FAEEDA',
    },
    ...options
  });
};

export const showInfo = (message: string, options?: ToastOptions) => {
  toast(message, {
    icon: 'ℹ️',
    style: {
      background: '#1A1A2E',
      color: '#fff',
    },
    ...options
  });
};

export const showLoading = (message: string, options?: ToastOptions) => {
  return toast.loading(message, options);
};

export const dismissToast = (id?: string) => {
  toast.dismiss(id);
};

export const showSaleSuccess = (amount: number, method: string) => {
  toast.success(
    `Sale complete — KES ${amount.toLocaleString()} via ${method}`,
    { duration: 5000, icon: '🧾' }
  );
};

export const showMpesaWaiting = () => {
  return toast.loading('Waiting for M-Pesa confirmation...', {
    duration: 30000
  });
};

export const showOfflineWarning = () => {
  toast('You are offline — sales will sync when internet returns', {
    icon: '📶',
    duration: 6000,
    style: {
      background: '#854F0B',
      color: '#FAEEDA',
    }
  });
};

export const showLowStockAlert = (productName: string, quantity: number) => {
  toast(`Low stock: ${productName} — only ${quantity} left`, {
    icon: '📦',
    duration: 8000,
    style: {
      background: '#854F0B',
      color: '#FAEEDA',
    }
  });
};
