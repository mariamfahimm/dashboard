// Common name translations for Arabic display
// This maps common English names to their Arabic equivalents
// If a student has an Arabic name stored in the database, it will be used instead

export const nameTranslations: Record<string, string> = {
  // Common names
  'Emma': 'إيما',
  'Lucas': 'لوكاس',
  'Sophia': 'صوفيا',
  'Oliver': 'أوليفر',
  'Ava': 'آفا',
  'Mia': 'ميا',
  'James': 'جيمس',
  'Charlotte': 'شارلوت',
  'Benjamin': 'بنجامين',
  'Amelia': 'أميليا',
  'Mariam': 'مريم',
  'Mohamed': 'محمد',
  'Ahmed': 'أحمد',
  'Ali': 'علي',
  'Fatima': 'فاطمة',
  'Sara': 'سارة',
  'Youssef': 'يوسف',
  'Omar': 'عمر',
  'Layla': 'ليلى',
  'Zainab': 'زينب'
}

export function translateName(name: string, locale: string): string {
  if (locale !== 'ar') {
    return name
  }
  
  // Check if name is already in Arabic (contains Arabic characters)
  const arabicRegex = /[\u0600-\u06FF]/
  if (arabicRegex.test(name)) {
    return name
  }
  
  // Try to translate common names
  return nameTranslations[name] || name
}

