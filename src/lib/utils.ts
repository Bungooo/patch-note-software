import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// "YYYY-MM-DD" lu en heure locale (new Date("YYYY-MM-DD") serait interprété en UTC)
export const parseLocalDate = (value: string) => new Date(`${value}T00:00:00`)

// Élément de liste coché : mêmes couleurs que le bouton principal (Button variant "default")
export const SELECTED_ITEM = "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:focus:bg-primary/90 data-[state=checked]:focus:text-primary-foreground"

export const formatDate = (value: string) => parseLocalDate(value).toLocaleDateString("fr-FR")
