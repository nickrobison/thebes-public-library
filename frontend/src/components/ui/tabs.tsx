import type { ReactNode } from 'react'
export function Tabs({ children }: { defaultValue?: string; value?: string; onValueChange?: (value: string) => void; className?: string; children: ReactNode }) { return <div>{children}</div> }
export function TabsList({ children, className = '' }: { children: ReactNode; className?: string }) { return <div className={className}>{children}</div> }
export function TabsTrigger({ children }: { value: string; children: ReactNode }) { return <button type="button">{children}</button> }
export function TabsContent({ children, className = '' }: { value: string; children: ReactNode; className?: string }) { return <div className={className}>{children}</div> }
