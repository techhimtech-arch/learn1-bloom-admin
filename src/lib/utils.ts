import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Indian Rupees formatting for fee displays */
export function formatINR(n: number): string {
  return `₹${(n || 0).toLocaleString('en-IN')}`;
}
