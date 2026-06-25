import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, error, ...props }, ref) => {
    const reactId = React.useId()
    const generatedId = id || reactId
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              id={generatedId}
              ref={ref}
              className={cn(
                'peer h-5 w-5 cursor-pointer appearance-none rounded-[var(--radius-sm)] border border-border bg-surface checked:bg-primary checked:border-primary focus-visible:outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-primary',
                error
                  ? 'border-error checked:bg-error checked:border-error focus-visible:ring-error'
                  : 'focus-visible:ring-ring',
                className,
              )}
              {...props}
            />
            <svg
              className="absolute h-3.5 w-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          {label && (
            <label
              htmlFor={generatedId}
              className={cn(
                'text-body cursor-pointer select-none text-text-primary',
                props.disabled && 'opacity-50 cursor-not-allowed',
              )}
            >
              {label}
            </label>
          )}
        </div>
        {error && <span className="text-body-sm text-error">{error}</span>}
      </div>
    )
  },
)
Checkbox.displayName = 'Checkbox'
