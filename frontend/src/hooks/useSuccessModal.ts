import { useState, useCallback } from 'react';

interface SuccessInfo {
  title?: string;
  message: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export const useSuccessModal = () => {
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null);

  const showSuccess = useCallback((
    message: string,
    title?: string,
    autoClose: boolean = true,
    autoCloseDelay: number = 2000
  ) => {
    setSuccessInfo({
      title,
      message,
      autoClose,
      autoCloseDelay,
    });
  }, []);

  const hideSuccess = useCallback(() => {
    setSuccessInfo(null);
  }, []);

  return {
    successInfo,
    showSuccess,
    hideSuccess,
    isVisible: successInfo !== null,
  };
};
