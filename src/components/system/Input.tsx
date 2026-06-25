import React, { forwardRef, useState, useEffect } from 'react'
import { cn, maskCPF, maskPhone } from '@/lib/utils'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: string
  mask?: 'cpf' | 'cnpj' | 'cep' | 'phone' | 'date'
}

function applyMask(value: string, mask?: string) {
  if (!value) return ''
  switch (mask) {
    case 'cpf':
      return maskCPF(value)
    case 'cnpj': {
      const v = value.replace(/\D/g, '')
      return v
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})/, '$1-$2')
        .slice(0, 18)
    }
    case 'cep': {
      const v = value.replace(/\D/g, '')
      return v.replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9)
    }
    case 'phone':
      return maskPhone(value)
    case 'date': {
      const v = value.replace(/\D/g, '')
      return v
        .replace(/(\d{2})(\d)/, '$1/$2')
        .replace(/(\d{2})\/(\d{2})(\d)/, '$1/$2/$3')
        .slice(0, 10)
    }
    default:
      return value
  }
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, mask, onChange, value, defaultValue, ...props }, ref) => {
    const [internalValue, setInternalValue] = useState(defaultValue || value || '')

    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(mask ? applyMask(String(value), mask) : String(value))
      }
    }, [value, mask])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value
      if (mask) {
        val = applyMask(val, mask)
        e.target.value = val
      }
      setInternalValue(val)
      if (onChange) onChange(e)
    }

    const isControlled = value !== undefined

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <input
          ref={ref}
          value={isControlled ? (mask ? applyMask(String(value), mask) : value) : internalValue}
          onChange={handleChange}
          className={cn(
            'flex h-11 w-full rounded-[var(--radius-md)] border bg-surface px-3 py-2 text-body text-text-primary ring-offset-background file:border-0 file:bg-transparent file:text-body file:font-medium placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 transition-all',
            error
              ? 'border-error focus-visible:ring-error'
              : 'border-border hover:border-text-secondary/50 focus-visible:ring-ring focus-visible:border-primary',
            className,
          )}
          {...props}
        />
        {error && (
          <span className="text-body-sm text-error animate-fade-in" role="alert">
            {error}
          </span>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'
