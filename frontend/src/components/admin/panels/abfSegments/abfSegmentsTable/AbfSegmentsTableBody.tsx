import { ReactNode } from 'react'

interface AbfSegmentsTableBodyProps {
  children: ReactNode
}

export default function AbfSegmentsTableBody({
  children,
}: AbfSegmentsTableBodyProps) {
  return <tbody>{children}</tbody>
}
