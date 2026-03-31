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
  if (error.message?.includes('Network request failed') || 
      error.message?.includes('Failed to fetch') ||
      error.code === 'NETWORK_ERROR') {
    return {
      type: 'network',
      title: 'Network Connectivity Issue',
      message: 'A stable internet connection is required to continue. Please try again.',
      canRetry: true,
    };
  }

  if (error.message?.includes('timeout') || error.code === 'ECONNABORTED') {
    return {
      type: 'timeout',
      title: 'Request Timed Out',
      message: 'The request exceeded the expected response time. Please retry.',
      canRetry: true,
    };
  }

  if (error.response?.status === 401 || error.response?.status === 403) {
    return {
      type: 'auth',
      title: 'Authorization Required',
      message: error.response?.data?.message || 'Your session is no longer valid. Please sign in again.',
      canRetry: false,
    };
  }

  if (error.response?.status === 400 || error.response?.status === 422) {
    return {
      type: 'validation',
      title: 'Input Validation Required',
      message: error.response?.data?.message || 'One or more fields require attention. Please review and submit again.',
      canRetry: false,
    };
  }

  if (error.response?.status >= 500) {
    return {
      type: 'api',
      title: 'Service Unavailable',
      message: 'The service is temporarily unavailable. Please try again shortly.',
      canRetry: true,
    };
  }

  if (error.response?.data?.message) {
    return {
      type: 'api',
      message: error.response.data.message,
      canRetry: error.response.status >= 500,
    };
  }

  if (error instanceof AppError) {
    return {
      type: error.type,
      title: error.title,
      message: error.message,
      canRetry: error.canRetry,
    };
  }

  if (error instanceof TypeError || error instanceof ReferenceError) {
    throw error;
  }

  return {
    type: 'general',
    title: 'Unexpected Application Error',
    message: error.message || 'An unexpected issue occurred while processing your request.',
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
    throw criticalError;
  }
};
