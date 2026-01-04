// Print Utilities - Helper functions for printing pages

/**
 * Print the current page or a specific element
 */
export function printPage(elementId?: string) {
  if (elementId) {
    const element = document.getElementById(elementId)
    if (element) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
              </style>
            </head>
            <body>
              ${element.innerHTML}
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 250)
      }
    }
  } else {
    window.print()
  }
}

/**
 * Prepare element for printing (hide non-printable elements)
 */
export function prepareForPrint(element: HTMLElement) {
  const nonPrintElements = element.querySelectorAll('.no-print, button:not(.print-button), .print-hide')
  const originalDisplay: string[] = []
  
  nonPrintElements.forEach((el) => {
    const htmlEl = el as HTMLElement
    originalDisplay.push(htmlEl.style.display)
    htmlEl.style.display = 'none'
  })
  
  return () => {
    // Restore function
    nonPrintElements.forEach((el, index) => {
      const htmlEl = el as HTMLElement
      htmlEl.style.display = originalDisplay[index] || ''
    })
  }
}

