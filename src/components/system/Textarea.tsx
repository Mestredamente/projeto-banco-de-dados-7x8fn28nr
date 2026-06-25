import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <textarea
          ref={ref}
          className={cn(
            'flex min-h-[80px] w-full rounded-[var(--radius-md)] border bg-surface px-3 py-2 text-body text-text-primary ring-offset-background placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 transition-all',
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
Textarea.displayName = 'Textarea'
