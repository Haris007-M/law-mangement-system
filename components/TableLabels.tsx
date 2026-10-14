'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// On phones every table turns into a list of cards (see globals.css). Each cell needs to know
// its column title for that, so this copies the header text onto the cells (data-label).
// Works for every table, including ones added later. Add class "no-stack" to a table to opt out.
export default function TableLabels() {
  const pathname = usePathname()

  useEffect(() => {
    const apply = () => {
      document.querySelectorAll<HTMLTableElement>('main table:not(.no-stack)').forEach((table) => {
        const heads = Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent?.trim() ?? '')
        table.querySelectorAll('tbody tr').forEach((tr) => {
          Array.from(tr.children).forEach((cell, i) => {
            if (!cell.hasAttribute('data-label')) cell.setAttribute('data-label', heads[i] ?? '')
          })
        })
      })
    }
    apply()

    const main = document.querySelector('main')
    if (!main) return
    let frame = 0
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(apply)
    })
    observer.observe(main, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [pathname])

  return null
}
