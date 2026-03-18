import { useState, useCallback } from 'react';
import { ErrorInfo, parseError } from '../utils/errorHandler';

export const useErrorModal = () => {
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  const [retryCallback, setRetryCallback] = useState<(() => void) | null>(null);

  const showError = useCallback((error: any, onRetry?: () => void) => {
    try {
      const info = parseError(error);
      setErrorInfo(info);
      if (onRetry && info.canRetry) {
        setRetryCallback(() => onRetry);
      } else {
        setRetryCallback(null);
      }
    } catch (criticalError) {
      // Re-throw critical errors
      throw criticalError;
    }
  }, []);

  const hideError = useCallback(() => {
    setErrorInfo(null);
    setRetryCallback(null);
  }, []);

  const handleRetry = useCallback(() => {
    if (retryCallback) {
      retryCallback();
    }
  }, [retryCallback]);

  return {
    errorInfo,
    showError,
    hideError,
    handleRetry,
    isVisible: errorInfo !== null,
  };
};
