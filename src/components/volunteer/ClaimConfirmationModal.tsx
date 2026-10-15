import React, { useState } from 'react'
import {
  X,
  HeartHandshake,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Users,
  Navigation,
} from 'lucide-react'
import { claimDonation, getCurrentVolunteer } from '../../services/donationService'
import type { Donation } from '../../types/donation'

interface ClaimConfirmationModalProps {
  donation: Donation
  onClose: () => void
  onClaimSuccess: (claimedDonationId: string) => void
  onRaceCondition: () => void
}

export const ClaimConfirmationModal: React.FC<ClaimConfirmationModalProps> = ({
  donation,
  onClose,
  onClaimSuccess,
  onRaceCondition,
}) => {
  const volunteer = getCurrentVolunteer()
  const [commitmentChecked, setCommitmentChecked] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const safeUntilDate = new Date(donation.earliestSafeUntil)
  const deadlineDate = new Date(donation.pickupSchedule.deadlineTime)

  const handleClaim = async () => {
    if (!commitmentChecked) {
      setErrorMessage('Please confirm your collection commitment before claiming.')
      return
    }

    setIsClaiming(true)
    setErrorMessage(null)

    try {
      const updated = await claimDonation(donation.id, volunteer)
      onClaimSuccess(updated.id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to claim donation.'
      if (msg.includes('no longer available') || msg.includes('already been claimed')) {
        onRaceCondition()
      } else {
        setErrorMessage(msg)
      }
    } finally {
      setIsClaiming(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-[#E6EAE7] shadow-2xl p-5 sm:p-6 max-w-lg w-full relative space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E6EAE7]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FFF0DB] border border-[#FFE0B2] text-[#9A3412] flex items-center justify-center">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-[#29352F]">
                Confirm Food Pickup Claim
              </h3>
              <p className="text-[11px] text-[#6B756F]">
                You are claiming this run as {volunteer.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error notice */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Donation Summary Card */}
        <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E6EAE7] space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B5E20] bg-[#E8F5E9] px-2 py-0.5 rounded-md border border-[#C8E6C9]">
                {donation.donorType === 'restaurant' ? 'Commercial Restaurant' : 'Food Donor Hub'}
              </span>
              <h4 className="font-heading font-bold text-sm text-[#29352F] mt-1">
                {donation.items[0]?.name || 'Surplus Food Donation'}
              </h4>
              <p className="text-xs text-[#6B756F]">
                {donation.totalQuantityLabel}
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="inline-flex items-center gap-1 text-xs font-bold text-[#29352F] bg-white px-2.5 py-1 rounded-lg border border-[#E6EAE7]">
                <Users className="w-3.5 h-3.5 text-[#1B5E20]" />
                ~{donation.estimatedPeopleServed} Serves
              </div>
            </div>
          </div>

          {/* Time & Freshness Deadlines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#E6EAE7] text-xs">
            <div className="flex items-center gap-2 text-[#29352F]">
              <Clock className="w-3.5 h-3.5 text-[#9A3412] shrink-0" />
              <span>
                Collect before:{' '}
                <strong>
                  {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2 text-[#29352F]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1B5E20] shrink-0" />
              <span>
                Safe until:{' '}
                <strong>
                  {safeUntilDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Privacy & Location Unlock Notice */}
        <div className="p-3.5 rounded-xl bg-[#EAF3FF] border border-[#BFDBFE] text-xs text-[#1E40AF] space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <Navigation className="w-3.5 h-3.5" />
            <span>Pickup Locality: {donation.collectionAddress.areaLocality}, {donation.collectionAddress.city}</span>
          </div>
          <p className="text-[11px] text-[#1E40AF]/90 leading-relaxed">
            Exact door address, landmark, directions, and the donor's contact phone number will unlock immediately after you confirm this claim.
          </p>
        </div>

        {/* Handover OTP Notice for Volunteer */}
        <div className="p-3.5 rounded-xl bg-[#FFF0DB]/70 border border-[#FFE0B2] text-xs text-[#9A3412]">
          <strong className="block font-bold mb-0.5">Physical Collection Protocol:</strong>
          <span>
            When you arrive at the donor's collection point, inspect the food containers and ask the donor for their <strong>6-digit Handover OTP</strong>. You will enter this OTP in the live tracker to confirm collection.
          </span>
        </div>

        {/* Volunteer Commitment Declaration */}
        <div className="pt-2">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={commitmentChecked}
              onChange={(e) => setCommitmentChecked(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-[#2E7D32] border-[#E6EAE7] focus:ring-[#2E7D32] cursor-pointer"
            />
            <span className="text-xs text-[#29352F] leading-relaxed select-none">
              <strong>I commit to collecting this surplus food run:</strong> I will arrive at the collection point before the deadline, transport the food safely using clean containers, and deliver it to people in need.
            </span>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E6EAE7]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#6B756F] hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isClaiming || !commitmentChecked}
            onClick={handleClaim}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#29352F] hover:bg-[#1B231F] disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            {isClaiming ? (
              <>
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Confirming Claim...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Claim & Start Pickup</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
