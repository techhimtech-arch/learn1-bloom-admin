import React from 'react';
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
  const data = error?.response?.data;
  const message = data?.message || error?.message || fallback;

  // Extract field-level validation errors
  const errors = data?.errors;
  let errorLines: string[] = [];
  if (Array.isArray(errors) && errors.length > 0) {
    const seen = new Set<string>();
    errorLines = errors
      .filter((e: any) => {
        const key = e.path || e.field || '';
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((e: any) => e.msg || e.message);
  }

  const description = errorLines.length > 0
    ? React.createElement('div', null,
        React.createElement('span', null, message),
        React.createElement('ul', { className: 'mt-1 list-disc pl-4 text-xs space-y-0.5' },
          ...errorLines.map((line, i) => React.createElement('li', { key: i }, line))
        )
      )
    : message;

  toast({
    variant: 'destructive',
    title: 'Error',
    description,
  });
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
