import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function maskSecret(secret: string): string {
  if (secret.length <= 8) {
    return "••••••••";
  }

  return `${secret.slice(0, 4)}••••••••${secret.slice(-4)}`;
}
