import React from 'react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

export interface DisabledWrapperProps {
  children: React.ReactNode
  disabled?: boolean
  reason?: string
  className?: string
}

export function DisabledWrapper({
  children,
  disabled = true,
  reason,
  className,
}: DisabledWrapperProps) {
  if (!disabled) {
    return <>{children}</>
  }

  const wrapper = (
    <div className={cn('relative opacity-50 cursor-not-allowed group inline-block', className)}>
      <div className="pointer-events-none">{children}</div>
      <div className="absolute inset-0 z-10" />
    </div>
  )

  if (reason) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{wrapper}</TooltipTrigger>
        <TooltipContent className="bg-[#1A232E] text-white text-[13px] px-3 py-2 rounded-[var(--radius-md)] border-none shadow-md">
          {reason}
        </TooltipContent>
      </Tooltip>
    )
  }

  return wrapper
}
