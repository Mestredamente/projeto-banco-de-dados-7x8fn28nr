import React, { forwardRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { aplicarMascara } from '@/lib/masks'
import { Eye, EyeOff } from 'lucide-react'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: string
  mask?: 'cpf' | 'cnpj' | 'cep' | 'phone' | 'crp' | 'currency' | 'date'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, error, mask, onChange, onFocus, onBlur, value, defaultValue, type, ...props },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState(defaultValue || value || '')
    const [isFocused, setIsFocused] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const isPassword = type === 'password'
    const actualType = isPassword && showPassword ? 'text' : type

    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(String(value))
      }
    }, [value])

    const getDisplayValue = () => {
      const valStr = String(value !== undefined ? value : internalValue)
      if (!mask) return valStr

      if (mask === 'currency') {
        const numStr = valStr.replace(/\D/g, '')
        if (!numStr) return ''
        if (isFocused) {
          return numStr
        } else {
          return aplicarMascara(numStr, 'currency')
        }
      }

      return aplicarMascara(valStr, mask)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value
      if (mask === 'currency') {
        val = val.replace(/\D/g, '')
      } else if (mask) {
        val = aplicarMascara(val, mask)
      }
      e.target.value = val
      setInternalValue(val)
      if (onChange) onChange(e)
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      if (onFocus) onFocus(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      if (onBlur) onBlur(e)
    }

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="relative w-full">
          <input
            ref={ref}
            type={actualType}
            value={getDisplayValue()}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              'flex h-11 w-full rounded-[var(--radius-md)] border bg-surface px-3 py-2 text-body text-text-primary ring-offset-background file:border-0 file:bg-transparent file:text-body file:font-medium placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 transition-all',
              isPassword ? 'pr-10' : '',
              error
                ? 'border-error focus-visible:ring-error'
                : 'border-border hover:border-text-secondary/50 focus-visible:ring-ring focus-visible:border-primary',
              className,
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
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
