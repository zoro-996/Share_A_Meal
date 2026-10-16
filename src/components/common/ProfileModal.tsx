import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  User,
  Phone,
  MapPin,
  Building2,
  ShieldCheck,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Save,
  Clock,
} from 'lucide-react'
import {
  getCurrentDonor,
  updateDonorProfile,
  fetchDonorProfile,
  getCurrentVolunteer,
  updateVolunteerProfile,
  fetchVolunteerProfile,
  type DonorUserProfile,
  type VolunteerUserProfile,
} from '../../services/donationService'
import type { FoodSourceType } from '../../types/registration'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  role: 'donor' | 'volunteer'
  onProfileUpdated?: () => void
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  role,
  onProfileUpdated,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Donor form state
  const [donorData, setDonorData] = useState<DonorUserProfile>(getCurrentDonor())

  // Volunteer form state
  const [volunteerData, setVolunteerData] = useState<VolunteerUserProfile>(getCurrentVolunteer())

  // Lock body scroll when modal is open to prevent background scrolling & freezing
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    dialogRef.current?.focus()
  }, [isOpen])

  // Fetch latest profile from backend on open
  useEffect(() => {
    if (isOpen) {
      setIsEditing(false)
      setSaveSuccess(false)
      setErrorMessage(null)

      if (role === 'donor') {
        fetchDonorProfile().then((data) => setDonorData(data))
      } else {
        fetchVolunteerProfile().then((data) => setVolunteerData(data))
      }
    }
  }, [isOpen, role])

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setErrorMessage(null)

    try {
      if (role === 'donor') {
        if (!donorData.name.trim()) {
          throw new Error('Full Name is required.')
        }
        if (!donorData.collectionAddress.addressLine1.trim() || !donorData.collectionAddress.areaLocality.trim()) {
          throw new Error('Address Line 1 and Area / Locality are required.')
        }
        const updated = await updateDonorProfile(donorData)
        setDonorData(updated)
      } else {
        if (!volunteerData.name.trim()) {
          throw new Error('Full Name is required.')
        }
        const updated = await updateVolunteerProfile(volunteerData)
        setVolunteerData(updated)
      }

      setSaveSuccess(true)
      setIsEditing(false)
      if (onProfileUpdated) onProfileUpdated()

      // Automatically close the modal after brief confirmation
      setTimeout(() => {
        setSaveSuccess(false)
        onClose()
      }, 1500)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update profile.')
    } finally {
      setIsSaving(false)
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-[100] overflow-y-auto bg-neutral-900/40 p-4 sm:p-6 backdrop-blur-2xs animate-in fade-in duration-150"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="mx-auto flex min-h-full w-full max-w-xl items-center outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-[#E6EAE7] bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6EAE7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF3FF] border border-[#BFDBFE] text-[#1E40AF] font-bold flex items-center justify-center text-sm shadow-2xs">
              {role === 'donor'
                ? donorData.name.charAt(0).toUpperCase()
                : volunteerData.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 id="profile-modal-title" className="font-heading font-extrabold text-base text-[#29352F]">
                {role === 'donor' ? 'Food Donor Profile' : 'Volunteer Profile'}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#1B5E20] bg-[#E8F5E9] px-2 py-0.5 rounded-md border border-[#C8E6C9]">
                  <ShieldCheck className="w-3 h-3" />
                  Active Registered Profile
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
            aria-label="Close profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 pt-5">
        {saveSuccess && (
          <div className="p-3 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] text-xs text-[#1B5E20] font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Profile details updated and synchronized successfully!</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* VIEW MODE */}
        {!isEditing ? (
          <div className="space-y-4 text-xs">
            {/* Basic Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E6EAE7]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B756F]">Full Name</span>
                <p className="font-bold text-sm text-[#29352F] mt-1 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#1B5E20]" />
                  {role === 'donor' ? donorData.name : volunteerData.name}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E6EAE7]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B756F]">Registered Phone</span>
                <p className="font-bold text-sm text-[#29352F] mt-1 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-[#C25E00]" />
                  {role === 'donor' ? donorData.phone : volunteerData.phone}
                </p>
              </div>
            </div>

            {/* Role-Specific Details */}
            {role === 'donor' ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E6EAE7]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B756F]">Food Source Category</span>
                  <p className="font-bold text-xs text-[#29352F] mt-1 capitalize flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#1E40AF]" />
                    {donorData.donorType.replace('_', ' ')}
                  </p>
                </div>

                {/* Saved Collection Address */}
                <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E6EAE7] space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B756F] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#1B5E20]" />
                    Saved Default Collection Address
                  </span>

                  <div className="text-xs text-[#29352F] font-medium leading-relaxed">
                    <p className="font-bold">{donorData.collectionAddress.addressLine1}</p>
                    {donorData.collectionAddress.addressLine2 && (
                      <p className="text-[#6B756F]">{donorData.collectionAddress.addressLine2}</p>
                    )}
                    <p>
                      {donorData.collectionAddress.areaLocality}, {donorData.collectionAddress.city},{' '}
                      {donorData.collectionAddress.state} - {donorData.collectionAddress.pincode}
                    </p>
                    {donorData.collectionAddress.landmark && (
                      <p className="text-[11px] text-[#6B756F] mt-1">
                        <strong>Landmark:</strong> {donorData.collectionAddress.landmark}
                      </p>
                    )}
                    {donorData.collectionAddress.additionalDirections && (
                      <p className="text-[11px] text-[#6B756F]">
                        <strong>Instructions:</strong> {donorData.collectionAddress.additionalDirections}
                      </p>
                    )}
                  </div>

                  {donorData.collectionAddress.latitude && (
                    <div className="pt-2 border-t border-[#E6EAE7] text-[10px] font-mono text-[#6B756F]">
                      GPS Coordinates: {donorData.collectionAddress.latitude.toFixed(4)},{' '}
                      {donorData.collectionAddress.longitude?.toFixed(4)}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E6EAE7]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B756F]">Affiliation</span>
                  <p className="font-bold text-xs text-[#29352F] mt-1 capitalize">
                    {volunteerData.role === 'ngo_member'
                      ? `NGO Member • ${volunteerData.ngoName || 'Partner Charity'}`
                      : 'Independent Community Volunteer'}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-[#E6EAE7] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B756F] hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-[#29352F] hover:bg-[#1B231F] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile Information</span>
              </button>
            </div>
          </div>
        ) : (
          /* EDIT MODE */
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-[#29352F] mb-1">Full Name</label>
              <input
                type="text"
                value={role === 'donor' ? donorData.name : volunteerData.name}
                onChange={(e) => {
                  if (role === 'donor') {
                    setDonorData((prev) => ({ ...prev, name: e.target.value }))
                  } else {
                    setVolunteerData((prev) => ({ ...prev, name: e.target.value }))
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6EAE7] bg-white text-[#29352F] focus:outline-none focus:border-[#29352F]"
                required
              />
            </div>

            {/* Phone Number - Locked with clear informative text */}
            <div>
              <label className="block text-xs font-semibold text-[#29352F] mb-1">
                Registered Mobile Phone Number
              </label>
              <input
                type="tel"
                value={role === 'donor' ? donorData.phone : volunteerData.phone}
                disabled
                readOnly
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6EAE7] bg-neutral-100 text-[#6B756F] cursor-not-allowed select-none"
              />
              <p className="text-[11px] text-[#6B756F] mt-1.5 flex items-center gap-1.5 leading-snug">
                <AlertCircle className="w-3.5 h-3.5 text-[#C25E00] shrink-0" />
                <span>
                  Phone number is locked for security and cannot be modified without re-authenticating with OTP verification.
                </span>
              </p>
            </div>

            {/* Donor Fields */}
            {role === 'donor' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#29352F] mb-1">Food Source Type</label>
                  <select
                    value={donorData.donorType}
                    onChange={(e) =>
                      setDonorData((prev) => ({ ...prev, donorType: e.target.value as FoodSourceType }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6EAE7] bg-white text-[#29352F] focus:outline-none focus:border-[#29352F]"
                  >
                    <option value="restaurant">Restaurant / Eatery</option>
                    <option value="home">Household / Individual</option>
                    <option value="function_event">Function / Event Catering</option>
                    <option value="other">Other Food Facility</option>
                  </select>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#E6EAE7]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B756F]">Saved Collection Address</span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-[#6B756F] mb-1">Address Line 1</label>
                      <input
                        type="text"
                        value={donorData.collectionAddress.addressLine1}
                        onChange={(e) =>
                          setDonorData((prev) => ({
                            ...prev,
                            collectionAddress: { ...prev.collectionAddress, addressLine1: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6EAE7] bg-white text-[#29352F] focus:outline-none focus:border-[#29352F]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6B756F] mb-1">Address Line 2 (Optional)</label>
                      <input
                        type="text"
                        value={donorData.collectionAddress.addressLine2 || ''}
                        onChange={(e) =>
                          setDonorData((prev) => ({
                            ...prev,
                            collectionAddress: { ...prev.collectionAddress, addressLine2: e.target.value },
                          }))
                        }
                        placeholder="Floor, Suite, Wing"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6EAE7] bg-white text-[#29352F] focus:outline-none focus:border-[#29352F]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-[#6B756F] mb-1">Area / Locality</label>
                      <input
                        type="text"
                        value={donorData.collectionAddress.areaLocality}
                        onChange={(e) =>
                          setDonorData((prev) => ({
                            ...prev,
                            collectionAddress: { ...prev.collectionAddress, areaLocality: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6EAE7] bg-white text-[#29352F] focus:outline-none focus:border-[#29352F]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6B756F] mb-1">Landmark</label>
                      <input
                        type="text"
                        value={donorData.collectionAddress.landmark || ''}
                        onChange={(e) =>
                          setDonorData((prev) => ({
                            ...prev,
                            collectionAddress: { ...prev.collectionAddress, landmark: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6EAE7] bg-white text-[#29352F] focus:outline-none focus:border-[#29352F]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] text-[#6B756F] mb-1">City</label>
                      <input
                        type="text"
                        value={donorData.collectionAddress.city}
                        onChange={(e) =>
                          setDonorData((prev) => ({
                            ...prev,
                            collectionAddress: { ...prev.collectionAddress, city: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6EAE7] bg-white text-[#29352F] focus:outline-none focus:border-[#29352F]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6B756F] mb-1">State</label>
                      <input
                        type="text"
                        value={donorData.collectionAddress.state}
                        onChange={(e) =>
                          setDonorData((prev) => ({
                            ...prev,
                            collectionAddress: { ...prev.collectionAddress, state: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6EAE7] bg-white text-[#29352F] focus:outline-none focus:border-[#29352F]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6B756F] mb-1">PIN Code</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={donorData.collectionAddress.pincode}
                        onChange={(e) =>
                          setDonorData((prev) => ({
                            ...prev,
                            collectionAddress: { ...prev.collectionAddress, pincode: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6EAE7] bg-white text-[#29352F] focus:outline-none focus:border-[#29352F]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#6B756F] mb-1">Additional Pickup Directions (Optional)</label>
                    <input
                      type="text"
                      value={donorData.collectionAddress.additionalDirections || ''}
                      onChange={(e) =>
                        setDonorData((prev) => ({
                          ...prev,
                          collectionAddress: { ...prev.collectionAddress, additionalDirections: e.target.value },
                        }))
                      }
                      placeholder="e.g. Kitchen dispatch counter on Ground Floor rear."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6EAE7] bg-white text-[#29352F] focus:outline-none focus:border-[#29352F]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Volunteer Fields */}
            {role === 'volunteer' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#29352F] mb-1">Role Type</label>
                  <select
                    value={volunteerData.role}
                    onChange={(e) =>
                      setVolunteerData((prev) => ({
                        ...prev,
                        role: e.target.value as 'individual' | 'ngo_member',
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6EAE7] bg-white text-[#29352F] focus:outline-none focus:border-[#29352F]"
                  >
                    <option value="individual">Individual Community Volunteer</option>
                    <option value="ngo_member">NGO / Non-Profit Member</option>
                  </select>
                </div>

                {volunteerData.role === 'ngo_member' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#29352F] mb-1">NGO / Organization Name</label>
                    <input
                      type="text"
                      value={volunteerData.ngoName || ''}
                      onChange={(e) => setVolunteerData((prev) => ({ ...prev, ngoName: e.target.value }))}
                      placeholder="e.g. Robin Hood Army, Feeding India"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6EAE7] bg-white text-[#29352F] focus:outline-none focus:border-[#29352F]"
                    />
                  </div>
                )}
              </>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E6EAE7]">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#6B756F] hover:bg-neutral-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#29352F] hover:bg-[#1B231F] disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {isSaving ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        )}
        </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
