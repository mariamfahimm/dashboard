// Email Service for sending welcome emails and notifications
import nodemailer from 'nodemailer'

// Email configuration from environment variables
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com'
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587')
const EMAIL_USER = process.env.EMAIL_USER || ''
const EMAIL_PASS = process.env.EMAIL_PASS || ''
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER || 'noreply@educonnect.com'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// Create transporter (works with Gmail, Outlook, or any SMTP server)
const createTransporter = () => {
  // If no email credentials, return a mock transporter for development
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn('⚠️  Email credentials not configured. Emails will be logged to console only.')
    console.warn('   To enable real emails, add EMAIL_USER and EMAIL_PASS to your .env file')
    return {
      sendMail: async (options: any) => {
        console.log('📧 [MOCK EMAIL - NOT SENT]')
        console.log('   To:', options.to)
        console.log('   Subject:', options.subject)
        console.log('   Full email would be:', JSON.stringify(options, null, 2))
        return { messageId: 'mock-' + Date.now() }
      }
    }
  }

  console.log('✅ Email service configured')
  console.log(`   Host: ${EMAIL_HOST}:${EMAIL_PORT}`)
  console.log(`   From: ${EMAIL_FROM}`)

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465, // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  })
}

const transporter = createTransporter()

// Welcome email template
export const sendWelcomeEmail = async (
  email: string,
  name: string,
  password: string,
  studentNames: string[] = [],
  language: 'en' | 'ar' = 'en'
): Promise<void> => {
  const loginUrl = `${FRONTEND_URL}/login`
  const isArabic = language === 'ar'
  const dir = isArabic ? 'rtl' : 'ltr'
  const textAlign = isArabic ? 'right' : 'left'
  
  // Translations
  const translations = {
    en: {
      welcome: 'Welcome to EduConnect!',
      subtitle: 'Your Parental Dashboard Account',
      dear: 'Dear',
      welcomeMessage: 'Welcome to EduConnect! Your account has been created and you can now access your parental dashboard to monitor your children\'s academic progress.',
      credentials: 'Your Login Credentials:',
      email: 'Email:',
      tempPassword: 'Temporary Password:',
      important: 'Important:',
      passwordChange: 'For security, please change your password after your first login.',
      childrenLinked: 'Your children linked to this account:',
      linkChildren: 'You can link your children\'s accounts using linking codes provided by the school.',
      loginButton: 'Login to Dashboard',
      questions: 'If you have any questions or need assistance, please contact your school\'s administration office.',
      regards: 'Best regards,',
      team: 'The EduConnect Team',
      automated: 'This is an automated email. Please do not reply to this message.',
      copyright: '©',
      rights: 'EduConnect. All rights reserved.'
    },
    ar: {
      welcome: 'مرحباً بك في EduConnect!',
      subtitle: 'حساب لوحة تحكم الوالدين',
      dear: 'عزيزي/عزيزتي',
      welcomeMessage: 'مرحباً بك في EduConnect! تم إنشاء حسابك ويمكنك الآن الوصول إلى لوحة تحكم الوالدين لمراقبة التقدم الأكاديمي لأطفالك.',
      credentials: 'بيانات تسجيل الدخول الخاصة بك:',
      email: 'البريد الإلكتروني:',
      tempPassword: 'كلمة المرور المؤقتة:',
      important: 'مهم:',
      passwordChange: 'لأسباب أمنية، يرجى تغيير كلمة المرور بعد تسجيل الدخول الأول.',
      childrenLinked: 'أطفالك المرتبطين بهذا الحساب:',
      linkChildren: 'يمكنك ربط حسابات أطفالك باستخدام رموز الربط المقدمة من المدرسة.',
      loginButton: 'تسجيل الدخول إلى لوحة التحكم',
      questions: 'إذا كان لديك أي أسئلة أو تحتاج إلى مساعدة، يرجى الاتصال بمكتب إدارة المدرسة.',
      regards: 'مع أطيب التحيات،',
      team: 'فريق EduConnect',
      automated: 'هذا بريد إلكتروني تلقائي. يرجى عدم الرد على هذه الرسالة.',
      copyright: '©',
      rights: 'EduConnect. جميع الحقوق محفوظة.'
    }
  }
  
  const t = translations[language]
  
  const studentsList = studentNames.length > 0
    ? `<p><strong>${t.childrenLinked}</strong></p><ul>${studentNames.map(name => `<li>${name}</li>`).join('')}</ul>`
    : `<p>${t.linkChildren}</p>`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: ${isArabic ? 'Arial, "Segoe UI", Tahoma, sans-serif' : 'Arial, sans-serif'}; line-height: 1.8; color: #333; direction: ${dir}; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; text-align: ${textAlign}; }
        .credentials { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-${isArabic ? 'right' : 'left'}: 4px solid #667eea; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
        h1, h3 { direction: ${dir}; text-align: ${textAlign}; }
      </style>
    </head>
    <body dir="${dir}">
      <div class="container">
        <div class="header">
          <h1>${t.welcome}</h1>
          <p>${t.subtitle}</p>
        </div>
        <div class="content">
          <p>${t.dear} ${name},</p>
          
          <p>${t.welcomeMessage}</p>
          
          <div class="credentials">
            <h3>${t.credentials}</h3>
            <p><strong>${t.email}</strong> ${email}</p>
            <p><strong>${t.tempPassword}</strong> <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 3px; font-family: monospace;">${password}</code></p>
          </div>
          
          <div class="warning">
            <strong>⚠️ ${t.important}</strong> ${t.passwordChange}
          </div>
          
          ${studentsList}
          
          <p style="text-align: center;">
            <a href="${loginUrl}" class="button">${t.loginButton}</a>
          </p>
          
          <p>${t.questions}</p>
          
          <p>${t.regards}<br>${t.team}</p>
        </div>
        <div class="footer">
          <p>${t.automated}</p>
          <p>${t.copyright} ${new Date().getFullYear()} ${t.rights}</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = isArabic ? `
${t.welcome}

${t.dear} ${name},

${t.welcomeMessage}

${t.credentials}

${t.email} ${email}
${t.tempPassword} ${password}

${t.important}: ${t.passwordChange}

${studentNames.length > 0 ? `${t.childrenLinked}\n${studentNames.map(name => `- ${name}`).join('\n')}` : t.linkChildren}

${t.loginButton}: ${loginUrl}

${t.questions}

${t.regards}
${t.team}
  ` : `
${t.welcome}

${t.dear} ${name},

${t.welcomeMessage}

${t.credentials}

${t.email} ${email}
${t.tempPassword} ${password}

${t.important}: ${t.passwordChange}

${studentNames.length > 0 ? `${t.childrenLinked}\n${studentNames.map(name => `- ${name}`).join('\n')}` : t.linkChildren}

${t.loginButton}: ${loginUrl}

${t.questions}

${t.regards}
${t.team}
  `

  try {
    const subject = isArabic 
      ? 'مرحباً بك في EduConnect - الوصول إلى لوحة التحكم'
      : 'Welcome to EduConnect - Your Dashboard Access'
    
    const result = await transporter.sendMail({
      from: `"EduConnect" <${EMAIL_FROM}>`,
      to: email,
      subject,
      text,
      html,
    })
    console.log(`✅ Welcome email sent to ${email}`)
    console.log(`   Message ID: ${result.messageId}`)
  } catch (error: any) {
    console.error(`❌ Failed to send welcome email to ${email}:`, error.message || error)
    // Don't throw error - account creation should still succeed even if email fails
    throw error // Re-throw so admin controller can handle it
  }
}

// Password reset email
export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetToken: string
): Promise<void> => {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          
          <p>You requested to reset your password. Click the button below to reset it:</p>
          
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          
          <p>If you didn't request this, please ignore this email. The link will expire in 1 hour.</p>
          
          <p>Best regards,<br>The EduConnect Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    await transporter.sendMail({
      from: `"EduConnect" <${EMAIL_FROM}>`,
      to: email,
      subject: 'EduConnect - Password Reset Request',
      html,
    })
    console.log(`✅ Password reset email sent to ${email}`)
  } catch (error) {
    console.error(`❌ Failed to send password reset email to ${email}:`, error)
    throw error
  }
}

