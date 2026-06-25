import React, { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'flex h-11 w-full appearance-none rounded-[var(--radius-md)] border bg-surface px-3 py-2 pr-10 text-body text-text-primary ring-offset-background focus-visible:outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 transition-all',
              error
                ? 'border-error focus-visible:ring-error'
                : 'border-border hover:border-text-secondary/50 focus-visible:ring-ring focus-visible:border-primary',
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
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
Select.displayName = 'Select'
