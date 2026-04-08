import { ReactNode } from 'react'

interface AdminUsersTableProps {
  children: ReactNode
}

export default function AdminUsersTable({ children }: AdminUsersTableProps) {
  return (
    <table className="table-fixed text-sm text-left text-gray-500 min-w-[700px] md:min-w-[900px] md:w-full border-separate border-spacing-0">
      <colgroup>
        <col style={{ width: '30%' }} />
        <col style={{ width: '30%' }} />
        <col style={{ width: '15%' }} />
        <col style={{ width: '15%' }} />
        <col style={{ width: '10%' }} />
      </colgroup>
      {children}
    </table>
  )
}
