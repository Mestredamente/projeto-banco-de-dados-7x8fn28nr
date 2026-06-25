import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/lib/utils'

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  title = 'Algo deu errado',
  message = 'Ocorreu um erro inesperado ao tentar carregar esta página.',
  onRetry,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center animate-page-enter',
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-center w-[100px] h-[100px] rounded-full bg-error-light mb-6">
        <AlertCircle className="w-12 h-12 text-error" strokeWidth={1.5} />
      </div>
      <h3 className="text-[18px] font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-[15px] text-text-secondary max-w-sm mb-6">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary">
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
