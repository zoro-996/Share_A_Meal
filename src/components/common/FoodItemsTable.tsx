import React from 'react'
import type { FoodItem } from '../../types/donation'
import { Clock, Utensils } from 'lucide-react'

interface FoodItemsTableProps {
  items: FoodItem[]
  fallbackPhoto?: string
  defaultSafeUntil?: string
  className?: string
}

export const FoodItemsTable: React.FC<FoodItemsTableProps> = ({
  items,
  fallbackPhoto,
  defaultSafeUntil,
  className = '',
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
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
        ', ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    } catch {
      return 'Not provided'
    }
  }

  return (
    <div className={`w-full overflow-hidden rounded-xl border border-[#E6EAE7] bg-white ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#FAFAFA] border-b border-[#E6EAE7] text-[#6B756F] font-bold uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-3 w-14">Photo</th>
              <th className="py-2.5 px-3">Food Item</th>
              <th className="py-2.5 px-3 text-right">Quantity</th>
              <th className="py-2.5 px-3">Unit</th>
              <th className="py-2.5 px-3">Freshness / Expiry</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6EAE7]">
            {items.map((item, idx) => {
              const photo = item.photo || fallbackPhoto
              const safeUntilText = formatSafeUntil(item.safeUntil)

              return (
                <tr key={item.id || idx} className="hover:bg-neutral-50/70 transition-colors">
                  {/* Column 1: Food Photo */}
                  <td className="py-2 px-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#E6EAE7] bg-[#FAFAFA] shrink-0 flex items-center justify-center">
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

                  {/* Column 2: Food Item Name & Dietary Badge */}
                  <td className="py-2 px-3">
                    <div className="font-bold text-[#29352F] flex items-center gap-1.5 flex-wrap">
                      <span>{item.name}</span>
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
                    </div>
                  </td>

                  {/* Column 3: Quantity */}
                  <td className="py-2 px-3 text-right font-mono font-bold text-[#29352F]">
                    {item.quantity}
                  </td>

                  {/* Column 4: Unit */}
                  <td className="py-2 px-3 font-medium text-[#6B756F] capitalize">
                    {item.unit}
                  </td>

                  {/* Column 5: Freshness / Expiry */}
                  <td className="py-2 px-3">
                    <div className="inline-flex items-center gap-1 text-[#29352F] font-medium whitespace-nowrap">
                      <Clock className="w-3 h-3 text-[#1B5E20] shrink-0" />
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
