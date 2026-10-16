import React from 'react'
import { AlertCircle } from 'lucide-react'

interface FormFieldProps {
  id?: string
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
  className?: string
}

export const FormField: React.FC<FormFieldProps> = ({
  id = 'form-field',
  label,
  required,
  hint,
  error,
  children,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-[#29352F]">
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
        {required ? (
          <span className="text-[11px] font-medium text-[#6B756F]">Required</span>
        ) : (
          <span className="text-[11px] font-medium text-[#6B756F]">Optional</span>
        )}
      </div>

      {hint && (
        <p id={`${id}-hint`} className="text-xs text-[#6B756F]">
          {hint}
        </p>
      )}

      {children}

      {error && (
        <div 
          id={`${id}-error`} 
          role="alert" 
          className="flex items-center gap-1.5 text-xs text-red-600 mt-0.5 font-medium"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
