import * as React from 'react'
import { cn } from '@/lib/utils'

const Grid = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-6 w-full',
        className,
      )}
      {...props}
    />
  ),
)
Grid.displayName = 'Grid'

interface ColProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: number
  offset?: number
}

const Col = React.forwardRef<HTMLDivElement, ColProps>(
  ({ className, span = 1, offset = 0, style, ...props }, ref) => {
    const mergedStyle = {
      ...style,
      gridColumn: `span ${span} / span ${span}`,
      ...(offset > 0 ? { gridColumnStart: offset + 1 } : {}),
    }
    return <div ref={ref} className={className} style={mergedStyle} {...props} />
  },
)
Col.displayName = 'Col'

export { Grid, Col }
