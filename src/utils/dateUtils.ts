/**
 * Date formatting utilities with Gregorian calendar support
 * Ensures dates use the Gregorian calendar even when Arabic locale is selected
 */

/**
 * Format a date string using Gregorian calendar with locale-aware formatting
 * @param dateString - ISO date string or Date object
 * @param locale - 'ar' or 'en'
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string | Date,
  locale: string = 'en',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  
  // Use Gregorian calendar explicitly for Arabic locale
  // ar-EG (Egypt) uses Gregorian calendar by default
  const localeString = locale === 'ar' ? 'ar-EG' : 'en-US'
  
  // Ensure we're using Gregorian calendar
  const formatOptions: Intl.DateTimeFormatOptions = {
    ...options,
    calendar: 'gregory'
  }
  
  try {
    return date.toLocaleDateString(localeString, formatOptions)
  } catch (e) {
    // Fallback if calendar option is not supported
    return date.toLocaleDateString(localeString, options)
  }
}

/**
 * Format date and time using Gregorian calendar
 */
export function formatDateTime(
  dateString: string | Date,
  locale: string = 'en',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  const localeString = locale === 'ar' ? 'ar-EG' : 'en-US'
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    ...options,
    calendar: 'gregory'
  }
  
  try {
    return date.toLocaleString(localeString, formatOptions)
  } catch (e) {
    return date.toLocaleString(localeString, options)
  }
}

/**
 * Format date with month and year only
 */
export function formatMonthYear(
  date: Date,
  locale: string = 'en'
): string {
  return formatDate(date, locale, {
    month: 'long',
    year: 'numeric',
    calendar: 'gregory'
  })
}

