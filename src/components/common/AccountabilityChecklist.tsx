import React from 'react'
import { AgreementDisclosure } from './AgreementDisclosure'

interface AccountabilityChecklistProps {
  title: string
  items: readonly string[]
  checked: boolean[]
  onChange: (index: number, checked: boolean) => void
  tone?: 'green' | 'orange'
  description?: string
}

/** A compact disclosure with independently controlled, transaction-scoped acknowledgements. */
export const AccountabilityChecklist: React.FC<AccountabilityChecklistProps> = ({
  title, items, checked, onChange, tone = 'green', description,
}) => (
  <AgreementDisclosure
    title={title}
    tone={tone}
    summary={<p className="text-xs text-[#6B756F]">{description ?? `Review and accept all ${items.length} required statements.`}</p>}
  >
    <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
      {items.map((statement, index) => (
        <label key={statement} className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E6EAE7] p-3 text-sm leading-5 text-[#29352F] transition-colors hover:bg-[#FAFAFA]">
          <input
            type="checkbox"
            checked={Boolean(checked[index])}
            onChange={(event) => onChange(index, event.target.checked)}
            className={`mt-0.5 h-4 w-4 shrink-0 rounded border-[#B7C3BA] ${tone === 'orange' ? 'text-[#C25E00] focus:ring-[#C25E00]' : 'text-[#1B5E20] focus:ring-[#1B5E20]'}`}
          />
          <span><strong className="mr-1">{index + 1}.</strong>{statement}</span>
        </label>
      ))}
    </div>
  </AgreementDisclosure>
)
