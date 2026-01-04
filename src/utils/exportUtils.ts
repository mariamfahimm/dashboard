// Export Utilities - Helper functions for exporting data to PDF/Excel

import jsPDF from 'jspdf'
// @ts-ignore - jspdf-autotable doesn't have types
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    lastAutoTable?: { finalY?: number }
  }
}

/**
 * Export data to PDF
 */
export function exportToPDF(
  title: string,
  data: any[],
  columns: { header: string; dataKey: string }[],
  filename?: string
) {
  const doc = new jsPDF()
  
  // Add title
  doc.setFontSize(16)
  doc.text(title, 14, 15)
  
  // Add date
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22)
  
  // Prepare table data
  const tableData = data.map((row) =>
    columns.map((col) => {
      const value = row[col.dataKey]
      return value !== null && value !== undefined ? String(value) : ''
    })
  )
  
  const headers = columns.map((col) => col.header)
  
  // Add table
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 28,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  })
  
  // Save PDF
  doc.save(filename || `${title.replace(/\s+/g, '_')}_${Date.now()}.pdf`)
}

/**
 * Export data to Excel/CSV
 */
export function exportToExcel(
  data: any[],
  sheetName: string = 'Sheet1',
  filename?: string
) {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  
  // Generate filename
  const excelFilename = filename || `export_${Date.now()}.xlsx`
  
  // Write file
  XLSX.writeFile(workbook, excelFilename)
}

/**
 * Export grades to PDF with formatting
 */
export function exportGradesToPDF(
  studentName: string,
  grades: any[],
  filename?: string
) {
  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(18)
  doc.text('Academic Report', 105, 20, { align: 'center' })
  
  // Student info
  doc.setFontSize(12)
  doc.text(`Student: ${studentName}`, 14, 30)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 37)
  
  // Prepare table
  const tableData = grades.map((grade) => [
    grade.subject || grade.course?.subject || 'N/A',
    grade.assignment?.title || grade.type || 'N/A',
    grade.score !== undefined ? `${grade.score}%` : 'N/A',
    grade.grade || 'N/A',
    grade.date ? new Date(grade.date).toLocaleDateString() : 'N/A',
  ])
  
  // Add table
  autoTable(doc, {
    head: [['Subject', 'Assignment', 'Score', 'Grade', 'Date']],
    body: tableData,
    startY: 45,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  })
  
  // Calculate average
  const validScores = grades
    .map((g) => g.score)
    .filter((s) => s !== null && s !== undefined)
  const average = validScores.length > 0
    ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1)
    : 'N/A'
  
  const finalY = (doc as any).lastAutoTable?.finalY || 45
  doc.setFontSize(12)
  doc.text(`Average Score: ${average}%`, 14, finalY + 10)
  
  // Save
  doc.save(filename || `${studentName}_Grades_${Date.now()}.pdf`)
}

/**
 * Export attendance to PDF
 */
export function exportAttendanceToPDF(
  studentName: string,
  attendance: any[],
  filename?: string
) {
  const doc = new jsPDF()
  
  doc.setFontSize(18)
  doc.text('Attendance Report', 105, 20, { align: 'center' })
  
  doc.setFontSize(12)
  doc.text(`Student: ${studentName}`, 14, 30)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 37)
  
  const tableData = attendance.map((record) => [
    record.date ? new Date(record.date).toLocaleDateString() : 'N/A',
    record.status || 'N/A',
    record.course?.subject || record.subject || 'N/A',
    record.notes || '',
  ])
  
  autoTable(doc, {
    head: [['Date', 'Status', 'Subject', 'Notes']],
    body: tableData,
    startY: 45,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  })
  
  // Calculate statistics
  const present = attendance.filter((a) => a.status === 'present').length
  const absent = attendance.filter((a) => a.status === 'absent').length
  const total = attendance.length
  const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0'
  
  const finalY = (doc as any).lastAutoTable?.finalY || 45
  doc.setFontSize(12)
  doc.text(`Present: ${present} | Absent: ${absent} | Total: ${total}`, 14, finalY + 10)
  doc.text(`Attendance Rate: ${percentage}%`, 14, finalY + 17)
  
  doc.save(filename || `${studentName}_Attendance_${Date.now()}.pdf`)
}

/**
 * Export fees to PDF
 */
export function exportFeesToPDF(
  studentName: string,
  fees: any[],
  stats?: any,
  filename?: string
) {
  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(18)
  doc.text('Fees & Payments Report', 105, 20, { align: 'center' })
  
  // Student info
  doc.setFontSize(12)
  doc.text(`Student: ${studentName}`, 14, 30)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 37)
  
  // Stats summary
  if (stats) {
    const finalY = 44
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Total Fees: E£${stats.totalAmount.toFixed(2)}`, 14, finalY)
    doc.text(`Total Paid: E£${stats.totalPaid.toFixed(2)}`, 14, finalY + 7)
    doc.text(`Total Pending: E£${stats.totalPending.toFixed(2)}`, 14, finalY + 14)
    if (stats.overdueAmount > 0) {
      doc.setTextColor(220, 38, 38)
      doc.text(`Overdue: E£${stats.overdueAmount.toFixed(2)}`, 14, finalY + 21)
      doc.setTextColor(100, 100, 100)
    }
  }
  
  // Prepare table data
  const tableData = fees.map((fee) => [
    fee.description || 'N/A',
    fee.feeType || 'N/A',
    `E£${fee.amount.toFixed(2)}`,
    `E£${fee.paidAmount.toFixed(2)}`,
    `E£${(fee.amount - fee.paidAmount).toFixed(2)}`,
    fee.status || 'N/A',
    fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : 'N/A',
  ])
  
  const startY = stats ? 65 : 45
  
  // Add table
  autoTable(doc, {
    head: [['Description', 'Type', 'Amount', 'Paid', 'Balance', 'Status', 'Due Date']],
    body: tableData,
    startY: startY,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
  })
  
  // Save
  doc.save(filename || `${studentName}_Fees_${Date.now()}.pdf`)
}

/**
 * Export fees to Excel
 */
export function exportFeesToExcel(
  studentName: string,
  fees: any[],
  stats?: any
) {
  // Prepare data
  const excelData = fees.map((fee) => ({
    'Description': fee.description || 'N/A',
    'Fee Type': fee.feeType || 'N/A',
    'Amount': fee.amount,
    'Paid': fee.paidAmount,
    'Balance': fee.amount - fee.paidAmount,
    'Status': fee.status || 'N/A',
    'Due Date': fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : 'N/A',
    'Payment Method': fee.paymentMethod || 'N/A',
  }))
  
  // Add summary row if stats available
  if (stats) {
    excelData.push({} as any) // Empty row
    excelData.push({
      'Description': 'SUMMARY',
      'Fee Type': '',
      'Amount': stats.totalAmount,
      'Paid': stats.totalPaid,
      'Balance': stats.totalPending,
      'Status': '',
      'Due Date': '',
      'Payment Method': '',
    })
  }
  
  exportToExcel(
    excelData,
    'Fees',
    `${studentName}_Fees_${Date.now()}.xlsx`
  )
}

/**
 * Export timetable to PDF
 */
export function exportTimetableToPDF(
  studentName: string,
  weeklySchedule: { [key: number]: any[] },
  filename?: string
) {
  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(18)
  doc.text('Weekly Timetable', 105, 20, { align: 'center' })
  
  // Student info
  doc.setFontSize(12)
  doc.text(`Student: ${studentName}`, 14, 30)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 37)
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  let startY = 45
  
  // Process each day
  for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
    const dayEntries = weeklySchedule[dayOfWeek] || []
    if (dayEntries.length === 0) continue
    
    const dayName = days[dayOfWeek - 1] || 'Day'
    
    // Check if we need a new page
    if (startY > 250) {
      doc.addPage()
      startY = 20
    }
    
    // Day header
    doc.setFontSize(14)
    doc.setTextColor(59, 130, 246)
    doc.text(dayName, 14, startY)
    doc.setTextColor(0, 0, 0)
    
    startY += 8
    
    // Prepare table data for this day
    const tableData = dayEntries
      .sort((a, b) => a.period - b.period)
      .map((entry) => [
        `Period ${entry.period}`,
        entry.course?.subject || entry.course?.title || 'N/A',
        `${entry.startTime} - ${entry.endTime}`,
        entry.room || 'N/A',
        entry.teacher || entry.teacherName || 'N/A',
      ])
    
    // Add table for this day
    autoTable(doc, {
      head: [['Period', 'Subject', 'Time', 'Room', 'Teacher']],
      body: tableData,
      startY: startY,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    })
    
    startY = (doc as any).lastAutoTable?.finalY || startY
    startY += 10 // Space between days
  }
  
  // Save
  doc.save(filename || `${studentName}_Timetable_${Date.now()}.pdf`)
}

/**
 * Export timetable to Excel
 */
export function exportTimetableToExcel(
  studentName: string,
  weeklySchedule: { [key: number]: any[] }
) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const excelData: any[] = []
  
  // Process each day
  for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
    const dayEntries = weeklySchedule[dayOfWeek] || []
    if (dayEntries.length === 0) continue
    
    const dayName = days[dayOfWeek - 1] || 'Day'
    
    // Add day header
    excelData.push({
      'Day': dayName,
      'Period': '',
      'Subject': '',
      'Time': '',
      'Room': '',
      'Teacher': '',
    })
    
    // Add entries for this day
    dayEntries
      .sort((a, b) => a.period - b.period)
      .forEach((entry) => {
        excelData.push({
          'Day': '',
          'Period': entry.period,
          'Subject': entry.course?.subject || entry.course?.title || 'N/A',
          'Time': `${entry.startTime} - ${entry.endTime}`,
          'Room': entry.room || 'N/A',
          'Teacher': entry.teacher || entry.teacherName || 'N/A',
        })
      })
    
    // Empty row between days
    excelData.push({
      'Day': '',
      'Period': '',
      'Subject': '',
      'Time': '',
      'Room': '',
      'Teacher': '',
    })
  }
  
  exportToExcel(
    excelData,
    'Timetable',
    `${studentName}_Timetable_${Date.now()}.xlsx`
  )
}

/**
 * Generate payment receipt as PDF
 */
export function generateReceiptPDF(
  payment: {
    fee: {
      description: string
      feeType: string
      amount: number
    }
    amount: number
    paymentDate: string
    paymentMethod: string
    receiptNumber?: string
    notes?: string
  },
  studentName: string,
  parentName?: string,
  filename?: string
) {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.setTextColor(59, 130, 246)
  doc.text('PAYMENT RECEIPT', 105, 20, { align: 'center' })
  
  // Receipt number
  if (payment.receiptNumber) {
    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.text(`Receipt #: ${payment.receiptNumber}`, 105, 28, { align: 'center' })
  }
  
  // Date
  doc.setFontSize(10)
  doc.text(`Date: ${new Date(payment.paymentDate).toLocaleDateString()}`, 14, 40)
  
  // Payment details
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text(`Student: ${studentName}`, 14, 50)
  if (parentName) {
    doc.text(`Parent: ${parentName}`, 14, 57)
  }
  doc.text(`Fee: ${payment.fee.description}`, 14, 64)
  doc.text(`Fee Type: ${payment.fee.feeType}`, 14, 71)
  
  // Amount box
  doc.setDrawColor(59, 130, 246)
  doc.setFillColor(245, 247, 250)
  doc.rect(14, 78, 85, 20, 'FD')
  doc.setFontSize(14)
  doc.text('Amount Paid:', 20, 88)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(`E£${payment.amount.toFixed(2)}`, 20, 98)
  doc.setFont('helvetica', 'normal')
  
  // Payment method
  doc.setFontSize(10)
  doc.text(`Payment Method: ${payment.paymentMethod}`, 14, 108)
  
  // Notes
  if (payment.notes) {
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Notes: ${payment.notes}`, 14, 118)
  }
  
  // Footer
  const finalY = 140
  doc.setDrawColor(200, 200, 200)
  doc.line(14, finalY, 196, finalY)
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('This is a computer-generated receipt.', 105, finalY + 8, { align: 'center' })
  doc.text(`Generated on ${new Date().toLocaleString()}`, 105, finalY + 12, { align: 'center' })
  
  // Save
  doc.save(filename || `Receipt_${payment.receiptNumber || Date.now()}.pdf`)
}

/**
 * Simple print function
 */
export function printPage() {
  window.print()
}

