import * as React from 'react'
import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

const baseStyles =
  'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

const variantStyles: Record<ButtonVariant, string> = {
  default: 'bg-slate-900 text-white hover:bg-slate-800',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  outline: 'border border-slate-300 bg-white hover:bg-slate-50',
  ghost: 'bg-transparent hover:bg-slate-100',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
}

const sizeStyles: Record<ButtonSize, string> = {
  default: 'h-10 px-4 py-2 text-sm rounded-md',
  sm: 'h-9 px-3 text-xs rounded-md',
  lg: 'h-11 px-8 text-base rounded-md',
  icon: 'h-10 w-10 rounded-md',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'