import { ReactNode } from 'react'

interface FranchisorRequestsTableProps {
  children: ReactNode
}

export default function FranchisorRequestsTable({
  children,
}: FranchisorRequestsTableProps) {
  return (
    <div className="overflow-x-auto">
      <div className="w-full text-sm text-left text-gray-500">
        <div className="grid grid-cols-6 gap-4">
          <div className="w-[20%]"></div>
          <div className="w-[15%]"></div>
          <div className="w-[20%]"></div>
          <div className="w-[15%]"></div>
          <div className="w-[15%]"></div>
          <div className="w-[15%]"></div>
        </div>
        {children}
      </div>
    </div>
  )
}
