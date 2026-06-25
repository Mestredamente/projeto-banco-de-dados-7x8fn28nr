import React, { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  title?: string
  description?: string
  variant: ToastVariant
}

let toasts: ToastItem[] = []
let listeners: ((toasts: ToastItem[]) => void)[] = []

export const systemToast = (options: Omit<ToastItem, 'id'>) => {
  const id = Math.random().toString(36).slice(2)
  const newToast = { ...options, id }
  toasts = [...toasts, newToast]
  listeners.forEach((l) => l(toasts))

  setTimeout(() => {
    dismissSystemToast(id)
  }, 5000)
}

export const dismissSystemToast = (id: string) => {
  toasts = toasts.filter((t) => t.id !== id)
  listeners.forEach((l) => l(toasts))
}

export function SystemToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    listeners.push(setCurrentToasts)
    return () => {
      listeners = listeners.filter((l) => l !== setCurrentToasts)
    }
  }, [])

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
      {currentToasts.map((t) => {
        const icons = {
          success: <CheckCircle2 className="h-5 w-5 text-success" />,
          error: <AlertCircle className="h-5 w-5 text-error" />,
          warning: <AlertTriangle className="h-5 w-5 text-warning" />,
          info: <Info className="h-5 w-5 text-info" />,
        }

        return (
          <div
            key={t.id}
            role="alert"
            className={cn(
              'pointer-events-auto flex w-full items-start gap-3 rounded-[var(--radius-md)] border bg-surface p-4 shadow-lg transition-all animate-fade-in slide-in-from-right-full duration-300',
            )}
            style={{
              borderColor: `color-mix(in srgb, var(--color-${t.variant}) 30%, transparent)`,
            }}
          >
            <div className="shrink-0 mt-0.5">{icons[t.variant]}</div>
            <div className="flex flex-col gap-1 pr-6 flex-1">
              {t.title && <h5 className="font-medium text-text-primary text-body-sm">{t.title}</h5>}
              {t.description && (
                <div className="text-caption text-text-secondary">{t.description}</div>
              )}
            </div>
            <button
              onClick={() => dismissSystemToast(t.id)}
              className="absolute right-2 top-2 rounded-sm p-1 opacity-50 hover:opacity-100 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Fechar notificação"
            >
              <X className="h-4 w-4 text-text-secondary" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
