import type { ButtonHTMLAttributes } from 'react'
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }

export function Button({ className = '', variant, size, ...props }: Props) {
  return <button className={`rounded border px-3 py-2 ${className}`} {...props} />
}
