// Translation mappings for recommendations and insights
// Ensures generated content is in the user's preferred language

export const recommendationTranslations = {
  en: {
    // Subject Focus
    focusOnSubjectNeedsSupport: (subject: string) => `Focus on ${subject} - Needs Extra Support`,
    childStrugglingWithSubject: (subject: string, avg: number) => `Your child is struggling with ${subject} (below ${avg}% average). This subject needs immediate attention to prevent falling further behind.`,
    scheduleMinutesDaily: (subject: string) => `Schedule 30 minutes daily for ${subject} homework`,
    reviewSubjectAssignments: (subject: string) => `Review ${subject} assignments together before submission`,
    contactSubjectTeacher: (subject: string) => `Contact the ${subject} teacher to discuss support strategies`,
    considerTutoringForSubject: (subject: string) => `Consider additional tutoring or study resources for ${subject}`,
    celebrateImprovementsInSubject: (subject: string) => `Celebrate small improvements in ${subject} to build confidence`,
    improveSubjectGrade: () => 'Improve subject grade by 10-15% within 4-6 weeks',
    weeksToSeeImprovement: () => '2-3 weeks to see improvement',
    
    // Study Schedule
    establishConsistentStudyRoutine: () => 'Establish Consistent Study Routine',
    studyPatternsInconsistent: () => 'Your child\'s study patterns are inconsistent. A regular schedule will improve performance and reduce stress.',
    setFixedStudyTime: () => 'Set a fixed study time each day (e.g., 4:00-5:30 PM)',
    createQuietStudySpace: () => 'Create a quiet, distraction-free study space',
    useStudyCalendar: () => 'Use a study calendar to track assignments and deadlines',
    breakStudySessions: () => 'Break study sessions into 25-minute blocks with 5-minute breaks',
    reviewScheduleWeekly: () => 'Review the schedule weekly and adjust as needed',
    improveCompletionReduceStress: () => 'Improve assignment completion rate and reduce last-minute stress',
    weeksToEstablishHabit: () => '2-3 weeks to establish habit',
    
    // Assignment Completion
    improveAssignmentCompletion: () => 'Improve Assignment Completion',
    childCompletingPercent: (percent: number) => `Your child is completing ${percent}% of assignments. Missing assignments can significantly impact grades.`,
    checkDashboardDaily: () => 'Check the dashboard daily for new assignments',
    setRemindersBeforeDue: () => 'Set reminders 2 days before each assignment is due',
    breakLargeAssignments: () => 'Help break large assignments into smaller tasks',
    reviewCompletedTogether: () => 'Review completed assignments together before submission',
    celebrateCompletedAssignments: () => 'Celebrate completed assignments to build positive reinforcement',
    increaseCompletionRate: () => 'Increase completion rate to 90%+ within 3-4 weeks',
    weeks34: () => '3-4 weeks',
    
    // Grade Trend - Declining
    addressDecliningGrades: () => 'Address Declining Grades - Immediate Action Needed',
    gradesDeclining: () => 'Your child\'s grades are declining. Early intervention can prevent further academic struggles.',
    scheduleMeetingWithTeachers: () => 'Schedule a meeting with teachers to discuss concerns',
    identifyRootCause: () => 'Identify the root cause (difficulty, motivation, external factors)',
    increaseMonitoringSupport: () => 'Increase monitoring and support at home',
    considerAcademicSupport: () => 'Consider additional academic support or tutoring',
    focusOnBuildingConfidence: () => 'Focus on building confidence through small wins',
    stopDeclineBeginRecovery: () => 'Stop the decline and begin recovery within 4-6 weeks',
    immediateActionResults: () => 'Immediate action, results in 4-6 weeks',
    
    // Grade Trend - Improving
    maintainPositiveMomentum: () => 'Maintain Positive Momentum',
    gradesImproving: () => 'Your child\'s grades are improving! Keep supporting this positive trend.',
    acknowledgeCelebrate: () => 'Acknowledge and celebrate the improvement',
    continueCurrentStrategies: () => 'Continue current support strategies that are working',
    setNewGoals: () => 'Set new, achievable goals to maintain momentum',
    sharePositiveFeedback: () => 'Share positive feedback with teachers',
    avoidTooMuchPressure: () => 'Avoid putting too much pressure - maintain balance',
    sustainImprovement: () => 'Sustain improvement and build long-term academic confidence',
    ongoing: () => 'Ongoing',
    
    // Strong Subjects
    leverageStrengths: (subjects: string) => `Leverage Strengths in ${subjects}`,
    childExcelsIn: (subjects: string) => `Your child excels in ${subjects}. Use these strengths to build confidence and support other subjects.`,
    celebrateAchievementsIn: (subjects: string) => `Celebrate achievements in ${subjects}`,
    useStrongSubjectsAsExamples: () => 'Use strong subjects as examples of what your child can achieve',
    connectStrongSubjectStrategies: () => 'Connect strong subject strategies to weaker subjects',
    considerAdvancedOpportunities: () => 'Consider advanced opportunities in strong subjects',
    maintainEngagement: () => 'Maintain engagement in strong subjects while supporting others',
    buildConfidenceTransferStrategies: () => 'Build confidence and transfer learning strategies',
    
    // Resources
    exploreAdditionalResources: () => 'Explore Additional Learning Resources',
    childMayBenefit: () => 'Your child may benefit from additional learning resources to supplement classroom instruction.',
    researchOnlinePlatforms: () => 'Research online learning platforms for your child\'s grade level',
    lookForEducationalApps: () => 'Look for educational apps that make learning fun',
    visitLibrary: () => 'Visit the local library for subject-specific books',
    considerYouTubeKhan: () => 'Consider educational YouTube channels or Khan Academy',
    askTeachersForResources: () => 'Ask teachers for recommended resources',
    provideAlternativeLearning: () => 'Provide alternative learning methods that may resonate better',
    weeksToIdentify: () => '1-2 weeks to identify, ongoing use',
    
    // Study Time Optimization
    optimizeStudyTime: (time: string) => `Optimize Study Time - Best Performance in ${time}`,
    basedOnPerformance: (time: string) => `Based on performance patterns, your child performs best during ${time}. Schedule important study sessions during this time.`,
    scheduleChallengingSubjects: (time: string) => `Schedule challenging subjects during ${time}`,
    useTimeForNewMaterial: (time: string) => `Use ${time} for new material and difficult assignments`,
    reserveOtherTimes: () => 'Reserve other times for review and lighter work',
    adjustFamilySchedule: () => 'Adjust family schedule if possible to accommodate optimal study time',
    monitorPatternContinue: () => 'Monitor if this pattern continues and adjust as needed',
    improveLearningEfficiency: () => 'Improve learning efficiency and retention',
    weeksToSeeImpact: () => '2-3 weeks to see impact',
    
    // Default/Monitoring
    stayEngaged: () => 'Stay Engaged with Your Child\'s Education',
    regularMonitoringKey: () => 'Regular monitoring and support are key to academic success.',
    checkDashboardRegularly: () => 'Check the dashboard regularly for updates',
    reviewAssignmentsTogether: () => 'Review assignments and grades together',
    communicateWithTeachers: () => 'Communicate with teachers as needed',
    celebrateAchievements: () => 'Celebrate achievements and provide encouragement',
    maintainAwareness: () => 'Maintain awareness and provide timely support',
  },
  ar: {
    // Subject Focus
    focusOnSubjectNeedsSupport: (subject: string) => `التركيز على ${subject} - يحتاج دعم إضافي`,
    childStrugglingWithSubject: (subject: string, avg: number) => `طفلك يواجه صعوبة في ${subject} (أقل من ${avg}% متوسط). هذه المادة تحتاج إلى اهتمام فوري لمنع المزيد من التراجع.`,
    scheduleMinutesDaily: (subject: string) => `جدولة 30 دقيقة يومياً لواجبات ${subject}`,
    reviewSubjectAssignments: (subject: string) => `مراجعة واجبات ${subject} معاً قبل التسليم`,
    contactSubjectTeacher: (subject: string) => `التواصل مع معلم ${subject} لمناقشة استراتيجيات الدعم`,
    considerTutoringForSubject: (subject: string) => `النظر في دروس إضافية أو موارد دراسية لـ ${subject}`,
    celebrateImprovementsInSubject: (subject: string) => `احتفل بالتحسينات الصغيرة في ${subject} لبناء الثقة`,
    improveSubjectGrade: () => 'تحسين درجة المادة بنسبة 10-15% خلال 4-6 أسابيع',
    weeksToSeeImprovement: () => '2-3 أسابيع لرؤية التحسين',
    
    // Study Schedule
    establishConsistentStudyRoutine: () => 'إنشاء روتين دراسي ثابت',
    studyPatternsInconsistent: () => 'أنماط الدراسة لطفلك غير متسقة. جدول منتظم سيحسن الأداء ويقلل التوتر.',
    setFixedStudyTime: () => 'تحديد وقت دراسة ثابت كل يوم (مثلاً: 4:00-5:30 مساءً)',
    createQuietStudySpace: () => 'إنشاء مساحة دراسية هادئة خالية من المشتتات',
    useStudyCalendar: () => 'استخدام تقويم دراسي لتتبع الواجبات والمواعيد النهائية',
    breakStudySessions: () => 'تقسيم جلسات الدراسة إلى كتل مدتها 25 دقيقة مع استراحات 5 دقائق',
    reviewScheduleWeekly: () => 'مراجعة الجدول أسبوعياً والتعديل حسب الحاجة',
    improveCompletionReduceStress: () => 'تحسين معدل إكمال الواجبات وتقليل التوتر في اللحظة الأخيرة',
    weeksToEstablishHabit: () => '2-3 أسابيع لإنشاء العادة',
    
    // Assignment Completion
    improveAssignmentCompletion: () => 'تحسين إكمال الواجبات',
    childCompletingPercent: (percent: number) => `طفلك يكمل ${percent}% من الواجبات. الواجبات المفقودة يمكن أن تؤثر بشكل كبير على الدرجات.`,
    checkDashboardDaily: () => 'التحقق من لوحة التحكم يومياً للواجبات الجديدة',
    setRemindersBeforeDue: () => 'تعيين تذكيرات قبل يومين من موعد استحقاق كل واجب',
    breakLargeAssignments: () => 'المساعدة في تقسيم الواجبات الكبيرة إلى مهام أصغر',
    reviewCompletedTogether: () => 'مراجعة الواجبات المكتملة معاً قبل التسليم',
    celebrateCompletedAssignments: () => 'احتفل بالواجبات المكتملة لبناء التعزيز الإيجابي',
    increaseCompletionRate: () => 'زيادة معدل الإكمال إلى 90%+ خلال 3-4 أسابيع',
    weeks34: () => '3-4 أسابيع',
    
    // Grade Trend - Declining
    addressDecliningGrades: () => 'معالجة الدرجات المتراجعة - إجراء فوري مطلوب',
    gradesDeclining: () => 'درجات طفلك في تراجع. التدخل المبكر يمكن أن يمنع المزيد من الصعوبات الأكاديمية.',
    scheduleMeetingWithTeachers: () => 'جدولة اجتماع مع المعلمين لمناقشة المخاوف',
    identifyRootCause: () => 'تحديد السبب الجذري (صعوبة، دافعية، عوامل خارجية)',
    increaseMonitoringSupport: () => 'زيادة المراقبة والدعم في المنزل',
    considerAcademicSupport: () => 'النظر في الدعم الأكاديمي الإضافي أو الدروس الخصوصية',
    focusOnBuildingConfidence: () => 'التركيز على بناء الثقة من خلال الانتصارات الصغيرة',
    stopDeclineBeginRecovery: () => 'وقف التراجع وبدء التعافي خلال 4-6 أسابيع',
    immediateActionResults: () => 'إجراء فوري، النتائج خلال 4-6 أسابيع',
    
    // Grade Trend - Improving
    maintainPositiveMomentum: () => 'الحفاظ على الزخم الإيجابي',
    gradesImproving: () => 'درجات طفلك تتحسن! استمر في دعم هذا الاتجاه الإيجابي.',
    acknowledgeCelebrate: () => 'الاعتراف والاحتفال بالتحسين',
    continueCurrentStrategies: () => 'متابعة استراتيجيات الدعم الحالية التي تعمل',
    setNewGoals: () => 'تعيين أهداف جديدة قابلة للتحقيق للحفاظ على الزخم',
    sharePositiveFeedback: () => 'مشاركة ملاحظات إيجابية مع المعلمين',
    avoidTooMuchPressure: () => 'تجنب وضع الكثير من الضغط - الحفاظ على التوازن',
    sustainImprovement: () => 'الحفاظ على التحسين وبناء الثقة الأكاديمية طويلة الأمد',
    ongoing: () => 'مستمر',
    
    // Strong Subjects
    leverageStrengths: (subjects: string) => `استغلال نقاط القوة في ${subjects}`,
    childExcelsIn: (subjects: string) => `طفلك متفوق في ${subjects}. استخدم هذه نقاط القوة لبناء الثقة ودعم المواد الأخرى.`,
    celebrateAchievementsIn: (subjects: string) => `احتفل بالإنجازات في ${subjects}`,
    useStrongSubjectsAsExamples: () => 'استخدم المواد القوية كمثال على ما يمكن لطفلك تحقيقه',
    connectStrongSubjectStrategies: () => 'ربط استراتيجيات المواد القوية بالمواد الضعيفة',
    considerAdvancedOpportunities: () => 'النظر في فرص متقدمة في المواد القوية',
    maintainEngagement: () => 'الحفاظ على المشاركة في المواد القوية مع دعم الأخرى',
    buildConfidenceTransferStrategies: () => 'بناء الثقة ونقل استراتيجيات التعلم',
    
    // Resources
    exploreAdditionalResources: () => 'استكشاف موارد تعليمية إضافية',
    childMayBenefit: () => 'طفلك قد يستفيد من موارد تعليمية إضافية لتكملة التعليم الصفي.',
    researchOnlinePlatforms: () => 'البحث عن منصات تعليمية عبر الإنترنت لمستوى طفلك الدراسي',
    lookForEducationalApps: () => 'ابحث عن تطبيقات تعليمية تجعل التعلم ممتعاً',
    visitLibrary: () => 'زيارة المكتبة المحلية للكتب المتعلقة بالموضوع',
    considerYouTubeKhan: () => 'النظر في قنوات يوتيوب تعليمية أو أكاديمية خان',
    askTeachersForResources: () => 'اسأل المعلمين عن الموارد الموصى بها',
    provideAlternativeLearning: () => 'توفير طرق تعلم بديلة قد تتناسب بشكل أفضل',
    weeksToIdentify: () => '1-2 أسبوع لتحديد، استخدام مستمر',
    
    // Study Time Optimization
    optimizeStudyTime: (time: string) => `تحسين وقت الدراسة - أفضل أداء في ${time}`,
    basedOnPerformance: (time: string) => `استناداً إلى أنماط الأداء، طفلك يؤدي بشكل أفضل خلال ${time}. حدد جلسات الدراسة المهمة خلال هذا الوقت.`,
    scheduleChallengingSubjects: (time: string) => `جدولة المواد الصعبة خلال ${time}`,
    useTimeForNewMaterial: (time: string) => `استخدم ${time} للمادة الجديدة والواجبات الصعبة`,
    reserveOtherTimes: () => 'احتفظ بالأوقات الأخرى للمراجعة والعمل الأخف',
    adjustFamilySchedule: () => 'تعديل جدول العائلة إن أمكن لاستيعاب وقت الدراسة الأمثل',
    monitorPatternContinue: () => 'راقب إذا استمر هذا النمط وعدل حسب الحاجة',
    improveLearningEfficiency: () => 'تحسين كفاءة التعلم والاحتفاظ',
    weeksToSeeImpact: () => '2-3 أسابيع لرؤية التأثير',
    
    // Default/Monitoring
    stayEngaged: () => 'ابق مشاركاً في تعليم طفلك',
    regularMonitoringKey: () => 'المراقبة والدعم المنتظمان هما مفتاح النجاح الأكاديمي.',
    checkDashboardRegularly: () => 'تحقق من لوحة التحكم بانتظام للتحديثات',
    reviewAssignmentsTogether: () => 'راجع الواجبات والدرجات معاً',
    communicateWithTeachers: () => 'تواصل مع المعلمين حسب الحاجة',
    celebrateAchievements: () => 'احتفل بالإنجازات وقدم التشجيع',
    maintainAwareness: () => 'الحفاظ على الوعي وتوفير الدعم في الوقت المناسب',
  }
}

export function getRecommendationText(key: string, language: string = 'en', ...args: any[]): string {
  const translations = recommendationTranslations[language as keyof typeof recommendationTranslations] || recommendationTranslations.en
  const text = translations[key as keyof typeof translations]
  
  if (typeof text === 'function') {
    return (text as (...args: any[]) => string)(...args)
  }
  return text || key
}

