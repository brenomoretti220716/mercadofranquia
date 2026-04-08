import { ReactNode } from 'react'

interface AdminUsersTableBodyProps {
  children: ReactNode
}

export default function AdminUsersTableBody({
  children,
}: AdminUsersTableBodyProps) {
  return <tbody>{children}</tbody>
}
