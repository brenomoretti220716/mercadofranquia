import { ReactNode } from 'react'

interface FranchiseeUsersTableBodyProps {
  children: ReactNode
}

export default function FranchiseeUsersTableBody({
  children,
}: FranchiseeUsersTableBodyProps) {
  return <tbody>{children}</tbody>
}
