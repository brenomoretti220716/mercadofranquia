import { ReactNode } from 'react'

interface NewsTableBodyProps {
  children: ReactNode
}

export default function NewsTableBody({ children }: NewsTableBodyProps) {
  return <tbody>{children}</tbody>
}
