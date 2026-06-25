import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'clickable' | 'highlight'
  highlightColor?: string
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { className, variant = 'default', highlightColor = 'var(--color-primary)', children, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[var(--radius-lg)] bg-surface text-text-primary border border-border p-[var(--spacing-lg)] shadow-sm',
          variant === 'clickable' &&
            'cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50',
          variant === 'highlight' && 'border-l-[4px]',
          className,
        )}
        style={variant === 'highlight' ? { borderLeftColor: highlightColor } : undefined}
        {...props}
      >
        {children}
      </div>
    )
  },
)
Card.displayName = 'Card'
