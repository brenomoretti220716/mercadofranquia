import { ReactNode } from 'react'

interface AdminFranchiseTableProps {
  children: ReactNode
}

export default function AdminFranchiseTable({
  children,
}: AdminFranchiseTableProps) {
  return (
    <table className="table-fixed text-sm text-left text-gray-500 min-w-[900px] md:min-w-[1200px] md:w-full border-separate border-spacing-0">
      <colgroup>
        <col style={{ width: '20%' }} />
        <col style={{ width: '12%' }} />
        <col style={{ width: '12%' }} />
        <col style={{ width: '12%' }} />
        <col style={{ width: '12%' }} />
        <col style={{ width: '12%' }} />
        <col style={{ width: '12%' }} />
        <col style={{ width: '8%' }} />
      </colgroup>
      {children}
    </table>
  )
}
