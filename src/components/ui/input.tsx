import * as React from 'react'
import { cn } from '@/lib/utils'
import { Eye, EyeOff } from 'lucide-react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const isPassword = type === 'password'
    const actualType = isPassword && showPassword ? 'text' : type

    return (
      <div className="relative w-full">
        <input
          type={actualType}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            isPassword ? 'pr-10' : '',
            className,
          )}
          ref={ref}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'

export { Input }
