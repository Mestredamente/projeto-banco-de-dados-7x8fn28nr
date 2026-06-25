import React from 'react'
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'error' | 'warning' | 'info'
  title?: string
}

export function Alert({ variant = 'info', title, className, children, ...props }: AlertProps) {
  const textColor = {
    success: 'text-success',
    error: 'text-error',
    warning: 'text-warning',
    info: 'text-info',
  }

  const icons = {
    success: <CheckCircle2 className="h-5 w-5" />,
    error: <AlertCircle className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
  }

  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-[var(--radius-md)] border p-4 flex gap-3',
        textColor[variant],
        className,
      )}
      style={{
        backgroundColor: `color-mix(in srgb, var(--color-${variant}) 8%, transparent)`,
        borderColor: `color-mix(in srgb, var(--color-${variant}) 20%, transparent)`,
      }}
      {...props}
    >
      <div className="shrink-0 mt-0.5">{icons[variant]}</div>
      <div className="flex flex-col gap-1">
        {title && <h5 className="font-medium leading-none text-text-primary">{title}</h5>}
        <div className="text-body-sm text-text-primary/90">{children}</div>
      </div>
    </div>
  )
}
