import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function AntiTranslate({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div translate="no" data-antitranslate="true" className={cn('antitranslate', className)}>
      {children}
    </div>
  )
}
