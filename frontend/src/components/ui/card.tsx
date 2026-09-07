import type { HTMLAttributes, ReactNode } from 'react'
type Props = HTMLAttributes<HTMLDivElement> & { children?: ReactNode }
export function Card({ children, ...props }: Props) { return <div {...props}>{children}</div> }
export function CardContent({ children, ...props }: Props) { return <div {...props}>{children}</div> }
export function CardHeader({ children, ...props }: Props) { return <div {...props}>{children}</div> }
export function CardTitle({ children, ...props }: Props) { return <h3 {...props}>{children}</h3> }
export function CardDescription({ children, ...props }: Props) { return <p {...props}>{children}</p> }
