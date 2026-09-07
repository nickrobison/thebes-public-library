import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'
export function Table({ children, ...props }: HTMLAttributes<HTMLTableElement>) { return <table {...props}>{children}</table> }
export function TableHeader({ children, ...props }: HTMLAttributes<HTMLTableSectionElement>) { return <thead {...props}>{children}</thead> }
export function TableBody({ children, ...props }: HTMLAttributes<HTMLTableSectionElement>) { return <tbody {...props}>{children}</tbody> }
export function TableRow({ children, ...props }: HTMLAttributes<HTMLTableRowElement>) { return <tr {...props}>{children}</tr> }
export function TableHead({ children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) { return <th {...props}>{children}</th> }
export function TableCell({ children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) { return <td {...props}>{children}</td> }
