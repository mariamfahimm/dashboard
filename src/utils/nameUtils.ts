// Utility for handling student names with Arabic support
export function getStudentDisplayName(student: { name?: string; nameArabic?: string }, locale: string = 'en'): string {
  // If Arabic locale and Arabic name exists, use Arabic name
  if (locale === 'ar' && student?.nameArabic) {
    return student.nameArabic
  }
  // Otherwise use the default name
  return student?.name || ''
}

