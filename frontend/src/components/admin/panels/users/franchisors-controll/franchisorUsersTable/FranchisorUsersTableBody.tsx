import { ReactNode } from 'react'

interface FranchisorUsersTableBodyProps {
  children: ReactNode
}

export default function FranchisorUsersTableBody({
  children,
}: FranchisorUsersTableBodyProps) {
  return <tbody>{children}</tbody>
}
