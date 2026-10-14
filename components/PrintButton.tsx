'use client'

import { Printer } from 'lucide-react'
import { secondaryBtnCls } from './ui'

export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={`${secondaryBtnCls} print:hidden`}>
      <Printer className="h-4 w-4" /> Print / save PDF
    </button>
  )
}
