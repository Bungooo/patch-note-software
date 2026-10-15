import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// "YYYY-MM-DD" lu en heure locale (new Date("YYYY-MM-DD") serait interprété en UTC)
export const parseLocalDate = (value: string) => new Date(`${value}T00:00:00`)

// Élément sélectionné : teinte atténuée de la couleur de marque (primary), plus marquée que le survol (accent)
export const SELECTED = "bg-primary/10 text-primary font-medium hover:bg-primary/15 hover:text-primary"
// Même chose pour les éléments de liste cochés (data-state de Radix)
export const SELECTED_ITEM = "data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary data-[state=checked]:font-medium data-[state=checked]:focus:bg-primary/15 data-[state=checked]:focus:text-primary"

export const formatDate = (value: string) => parseLocalDate(value).toLocaleDateString("fr-FR")
