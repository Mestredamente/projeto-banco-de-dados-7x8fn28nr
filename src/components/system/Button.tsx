import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  loading,
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-hover border border-transparent',
    secondary: 'bg-secondary text-white hover:bg-secondary-hover border border-transparent',
    ghost: 'bg-transparent text-text-primary hover:bg-muted border border-transparent',
    danger: 'bg-error text-white hover:bg-red-700 border border-transparent',
  }

  const sizeClasses = {
    sm: 'h-9 px-4 text-body-sm',
    md: 'h-11 px-6 text-body',
    lg: 'h-[52px] px-8 text-body-lg',
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none relative',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      <span className={cn('inline-flex items-center justify-center gap-2', loading && 'opacity-0')}>
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin" aria-label="Carregando" />
        </span>
      )}
    </button>
  )
}
