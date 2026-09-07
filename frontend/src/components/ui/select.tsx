import type { ReactNode } from 'react'

export function Select({ children }: { value?: string; onValueChange?: (value: string) => void; children: ReactNode }) { return <div>{children}</div> }
export function SelectTrigger({ children, className = '' }: { children: ReactNode; className?: string }) { return <div className={`rounded border px-3 py-2 ${className}`}>{children}</div> }
export function SelectValue({ placeholder }: { placeholder?: string }) { return <span>{placeholder}</span> }
export function SelectContent({ children, className = '' }: { children: ReactNode; className?: string }) { return <div className={className}>{children}</div> }
export function SelectItem({ children, className = '' }: { value: string; children: ReactNode; className?: string }) { return <div className={className}>{children}</div> }
