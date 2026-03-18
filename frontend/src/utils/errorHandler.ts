import { ErrorType } from '../components/ErrorModal';

export interface ErrorInfo {
  type: ErrorType;
  title?: string;
  message: string;
  canRetry: boolean;
}

export class AppError extends Error {
  type: ErrorType;
  title?: string;
  canRetry: boolean;

  constructor(type: ErrorType, message: string, title?: string, canRetry: boolean = false) {
    super(message);
    this.type = type;
    this.title = title;
    this.canRetry = canRetry;
    this.name = 'AppError';
  }
}

export const parseError = (error: any): ErrorInfo => {
  // Network errors
  if (error.message?.includes('Network request failed') || 
      error.message?.includes('Failed to fetch') ||
      error.code === 'NETWORK_ERROR') {
    return {
      type: 'network',
      title: 'No Internet Connection',
      message: 'Please check your internet connection and try again.',
      canRetry: true,
    };
  }

  // Timeout errors
  if (error.message?.includes('timeout') || error.code === 'ECONNABORTED') {
    return {
      type: 'timeout',
      title: 'Request Timeout',
      message: 'The request took too long to complete. Please try again.',
      canRetry: true,
    };
  }

  // Authentication errors
  if (error.response?.status === 401 || error.response?.status === 403) {
    return {
      type: 'auth',
      title: 'Authentication Failed',
      message: error.response?.data?.message || 'Your session has expired. Please login again.',
      canRetry: false,
    };
  }

  // Validation errors
  if (error.response?.status === 400 || error.response?.status === 422) {
    return {
      type: 'validation',
      title: 'Invalid Input',
      message: error.response?.data?.message || 'Please check your input and try again.',
      canRetry: false,
    };
  }

  // Server errors
  if (error.response?.status >= 500) {
    return {
      type: 'api',
      title: 'Server Error',
      message: 'Our servers are experiencing issues. Please try again later.',
      canRetry: true,
    };
  }

  // API errors with custom messages
  if (error.response?.data?.message) {
    return {
      type: 'api',
      message: error.response.data.message,
      canRetry: error.response.status >= 500,
    };
  }

  // AppError instances
  if (error instanceof AppError) {
    return {
      type: error.type,
      title: error.title,
      message: error.message,
      canRetry: error.canRetry,
    };
  }

  // Generic errors (don't show these in modal - let them crash)
  if (error instanceof TypeError || error instanceof ReferenceError) {
    throw error; // Re-throw critical errors
  }

  // Unknown errors
  return {
    type: 'general',
    title: 'Something Went Wrong',
    message: error.message || 'An unexpected error occurred. Please try again.',
    canRetry: true,
  };
};

export const handleError = (
  error: any,
  showModal: (errorInfo: ErrorInfo) => void,
  fallbackMessage?: string
) => {
  try {
    const errorInfo = parseError(error);
    if (fallbackMessage) {
      errorInfo.message = fallbackMessage;
    }
    showModal(errorInfo);
  } catch (criticalError) {
    // Critical errors should crash the app for debugging
    throw criticalError;
  }
};
