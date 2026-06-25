import React from 'react'
import { cn } from '@/lib/utils'

export interface SpinnerProps extends React.SVGProps<SVGSVGElement> {
  size?: 16 | 20 | 24 | 32 | 40
  color?: string
}

export function Spinner({
  size = 24,
  color = 'var(--color-primary)',
  className,
  ...props
}: SpinnerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      style={{
        animation: 'spin 0.8s linear infinite',
        stroke: color,
      }}
      {...props}
    >
      <circle
        cx="25"
        cy="25"
        r="20"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="90 150"
        strokeDashoffset="0"
      />
    </svg>
  )
}
