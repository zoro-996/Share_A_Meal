import React from 'react'
import heroVolunteerHandover from '../../assets/hero-volunteer-handover.jpg'

export const DashboardWelcome: React.FC<{
  title: React.ReactNode
  description: string
  actionLabel: string
  actionIcon: React.ReactNode
  onAction: () => void
  tone?: 'green' | 'orange'
}> = ({ title, description, actionLabel, actionIcon, onAction, tone = 'green' }) => {
  const isGreen = tone === 'green'
  return (
    <section className={`relative isolate min-h-[172px] overflow-hidden rounded-2xl border px-5 py-6 sm:px-7 sm:py-7 ${isGreen ? 'border-[#BFE2C1] bg-[radial-gradient(circle_at_72%_45%,rgba(255,255,255,.96),rgba(232,245,233,.88)_38%,#E8F5E9)]' : 'border-[#FFDDA9] bg-[radial-gradient(circle_at_72%_45%,rgba(255,255,255,.96),rgba(255,240,219,.88)_38%,#FFF0DB)]'}`}>
      <span aria-hidden="true" className={`absolute -left-4 bottom-2 h-16 w-16 rotate-45 rounded-[28px] opacity-60 ${isGreen ? 'bg-[#B7DDBA]' : 'bg-[#FFD39B]'}`} />
      <span aria-hidden="true" className={`absolute left-[48%] top-5 h-5 w-3 rotate-[-35deg] rounded-[100%_0_100%_0] ${isGreen ? 'bg-[#77B77B]' : 'bg-[#F09A55]'}`} />
      <span aria-hidden="true" className={`absolute left-[53%] bottom-6 h-4 w-8 rotate-[25deg] rounded-[100%_0_100%_0] opacity-80 ${isGreen ? 'bg-[#A5D6A7]' : 'bg-[#FFC982]'}`} />
      <span aria-hidden="true" className="absolute right-[31%] top-7 h-4 w-4 rounded-full bg-[#FF8A3D] opacity-80" />
      <div className="relative z-10 flex min-h-[120px] max-w-[63%] flex-col justify-center sm:max-w-[58%]">
        <div className={`mb-2 text-[11px] font-bold uppercase tracking-[0.18em] ${isGreen ? 'text-[#2F7A36]' : 'text-[#A24A23]'}`}>Good food · brighter communities</div>
        <h1 className="font-heading text-[30px] font-extrabold leading-[1.05] tracking-tight text-[#173B29] sm:text-[38px]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-5 text-[#536058] sm:text-[15px] sm:leading-6">{description}</p>
        <button type="button" onClick={onAction} className={`mt-4 inline-flex min-h-11 w-fit shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-[0_8px_16px_rgba(27,94,32,.18)] transition-all hover:-translate-y-0.5 cursor-pointer ${isGreen ? 'bg-[#1B5E20] hover:bg-[#144718]' : 'bg-[#9A3412] hover:bg-[#7C2D12]'}`}>
          {actionIcon}<span>{actionLabel}</span>
        </button>
      </div>
      <div aria-hidden="true" className="absolute inset-y-0 right-0 hidden w-[40%] overflow-hidden sm:block">
        <div className="absolute -bottom-10 right-7 h-44 w-44 overflow-hidden rounded-full border-[7px] border-white/65 shadow-[0_12px_32px_rgba(41,53,47,.12)]">
          <img src={heroVolunteerHandover} alt="" className="h-full w-full object-cover object-[60%_50%]" />
        </div>
        <span className={`absolute right-44 top-7 -rotate-6 font-heading text-xl font-bold leading-5 ${isGreen ? 'text-[#1B5E20]' : 'text-[#9A3412]'}`}>Good Food<br />Brighter Communities</span>
        <span className="absolute bottom-4 right-52 h-5 w-3 rotate-[-35deg] rounded-[100%_0_100%_0] bg-[#57A65C]" />
        <span className="absolute right-8 top-4 h-7 w-4 rotate-[32deg] rounded-[100%_0_100%_0] bg-[#F6A25B]" />
      </div>
    </section>
  )
}

export const DashboardMetric: React.FC<{
  label: string
  value: React.ReactNode
  icon: React.ReactNode
  tone: 'green' | 'orange' | 'blue'
}> = ({ label, value, icon, tone }) => {
  const tones = {
    green: 'bg-[#E8F5E9] border-[#C8E6C9] text-[#1B5E20]',
    orange: 'bg-[#FFF0DB] border-[#FFE0B2] text-[#9A3412]',
    blue: 'bg-[#EAF3FF] border-[#BFDBFE] text-[#1E40AF]',
  }
  return <div className="group flex min-h-[84px] items-center gap-2.5 rounded-2xl border border-[#E6EAE7] bg-white p-2.5 shadow-[0_2px_8px_rgba(41,53,47,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(41,53,47,0.09)] sm:min-h-[104px] sm:gap-4 sm:p-4">
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border sm:h-12 sm:w-12 sm:rounded-2xl ${tones[tone]}`}>{icon}</div>
    <div className="min-w-0"><p className="text-[9px] font-bold uppercase leading-3 tracking-wide text-[#6B756F] sm:text-[11px] sm:leading-normal sm:tracking-wider">{label}</p><div className="mt-0.5 font-heading text-lg font-extrabold text-[#29352F] sm:mt-1 sm:text-2xl">{value}</div></div>
  </div>
}

export const DashboardTabs: React.FC<{
  tabs: Array<{ id: string; label: string; count: number }>
  activeId: string
  onChange: (id: string) => void
}> = ({ tabs, activeId, onChange }) => <nav className="flex gap-1 overflow-x-auto border-b border-[#E6EAE7]" aria-label="Dashboard sections">
  {tabs.map((tab) => <button key={tab.id} type="button" onClick={() => onChange(tab.id)} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-xs font-bold transition-colors cursor-pointer sm:text-sm ${activeId === tab.id ? 'border-[#1B5E20] text-[#1B5E20]' : 'border-transparent text-[#6B756F] hover:text-[#29352F]'}`}>
    <span>{tab.label}</span><span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeId === tab.id ? 'bg-[#E8F5E9] text-[#1B5E20]' : 'bg-[#FAFAFA] text-[#6B756F]'}`}>{tab.count}</span>
  </button>)}
</nav>
