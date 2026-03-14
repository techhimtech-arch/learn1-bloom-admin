import { toast } from '@/hooks/use-toast';

/**
 * Show API success message in a toast.
 * Uses the `message` field from the API response if available.
 */
export const showApiSuccess = (response: any, fallback = 'Operation successful') => {
  const message = response?.data?.message || response?.message || fallback;
  toast({ title: 'Success', description: message });
};

/**
 * Show API error message in a toast.
 * Uses the `message` field from the API error response if available.
 */
export const showApiError = (error: any, fallback = 'Something went wrong') => {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    fallback;
  toast({ variant: 'destructive', title: 'Error', description: message });
};

/**
 * Extract field-level errors from API validation response.
 * Returns a Record<field, message> or null if none found.
 */
export const getApiFieldErrors = (error: any): Record<string, string> | null => {
  const errors = error?.response?.data?.errors;
  if (!Array.isArray(errors) || errors.length === 0) return null;
  const mapped: Record<string, string> = {};
  errors.forEach((e: { field: string; message: string }) => {
    mapped[e.field] = e.message;
  });
  return mapped;
};
