import { ReactNode } from 'react'

interface AdminFranchiseTableBodyProps {
  children: ReactNode
}

export default function AdminFranchiseTableBody({
  children,
}: AdminFranchiseTableBodyProps) {
  return <tbody>{children}</tbody>
}
