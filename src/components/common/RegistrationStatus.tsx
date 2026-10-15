import React from 'react'
import { CheckCircle2, Clock, ShieldCheck, ArrowRight, MapPin, UserCheck } from 'lucide-react'
import type { RegistrationRecord } from '../../types/registration'
import { useNavigation } from '../../context/useNavigation'



interface RegistrationStatusProps {
  record: RegistrationRecord
}

export const RegistrationStatus: React.FC<RegistrationStatusProps> = ({ record }) => {
  const { navigate } = useNavigation()

  const destinationRoute = record.role === 'volunteer' ? '/volunteer/dashboard' : '/donor/dashboard'
  const destinationLabel = record.role === 'volunteer' ? 'Go to Volunteer Portal' : 'Go to Donor Portal'

  const maskPhone = (code: string, num: string) => {
    if (num.length <= 4) return `${code} ${num}`
    return `${code} ******${num.slice(-4)}`
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Success Hero Header */}
      <div className="text-center pb-4 border-b border-[#E6EAE7]">
        <div className="w-14 h-14 rounded-full bg-[#E8F5E9] border-2 border-[#C8E6C9] text-[#1B5E20] flex items-center justify-center mx-auto mb-3 shadow-2xs">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h2 className="font-heading text-xl font-bold text-[#29352F]">
          Registration Details Received
        </h2>
        <p className="text-xs sm:text-sm text-[#6B756F] mt-1 max-w-md mx-auto">
          {record.phoneVerified
            ? 'Thank you for stepping forward to share surplus food. Your phone number has been verified.'
            : 'Thank you for stepping forward to share surplus food. Phone verification skipped in demo mode.'}
        </p>
      </div>

      {/* Demo Mode Notice if phone is unverified */}
      {!record.phoneVerified && (
        <div className="p-3.5 rounded-xl bg-[#FFF0DB]/80 border border-[#FFE0B2] text-xs text-[#9A3412] flex items-start gap-2.5">
          <Clock className="w-4 h-4 shrink-0 mt-0.5 text-[#C25E00]" />
          <div className="leading-relaxed">
            <span className="font-bold block">Hackathon Demo Mode Active:</span>
            <span>
              Phone SMS OTP verification was temporarily bypassed for this demonstration. The phone number remains recorded as unverified pending production verification.
            </span>
          </div>
        </div>
      )}

      {/* Honest Multi-State Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* State 1: Phone Verification */}
        {record.phoneVerified ? (
          <div className="p-3.5 rounded-xl border border-[#C8E6C9] bg-[#E8F5E9]/50 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#C8E6C9] flex items-center justify-center text-[#1B5E20] shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#29352F]">Phone Verification</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#2E7D32] text-white">
                  Verified
                </span>
              </div>
              <p className="text-[11px] text-[#6B756F] mt-0.5">
                Confirmed via OTP challenge: {maskPhone(record.countryCode, record.phoneNumber)}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl border border-[#BFDBFE] bg-[#EAF3FF]/60 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#BFDBFE] flex items-center justify-center text-[#1E40AF] shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#29352F]">Phone Verification</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#1E40AF] text-white">
                  Skipped (Demo Mode)
                </span>
              </div>
              <p className="text-[11px] text-[#475569] mt-0.5">
                Verification bypassed for demonstration: {maskPhone(record.countryCode, record.phoneNumber)} (Unverified)
              </p>
            </div>
          </div>
        )}

        {/* State 2: Document / Profile Status */}
        {record.documentType ? (
          <div className="p-3.5 rounded-xl border border-[#FFE0B2] bg-[#FFF0DB]/50 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#FFE0B2] flex items-center justify-center text-[#9A3412] shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#29352F]">Identity Document</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#C25E00] text-white">
                  Pending Review
                </span>
              </div>
              <p className="text-[11px] text-[#6B756F] mt-0.5">
                Uploaded ({record.documentType.toUpperCase()}). Verification team review in progress (24–48h).
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl border border-[#C8E6C9] bg-[#E8F5E9]/50 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#C8E6C9] flex items-center justify-center text-[#1B5E20] shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#29352F]">Volunteer Profile</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#2E7D32] text-white">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-[#6B756F] mt-0.5">
                Community volunteer registered. Ready to view and claim nearby surplus food pickups.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Access Restriction Disclaimer */}
      <div className="p-3.5 rounded-xl bg-[#EAF3FF] border border-[#BFDBFE] text-xs text-[#1E40AF]">
        <p className="font-semibold flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 shrink-0" />
          Onboarding Policy & Access Controls:
        </p>
        <p className="mt-1 text-[#1E40AF]/90 leading-relaxed">
          {record.role === 'volunteer'
            ? 'Privileged volunteering privileges (including accessing direct contact details of surplus food listings and claiming physical pickup runs) are granted once identity document review is completed.'
            : 'Your food collection point is registered securely. Volunteer pickup scheduling will be activated once your identity record passes standard verification.'}
        </p>
      </div>

      {/* Record Summary Table */}
      <div className="rounded-xl border border-[#E6EAE7] overflow-hidden text-xs">
        <div className="bg-[#FAFAFA] px-4 py-2.5 font-bold text-[#29352F] border-b border-[#E6EAE7]">
          Submission Summary
        </div>
        <div className="p-4 space-y-2.5 divide-y divide-[#E6EAE7]/60">
          <div className="flex justify-between items-center pt-2 first:pt-0">
            <span className="text-[#6B756F]">Applicant Name:</span>
            <span className="font-semibold text-[#29352F]">{record.fullName}</span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-[#6B756F]">Registered Role:</span>
            <span className="font-semibold text-[#29352F] capitalize">
              {record.role === 'volunteer' 
                ? (record.details.volunteerRole === 'ngo_member' ? `NGO Member (${record.details.ngoName})` : 'Individual Volunteer')
                : `Donor (${record.details.foodSourceType})`}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-[#6B756F]">Contact Phone:</span>
            <span className="font-semibold text-[#29352F] flex items-center gap-1.5">
              <span>{maskPhone(record.countryCode, record.phoneNumber)}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  record.phoneVerified
                    ? 'bg-[#E8F5E9] text-[#1B5E20]'
                    : 'bg-[#EAF3FF] text-[#1E40AF]'
                }`}
              >
                {record.phoneVerified ? 'Verified' : 'Pending Verification (Demo)'}
              </span>
            </span>
          </div>

          {record.details.collectionAddress && (
            <div className="pt-2">
              <span className="text-[#6B756F] block mb-1">Collection Location:</span>
              <div className="flex items-start gap-1.5 font-medium text-[#29352F] bg-[#FAFAFA] p-2.5 rounded-lg border border-[#E6EAE7]">
                <MapPin className="w-4 h-4 text-[#C25E00] shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <div>{record.details.collectionAddress.addressLine1}, {record.details.collectionAddress.areaLocality}</div>
                  <div className="text-[11px] text-[#6B756F]">
                    {record.details.collectionAddress.city}, {record.details.collectionAddress.state} - {record.details.collectionAddress.pincode}
                  </div>
                  {record.details.collectionAddress.latitude && (
                    <div className="text-[10px] text-[#1B5E20] mt-0.5 font-mono">
                      GPS: {record.details.collectionAddress.latitude.toFixed(4)}, {record.details.collectionAddress.longitude?.toFixed(4)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <span className="text-[#6B756F]">Private Reference Ref:</span>
            <span className="font-mono text-[11px] text-[#6B756F]">{record.documentReference}</span>
          </div>
        </div>
      </div>

      {/* Button to proceed to dashboard placeholder */}
      <button
        type="button"
        onClick={() => navigate(destinationRoute)}
        className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#29352F] hover:bg-[#1B231F] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
      >
        <span>{destinationLabel}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}
