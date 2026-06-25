import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  critical?: boolean
  className?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  critical = false,
  className,
}: ModalProps) {
  const [mounted, setMounted] = useState(false)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${scrollbarWidth}px`

      const frame = requestAnimationFrame(() => setShow(true))
      return () => cancelAnimationFrame(frame)
    } else {
      setShow(false)
      const timer = setTimeout(() => {
        setMounted(false)
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !critical) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, critical, onClose])

  if (!mounted) return null

  const sizeClasses = {
    sm: 'max-w-[480px]',
    md: 'max-w-[640px]',
    lg: 'max-w-[800px]',
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'absolute inset-0 bg-[#1a232e]/50 backdrop-blur-[4px] transition-opacity duration-200',
          show ? 'opacity-100' : 'opacity-0',
        )}
        onClick={() => !critical && onClose()}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative w-full max-h-[90vh] overflow-y-auto bg-surface rounded-[var(--radius-xl)] shadow-xl p-[var(--spacing-lg)] transition-all duration-200',
          show ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.95]',
          sizeClasses[size],
          className,
        )}
      >
        {!critical && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm p-1.5 opacity-70 ring-offset-background transition-colors hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary hover:bg-muted"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5 text-text-secondary" />
          </button>
        )}
        {title && (
          <h2 className="text-h2 font-semibold text-text-primary mb-[var(--spacing-md)] pr-8">
            {title}
          </h2>
        )}
        <div className="text-body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
