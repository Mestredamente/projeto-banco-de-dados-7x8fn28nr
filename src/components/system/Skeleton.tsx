import React from 'react'
import { cn } from '@/lib/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'card' | 'table' | 'circle' | 'custom'
  count?: number
}

export function Skeleton({ variant = 'text', count = 1, className, ...props }: SkeletonProps) {
  const elements = Array.from({ length: Math.max(1, count) }, (_, i) => i)

  const renderVariant = (key?: number) => {
    switch (variant) {
      case 'text':
        return (
          <div
            key={key}
            className={cn('skeleton h-4 w-full mb-2 rounded-[var(--radius-sm)]', className)}
            {...props}
          />
        )
      case 'card':
        return (
          <div
            key={key}
            className={cn('skeleton h-[120px] w-full rounded-[var(--radius-lg)]', className)}
            {...props}
          />
        )
      case 'circle':
        return (
          <div
            key={key}
            className={cn('skeleton h-10 w-10 rounded-[var(--radius-full)]', className)}
            {...props}
          />
        )
      case 'table':
        return (
          <div
            key={key}
            className={cn('flex items-center w-full gap-4 py-2', className)}
            {...props}
          >
            <div className="skeleton h-4 w-[10%] rounded-[var(--radius-sm)]" />
            <div className="skeleton h-4 w-[30%] rounded-[var(--radius-sm)]" />
            <div className="skeleton h-4 w-[20%] rounded-[var(--radius-sm)]" />
            <div className="skeleton h-4 w-[25%] rounded-[var(--radius-sm)]" />
            <div className="skeleton h-4 w-[15%] rounded-[var(--radius-sm)]" />
          </div>
        )
      case 'custom':
      default:
        return <div key={key} className={cn('skeleton', className)} {...props} />
    }
  }

  if (count === 1) {
    return renderVariant()
  }

  return <div className="flex flex-col gap-2">{elements.map((i) => renderVariant(i))}</div>
}
