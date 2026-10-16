import React from 'react'
import type { FoodItem } from '../../types/donation'
import { Clock, Utensils } from 'lucide-react'

interface FoodItemsTableProps {
  items: FoodItem[]
  fallbackPhoto?: string
  defaultSafeUntil?: string
  className?: string
  hideDietaryLabels?: boolean
}

export const FoodItemsTable: React.FC<FoodItemsTableProps> = ({
  items,
  fallbackPhoto,
  defaultSafeUntil,
  className = '',
  hideDietaryLabels = true,
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="py-3 px-4 text-xs text-[#6B756F] italic bg-[#FAFAFA] rounded-xl border border-[#E6EAE7]">
        No food items specified.
      </div>
    )
  }

  const formatSafeUntil = (safeUntil?: string) => {
    const raw = safeUntil || defaultSafeUntil
    if (!raw) return 'Not provided'
    try {
      const d = new Date(raw)
      if (isNaN(d.getTime())) return 'Not provided'
      return (
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        ', ' +
        d.toLocaleDateString([], { month: 'short', day: 'numeric' })
      )
    } catch {
      return 'Not provided'
    }
  }

  return (
    <div className={`w-full overflow-hidden rounded-xl border border-[#E6EAE7] bg-white ${className}`}>
      <div className="divide-y divide-[#E6EAE7] lg:hidden">
        {items.map((item, idx) => {
          const photo = item.photo || fallbackPhoto
          return <div key={item.id || idx} className="flex items-center gap-3 p-3.5 text-sm">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#E6EAE7] bg-[#FAFAFA]">
              {photo ? <img src={photo} alt={item.name} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center"><Utensils className="w-4 h-4 text-[#6B756F]" /></div>}
            </div>
            <div className="min-w-0 flex-1"><p className="font-bold text-[#29352F] break-words">{item.name}</p><p className="mt-0.5 inline-flex items-center gap-1 text-xs text-[#6B756F]"><Clock className="w-3 h-3 text-[#1B5E20]" />{formatSafeUntil(item.safeUntil)}</p></div>
            <div className="shrink-0 text-right"><p className="font-bold text-[#29352F]">{item.quantity}</p><p className="text-xs capitalize text-[#6B756F]">{item.unit}</p></div>
          </div>
        })}
      </div>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#FAFAFA] border-b border-[#E6EAE7] text-[#6B756F] font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 w-16">Photo</th>
              <th className="py-3 px-4">Food Item</th>
              <th className="py-3 px-4 text-right">Quantity</th>
              <th className="py-3 px-4">Unit</th>
              <th className="py-3 px-4">Food Safety Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6EAE7]">
            {items.map((item, idx) => {
              const photo = item.photo || fallbackPhoto
              const safeUntilText = formatSafeUntil(item.safeUntil)

              return (
                <tr key={item.id || idx} className="hover:bg-neutral-50/70 transition-colors">
                  {/* Column 1: Food Photo */}
                  <td className="px-4 py-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E6EAE7] bg-[#FAFAFA]">
                      {photo ? (
                        <img
                          src={photo}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <Utensils className="w-4 h-4 text-[#6B756F]" />
                      )}
                    </div>
                  </td>

                  {/* Column 2: Food Item Name */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5 text-base font-bold leading-6 text-[#29352F]">
                      <span>{item.name}</span>
                      {!hideDietaryLabels && item.foodType && (
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm border ${
                            item.foodType === 'veg'
                              ? 'bg-[#E8F5E9] text-[#1B5E20] border-[#C8E6C9]'
                              : item.foodType === 'vegan'
                              ? 'bg-[#EAF3FF] text-[#1E40AF] border-[#BFDBFE]'
                              : 'bg-[#FFF0DB] text-[#9A3412] border-[#FFE0B2]'
                          }`}
                        >
                          {item.foodType === 'veg' ? 'Veg' : item.foodType === 'vegan' ? 'Vegan' : 'Non-Veg'}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Column 3: Quantity */}
                  <td className="px-4 py-3 text-center font-mono text-base font-bold text-[#29352F]">
                    {item.quantity}
                  </td>

                  {/* Column 4: Unit */}
                  <td className="px-4 py-3 text-sm font-medium text-[#536058] capitalize">
                    {item.unit}
                  </td>

                  {/* Column 5: Food Safety Time */}
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-[#29352F]">
                      <Clock className="h-4 w-4 shrink-0 text-[#1B5E20]" />
                      <span>{safeUntilText}</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
