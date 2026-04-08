import { ReactNode } from 'react'

interface FranchisorRequestsTableBodyProps {
  children: ReactNode
}

export default function FranchisorRequestsTableBody({
  children,
}: FranchisorRequestsTableBodyProps) {
  return <div className="bg-white divide-y divide-gray-200">{children}</div>
}
