import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// "YYYY-MM-DD" lu en heure locale (new Date("YYYY-MM-DD") serait interprété en UTC)
export const parseLocalDate = (value: string) => new Date(`${value}T00:00:00`)

export const formatDate = (value: string) => parseLocalDate(value).toLocaleDateString("fr-FR")
