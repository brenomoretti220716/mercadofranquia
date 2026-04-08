import { ReactNode } from 'react'

interface FranchisorUsersTableProps {
  children: ReactNode
}

export default function FranchisorUsersTable({
  children,
}: FranchisorUsersTableProps) {
  return (
    <table className="table-fixed text-sm text-left text-gray-500 min-w-[800px] md:min-w-[1000px] md:w-full border-separate border-spacing-0">
      <colgroup>
        <col style={{ width: '25%' }} />
        <col style={{ width: '25%' }} />
        <col style={{ width: '15%' }} />
        <col style={{ width: '25%' }} />
        <col style={{ width: '10%' }} />
      </colgroup>
      {children}
    </table>
  )
}
