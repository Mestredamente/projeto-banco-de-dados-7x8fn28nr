import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, id, error, ...props }, ref) => {
    const reactId = React.useId()
    const generatedId = id || reactId
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <input
              type="radio"
              id={generatedId}
              ref={ref}
              className={cn(
                'peer h-5 w-5 cursor-pointer appearance-none rounded-full border border-border bg-surface checked:border-primary focus-visible:outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-primary',
                error
                  ? 'border-error checked:border-error focus-visible:ring-error'
                  : 'focus-visible:ring-ring',
                className,
              )}
              {...props}
            />
            <div
              className={cn(
                'absolute h-[10px] w-[10px] rounded-full bg-primary pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity scale-50 peer-checked:scale-100',
                error && 'bg-error',
              )}
            />
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
Radio.displayName = 'Radio'
