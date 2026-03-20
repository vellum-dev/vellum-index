import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const countryNames = new Intl.DisplayNames(["en"], { type: "region" })

export function formatCountry(code: string): string {
  try {
    return countryNames.of(code) ?? code
  } catch {
    return code
  }
}
