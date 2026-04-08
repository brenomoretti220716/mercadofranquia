import { ReactNode } from 'react'

interface FranchiseeUsersTableProps {
  children: ReactNode
}

export default function FranchiseeUsersTable({
  children,
}: FranchiseeUsersTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <colgroup>
          <col className="w-[20%]" />
          <col className="w-[20%]" />
          <col className="w-[12%]" />
          <col className="w-[13%]" />
          <col className="w-[15%]" />
          <col className="w-[8%]" />
          <col className="w-[12%]" />
        </colgroup>
        {children}
      </table>
    </div>
  )
}
