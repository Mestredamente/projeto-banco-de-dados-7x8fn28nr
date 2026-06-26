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

export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props} />
  ),
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  ),
)
CardTitle.displayName = 'CardTitle'

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-gray-500', className)} {...props} />
))
CardDescription.displayName = 'CardDescription'

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('', className)} {...props} />,
)
CardContent.displayName = 'CardContent'

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center pt-4', className)} {...props} />
  ),
)
CardFooter.displayName = 'CardFooter'
