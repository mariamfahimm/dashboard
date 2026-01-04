// Export Button Component - Provides export options (PDF, Excel, Print)
import React, { useState } from 'react'
import { HiDownload, HiPrinter } from 'react-icons/hi'

interface ExportButtonProps {
  onExportPDF?: () => void
  onExportExcel?: () => void
  onPrint?: () => void
  label?: string
  className?: string
}

export function ExportButton({
  onExportPDF,
  onExportExcel,
  onPrint,
  label = 'Export',
  className = '',
}: ExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false)

  const hasOptions = onExportPDF || onExportExcel || onPrint

  if (!hasOptions) {
    return null
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 shadow-soft"
      >
        <HiDownload className="w-4 h-4" />
        <span>{label}</span>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-20">
            {onPrint && (
              <button
                onClick={() => {
                  onPrint()
                  setShowMenu(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <HiPrinter className="w-4 h-4" />
                Print
              </button>
            )}
            {onExportPDF && (
              <button
                onClick={() => {
                  onExportPDF()
                  setShowMenu(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <HiDownload className="w-4 h-4" />
                Export PDF
              </button>
            )}
            {onExportExcel && (
              <button
                onClick={() => {
                  onExportExcel()
                  setShowMenu(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <HiDownload className="w-4 h-4" />
                Export Excel
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

