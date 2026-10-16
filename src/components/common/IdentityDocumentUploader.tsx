import React, { useRef, useState } from 'react'
import { UploadCloud, FileText, CheckCircle2, X, RefreshCw, AlertCircle, ShieldAlert } from 'lucide-react'
import type { IdentityDocumentType, UploadedDocument } from '../../types/registration'


interface IdentityDocumentUploaderProps {
  id?: string
  docType?: IdentityDocumentType
  onDocTypeChange?: (type: IdentityDocumentType) => void
  document: UploadedDocument | null
  onDocumentChange?: (doc: UploadedDocument | null) => void
  onDocumentUploaded?: (doc: UploadedDocument) => void
  onDocumentRemoved?: () => void
  error?: string
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp']

export const IdentityDocumentUploader: React.FC<IdentityDocumentUploaderProps> = ({
  id = 'identity-doc',
  docType = 'aadhaar',
  onDocTypeChange,
  document,
  onDocumentChange,
  onDocumentUploaded,
  onDocumentRemoved,
  error,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const validateAndUploadFile = (file: File) => {
    setLocalError(null)

    // Check size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setLocalError(`File size (${formatFileSize(file.size)}) exceeds the 5MB limit. Please choose a smaller file.`)
      return
    }

    // Check type
    const isExtensionAllowed = ALLOWED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))
    const isMimeAllowed = ALLOWED_MIME_TYPES.includes(file.type)

    if (!isExtensionAllowed && !isMimeAllowed) {
      setLocalError('Invalid file format. Please upload a PDF, JPG, PNG, or WebP document.')
      return
    }

    // Begin upload simulation to private storage bucket (simulating secure Cloudflare R2 presigned PUT)
    setIsUploading(true)
    setUploadProgress(10)

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          // Finalize upload
          setTimeout(() => {
            setIsUploading(false)
            setUploadProgress(100)
            const uploadedDoc: UploadedDocument = {
              file,
              name: file.name,
              size: file.size,
              type: file.type || 'application/octet-stream',
              uploadedAt: new Date().toISOString(),
              uploadProgress: 100,
              status: 'completed',
              privateReferenceId: `doc_r2_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            }
            onDocumentChange?.(uploadedDoc)
            onDocumentUploaded?.(uploadedDoc)
          }, 300)
          return 90
        }
        return prev + 25
      })
    }, 150)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndUploadFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      validateAndUploadFile(file)
    }
  }

  const handleRemove = () => {
    onDocumentChange?.(null)
    onDocumentRemoved?.()
    setLocalError(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Document Type Selector */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-type`} className="text-sm font-semibold text-[#29352F]">
          Identity Proof Type
        </label>
        <select
          id={`${id}-type`}
          value={docType}
          onChange={(e) => onDocTypeChange?.(e.target.value as IdentityDocumentType)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm font-medium text-[#29352F] focus:outline-none focus:border-[#29352F] focus:ring-2 focus:ring-[#29352F]/10 cursor-pointer"
        >
          <option value="aadhaar">Aadhaar Card</option>
          <option value="pan">PAN Card</option>
            <option value="other_gov_id">Voter ID or another government-issued ID</option>
        </select>
      </div>

      {/* Upload Box */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-[#29352F]">
            Upload Identity Proof
          </label>
          <span className="text-xs text-[#6B756F]">PDF, JPG, PNG (Max 5MB)</span>
        </div>
        <p className="text-xs text-[#6B756F]">
          Aadhaar Card, PAN Card, Voter ID, or another government-issued identity document.
        </p>

        <input
          ref={fileInputRef}
          id={id}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={handleFileSelect}
          className="sr-only"
          aria-describedby={`${id}-notes`}
        />

        {/* State 1: Uploading progress */}
        {isUploading && (
          <div className="p-4 rounded-xl border border-[#E6EAE7] bg-[#FAFAFA] flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs font-medium text-[#29352F]">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#1B5E20]" />
                Encrypting & uploading document...
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#E6EAE7] overflow-hidden">
              <div 
                className="h-full bg-[#2E7D32] transition-all duration-200" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* State 2: Document successfully uploaded */}
        {!isUploading && document && (
          <div className="p-4 rounded-xl border border-[#C8E6C9] bg-[#E8F5E9]/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-white border border-[#C8E6C9] flex items-center justify-center shrink-0 text-[#1B5E20]">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#29352F] truncate">
                  {document.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-[#6B756F] mt-0.5">
                  <span>{formatFileSize(document.size)}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-[#1B5E20] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Uploaded securely
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Replace document"
                className="p-1.5 rounded-lg text-xs font-medium text-[#29352F] hover:bg-white border border-transparent hover:border-[#C8E6C9] transition-colors cursor-pointer"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                title="Remove document"
                className="p-1.5 rounded-lg text-[#6B756F] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* State 3: Empty upload dropzone */}
        {!isUploading && !document && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-[#2E7D32] bg-[#E8F5E9]/40'
                : 'border-[#E6EAE7] hover:border-[#6B756F]/60 bg-[#FAFAFA]'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-white border border-[#E6EAE7] flex items-center justify-center mx-auto text-[#6B756F] mb-2.5">
              <UploadCloud className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-[#29352F]">
              Click to upload or drag & drop document
            </p>
            <p className="text-xs text-[#6B756F] mt-1">
              Supported files: PDF, JPEG, PNG (maximum file size 5MB)
            </p>
          </div>
        )}

        {/* Error Feedback */}
        {(localError || error) && (
          <div role="alert" className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}

        {/* Verification and Privacy Notice */}
        <div id={`${id}-notes`} className="mt-1 p-3 rounded-lg bg-[#EAF3FF] border border-[#BFDBFE] text-xs text-[#1E40AF] flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">Privacy & Verification Notice:</span> Documents are stored in an encrypted private vault and reviewed solely by verified compliance officers. Uploading does not imply immediate identity approval; manual verification is required before privileged network tasks. Documents are never made public.
          </div>
        </div>
      </div>
    </div>
  )
}
