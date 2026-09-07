import type { ReactNode } from 'react'

type DialogProps = { open?: boolean; onOpenChange?: (open: boolean) => void; children: ReactNode }
export function Dialog({ open, children }: DialogProps) { return open === false ? null : <>{children}</> }
export function DialogTrigger({ children }: { asChild?: boolean; children: ReactNode }) { return <>{children}</> }
export function DialogContent({ children, className = '' }: { children: ReactNode; className?: string }) { return <div className={`rounded border bg-white p-6 shadow ${className}`}>{children}</div> }
export function DialogHeader({ children }: { children: ReactNode }) { return <div className="mb-4">{children}</div> }
export function DialogTitle({ children }: { children: ReactNode }) { return <h2 className="text-lg font-semibold">{children}</h2> }
export function DialogDescription({ children }: { children: ReactNode }) { return <p className="text-sm text-gray-600">{children}</p> }
