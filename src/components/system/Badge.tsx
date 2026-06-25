import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
}

export function Badge({ variant = 'neutral', className, children, ...props }: BadgeProps) {
  const colorVar = variant === 'neutral' ? '--color-text-secondary' : `--color-${variant}`

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-[var(--radius-full)] px-2.5 py-1 text-caption font-medium border border-transparent',
        variant === 'neutral' ? 'text-text-secondary' : `text-${variant}`,
        className,
      )}
      style={{
        backgroundColor: `color-mix(in srgb, var(${colorVar}) 10%, transparent)`,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export const Tag = Badge
