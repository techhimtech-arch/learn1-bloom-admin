import { toast } from 'sonner';

interface ApiError {
  response?: {
    data?: {
      message?: string;
      errors?: Array<{
        field: string;
        message: string;
        value?: any;
      }>;
    };
  };
}

export function handleApiError(error: ApiError, fallbackMessage?: string) {
  const response = error.response?.data;
  
  if (response?.errors && Array.isArray(response.errors)) {
    // Show individual field errors
    response.errors.forEach((err) => {
      toast.error(`${err.field}: ${err.message}`);
    });
  } else {
    // Show general error message
    toast.error(response?.message || fallbackMessage || 'An error occurred');
  }
}

export function getApiErrorMessage(error: ApiError, fallbackMessage?: string): string {
  const response = error.response?.data;
  
  if (response?.errors && Array.isArray(response.errors)) {
    // Return first error message
    return response.errors[0]?.message || response?.message || fallbackMessage || 'An error occurred';
  }
  
  return response?.message || fallbackMessage || 'An error occurred';
}
