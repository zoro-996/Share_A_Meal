import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface AgreementDisclosureProps {
  title: string
  summary: React.ReactNode
  children: React.ReactNode
  tone?: 'green' | 'orange'
}

/** Keeps required agreement controls out of the main form until explicitly opened. */
export const AgreementDisclosure: React.FC<AgreementDisclosureProps> = ({ title, summary, children, tone = 'green' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const accent = tone === 'green' ? 'text-[#1B5E20] hover:text-[#144718]' : 'text-[#9A3412] hover:text-[#7C2D12]'

  return (
    <section className="rounded-2xl border border-[#E6EAE7] bg-white">
      <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5">
        <h3 className="text-sm font-bold text-[#29352F]">{title}</h3>
        <button type="button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} className={`inline-flex shrink-0 items-center gap-1 text-sm font-semibold underline underline-offset-4 cursor-pointer ${accent}`}>
          <span>{isOpen ? 'Close' : 'Read more'}</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
      <div className="border-t border-[#E6EAE7] px-4 py-3.5 sm:px-5">{summary}</div>
      {isOpen && <div className="border-t border-[#E6EAE7] p-4 sm:p-5">{children}</div>}
    </section>
  )
}
