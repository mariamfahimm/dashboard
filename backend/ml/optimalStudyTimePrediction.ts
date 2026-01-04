// Optimal Study Time Prediction
// Analyzes when students perform best based on submission times and grades
// Returns suggestions (not absolute predictions) for parents

import Grade from '../models/Grade'
import Assignment from '../models/Assignment'
import Course from '../models/Course'

export interface TimeWindow {
  label: string
  startHour: number
  endHour: number
  averageScore: number
  submissionCount: number
  confidence: number
}

export interface OptimalStudyTimeInsight {
  bestTimeWindow: TimeWindow | null
  timeWindows: TimeWindow[]
  dayOfWeekPatterns: {
    day: string
    averageScore: number
    submissionCount: number
  }[]
  subjectSpecificInsights: {
    subject: string
    bestTimeWindow: TimeWindow | null
    averageScore: number
  }[]
  recommendations: string[]
  dataQuality: 'high' | 'medium' | 'low'
  note: string
}

/**
 * Analyze optimal study times based on submission patterns and performance
 * Returns suggestions, not absolute predictions
 */
export async function predictOptimalStudyTime(
  studentId: string,
  language: string = 'en'
): Promise<OptimalStudyTimeInsight> {
  try {
    // Get all grades for the student
    const grades = await Grade.find({ studentId: String(studentId) })
      .sort({ submittedAt: -1 })
      .limit(100) // Analyze last 100 submissions for better accuracy

  if (grades.length === 0) {
    return {
      bestTimeWindow: null,
      timeWindows: [],
      dayOfWeekPatterns: [],
      subjectSpecificInsights: [],
      recommendations: [
        language === 'ar' 
          ? 'لا توجد بيانات كافية بعد. عندما يقدم طفلك المزيد من الواجبات، سنتمكن من اقتراح أوقات دراسة مثلى.'
          : 'Not enough data yet. As your child submits more assignments, we\'ll be able to suggest optimal study times.'
      ],
      dataQuality: 'low',
      note: language === 'ar'
        ? 'استناداً إلى أوقات التقديم السابقة والأداء. هذه اقتراحات وليست ضمانات.'
        : 'Based on past submission times and performance. These are suggestions, not guarantees.'
    }
  }

  // Get assignments and courses for subject information
  const assignmentIds = [...new Set(grades.map(g => g?.assignmentId).filter(id => id && id !== 'undefined'))]
  
  if (assignmentIds.length === 0) {
    return {
      bestTimeWindow: null,
      timeWindows: [],
      dayOfWeekPatterns: [],
      subjectSpecificInsights: [],
      recommendations: [
        language === 'ar' 
          ? 'لا توجد بيانات كافية بعد. عندما يقدم طفلك المزيد من الواجبات، سنتمكن من اقتراح أوقات دراسة مثلى.'
          : 'Not enough data yet. As your child submits more assignments, we\'ll be able to suggest optimal study times.'
      ],
      dataQuality: 'low',
      note: language === 'ar'
        ? 'استناداً إلى أوقات التقديم السابقة والأداء. هذه اقتراحات وليست ضمانات.'
        : 'Based on past submission times and performance. These are suggestions, not guarantees.'
    }
  }
  
  const assignments = await Assignment.find({ _id: { $in: assignmentIds } })
  const courseIds = [...new Set(assignments.map(a => a?.courseId).filter(id => id && id !== 'undefined'))]
  
  if (courseIds.length === 0) {
    return {
      bestTimeWindow: null,
      timeWindows: [],
      dayOfWeekPatterns: [],
      subjectSpecificInsights: [],
      recommendations: [
        language === 'ar' 
          ? 'لا توجد بيانات كافية بعد. عندما يقدم طفلك المزيد من الواجبات، سنتمكن من اقتراح أوقات دراسة مثلى.'
          : 'Not enough data yet. As your child submits more assignments, we\'ll be able to suggest optimal study times.'
      ],
      dataQuality: 'low',
      note: language === 'ar'
        ? 'استناداً إلى أوقات التقديم السابقة والأداء. هذه اقتراحات وليست ضمانات.'
        : 'Based on past submission times and performance. These are suggestions, not guarantees.'
    }
  }
  
  const courses = await Course.find({ _id: { $in: courseIds } })

  // Create a map for quick lookup
  const assignmentMap = new Map(assignments.map(a => [String(a._id), a]))
  const courseMap = new Map(courses.map(c => [String(c._id), c]))

  // Define time windows (with translations)
  const timeWindows: { label: string; startHour: number; endHour: number }[] = language === 'ar' ? [
    { label: 'الصباح الباكر (6-9 ص)', startHour: 6, endHour: 9 },
    { label: 'الصباح (9 ص-12 م)', startHour: 9, endHour: 12 },
    { label: 'بعد الظهر (12-3 م)', startHour: 12, endHour: 15 },
    { label: 'أواخر بعد الظهر (3-6 م)', startHour: 15, endHour: 18 },
    { label: 'المساء (6-9 م)', startHour: 18, endHour: 21 },
    { label: 'الليل (9 م-12 ص)', startHour: 21, endHour: 24 }
  ] : [
    { label: 'Early Morning (6-9 AM)', startHour: 6, endHour: 9 },
    { label: 'Morning (9 AM-12 PM)', startHour: 9, endHour: 12 },
    { label: 'Afternoon (12-3 PM)', startHour: 12, endHour: 15 },
    { label: 'Late Afternoon (3-6 PM)', startHour: 15, endHour: 18 },
    { label: 'Evening (6-9 PM)', startHour: 18, endHour: 21 },
    { label: 'Night (9 PM-12 AM)', startHour: 21, endHour: 24 }
  ]

  // Analyze performance by time window
  const timeWindowAnalysis: TimeWindow[] = timeWindows.map(window => {
    const windowGrades = grades.filter(grade => {
      if (!grade || !grade.submittedAt) return false
      try {
        const submittedAt = new Date(grade.submittedAt)
        if (isNaN(submittedAt.getTime())) return false
        const hour = submittedAt.getHours()
        return hour >= window.startHour && hour < window.endHour
      } catch {
        return false
      }
    })

    if (windowGrades.length === 0) {
      return {
        ...window,
        averageScore: 0,
        submissionCount: 0,
        confidence: 0
      }
    }

    const validGrades = windowGrades.filter(g => g && g.percentage != null && !isNaN(g.percentage))
    const averageScore = validGrades.length > 0
      ? validGrades.reduce((sum, g) => sum + (g.percentage || 0), 0) / validGrades.length
      : 0
    const confidence = Math.min(windowGrades.length / 10, 1) // More submissions = higher confidence

    return {
      ...window,
      averageScore: Math.round(averageScore * 100) / 100,
      submissionCount: windowGrades.length,
      confidence: Math.round(confidence * 100) / 100
    }
  }).filter(w => w.submissionCount > 0) // Only include windows with data

  // Find best time window (highest average score with at least 3 submissions)
  const bestTimeWindow = timeWindowAnalysis
    .filter(w => w.submissionCount >= 3)
    .sort((a, b) => {
      // Sort by average score, then by submission count
      if (Math.abs(a.averageScore - b.averageScore) < 2) {
        return b.submissionCount - a.submissionCount
      }
      return b.averageScore - a.averageScore
    })[0] || null

  // Analyze day of week patterns (with translations)
  const dayNames = language === 'ar' 
    ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayOfWeekPatterns = dayNames.map((day, dayIndex) => {
    const dayGrades = grades.filter(grade => {
      if (!grade || !grade.submittedAt) return false
      try {
        const submittedAt = new Date(grade.submittedAt)
        if (isNaN(submittedAt.getTime())) return false
        return submittedAt.getDay() === dayIndex
      } catch {
        return false
      }
    })

    const validDayGrades = dayGrades.filter(g => g && g.percentage != null && !isNaN(g.percentage))
    const averageScore = validDayGrades.length > 0
      ? Math.round((validDayGrades.reduce((sum, g) => sum + (g.percentage || 0), 0) / validDayGrades.length) * 100) / 100
      : 0

    return {
      day,
      averageScore,
      submissionCount: validDayGrades.length
    }
  }).filter(p => p.submissionCount > 0)

  // Analyze subject-specific patterns
  const subjectMap = new Map<string, { grades: typeof grades; averageScore: number }>()

  grades.forEach(grade => {
    if (!grade || !grade.assignmentId) return
    const assignment = assignmentMap.get(String(grade.assignmentId))
    if (!assignment) return

    const course = courseMap.get(String(assignment.courseId))
    const subject = course?.subject || assignment?.subject || 'Unknown'

    if (!subject || subject === 'Unknown') return

    if (!subjectMap.has(subject)) {
      subjectMap.set(subject, { grades: [], averageScore: 0 })
    }

    const subjectData = subjectMap.get(subject)
    if (subjectData) {
      subjectData.grades.push(grade)
    }
  })

  const subjectSpecificInsights = Array.from(subjectMap.entries()).map(([subject, data]) => {
    const validGrades = data.grades.filter(g => g && g.percentage != null && !isNaN(g.percentage))
    if (validGrades.length === 0) {
      return {
        subject,
        bestTimeWindow: null,
        averageScore: 0
      }
    }
    const averageScore = validGrades.reduce((sum, g) => sum + (g.percentage || 0), 0) / validGrades.length

    // Find best time window for this subject
    const subjectTimeWindows = timeWindows.map(window => {
      const windowGrades = validGrades.filter(grade => {
        if (!grade || !grade.submittedAt) return false
        try {
          const submittedAt = new Date(grade.submittedAt)
          if (isNaN(submittedAt.getTime())) return false
          const hour = submittedAt.getHours()
          return hour >= window.startHour && hour < window.endHour
        } catch {
          return false
        }
      })

      if (windowGrades.length === 0) return null

      const validWindowGrades = windowGrades.filter(g => g && g.percentage != null && !isNaN(g.percentage))
      if (validWindowGrades.length === 0) return null
      const avgScore = validWindowGrades.reduce((sum, g) => sum + (g.percentage || 0), 0) / validWindowGrades.length
      return {
        ...window,
        averageScore: Math.round(avgScore * 100) / 100,
        submissionCount: validWindowGrades.length,
        confidence: Math.min(validWindowGrades.length / 5, 1)
      }
    }).filter(w => w !== null && w.submissionCount >= 2) as TimeWindow[]

    const bestSubjectWindow = subjectTimeWindows
      .sort((a, b) => {
        if (Math.abs(a.averageScore - b.averageScore) < 2) {
          return b.submissionCount - a.submissionCount
        }
        return b.averageScore - a.averageScore
      })[0] || null

    return {
      subject,
      bestTimeWindow: bestSubjectWindow,
      averageScore: Math.round(averageScore * 100) / 100
    }
  })

  // Generate recommendations (with language support)
  const recommendations: string[] = []

  if (bestTimeWindow) {
    if (language === 'ar') {
      recommendations.push(
        `استناداً إلى الأداء السابق، قد يؤدي طفلك بشكل أفضل عند الدراسة خلال ${bestTimeWindow.label}.`
      )
    } else {
    recommendations.push(
      `Based on past performance, your child may perform better when studying during ${bestTimeWindow.label.toLowerCase()}.`
    )
    }
  }

  // Subject-specific recommendations
  const topSubjects = subjectSpecificInsights
    .filter(s => s.bestTimeWindow && s.bestTimeWindow.submissionCount >= 2)
    .sort((a, b) => (b.bestTimeWindow?.averageScore || 0) - (a.bestTimeWindow?.averageScore || 0))
    .slice(0, 3)

  topSubjects.forEach(subject => {
    if (subject.bestTimeWindow) {
      if (language === 'ar') {
        recommendations.push(
          `بالنسبة لـ ${subject.subject}، العمل السابق المقدم خلال ${subject.bestTimeWindow.label} يميل إلى الحصول على درجات أعلى.`
        )
      } else {
      recommendations.push(
        `For ${subject.subject}, past work submitted during ${subject.bestTimeWindow.label.toLowerCase()} tended to score higher.`
      )
      }
    }
  })

  // Day of week insights
  const bestDay = dayOfWeekPatterns
    .filter(p => p.submissionCount >= 3)
    .sort((a, b) => b.averageScore - a.averageScore)[0]

  if (bestDay && bestDay.averageScore > 85) {
    if (language === 'ar') {
      recommendations.push(
        `كان الأداء أقوى في أيام ${bestDay.day} استناداً إلى التقديمات السابقة.`
      )
    } else {
    recommendations.push(
      `Performance has been stronger on ${bestDay.day}s based on past submissions.`
    )
    }
  }

  // Add disclaimer
  if (recommendations.length === 0) {
    if (language === 'ar') {
      recommendations.push(
        'نحتاج إلى المزيد من بيانات التقديم لتوفير توصيات وقت محددة. استمر في تشجيع عادات الدراسة المنتظمة!'
      )
    } else {
    recommendations.push(
      'We need more submission data to provide specific time recommendations. Keep encouraging regular study habits!'
    )
    }
  }

  // Determine data quality
  let dataQuality: 'high' | 'medium' | 'low' = 'low'
  if (grades.length >= 30 && timeWindowAnalysis.length >= 3) {
    dataQuality = 'high'
  } else if (grades.length >= 10 && timeWindowAnalysis.length >= 2) {
    dataQuality = 'medium'
  }

  return {
    bestTimeWindow,
    timeWindows: timeWindowAnalysis.sort((a, b) => b.averageScore - a.averageScore),
    dayOfWeekPatterns: dayOfWeekPatterns.sort((a, b) => b.averageScore - a.averageScore),
    subjectSpecificInsights,
    recommendations,
    dataQuality,
    note: language === 'ar'
      ? 'هذه الاقتراحات تستند إلى أوقات التقديم السابقة وأنماط الأداء. قد تختلف النتائج الفردية، ويمكن لعوامل كثيرة أن تؤثر على الأداء الأكاديمي.'
      : 'These suggestions are based on past submission times and performance patterns. Individual results may vary, and many factors can influence academic performance.'
  }
  } catch (error) {
    console.error('Error in predictOptimalStudyTime:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      studentId: studentId
    })
    // Return safe default response
    return {
      bestTimeWindow: null,
      timeWindows: [],
      dayOfWeekPatterns: [],
      subjectSpecificInsights: [],
      recommendations: [
        language === 'ar' 
          ? 'حدث خطأ أثناء تحليل أوقات الدراسة. يرجى المحاولة مرة أخرى لاحقاً.'
          : 'An error occurred while analyzing study times. Please try again later.'
      ],
      dataQuality: 'low',
      note: language === 'ar'
        ? 'استناداً إلى أوقات التقديم السابقة والأداء. هذه اقتراحات وليست ضمانات.'
        : 'Based on past submission times and performance. These are suggestions, not guarantees.'
    }
  }
}

