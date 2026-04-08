import { ReactNode } from 'react'

interface AbfSegmentsTableProps {
  children: ReactNode
}

export default function AbfSegmentsTable({ children }: AbfSegmentsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <colgroup>
          <col className="w-[10%]" />
          <col className="w-[10%]" />
          <col className="w-[15%]" />
          <col className="w-[45%]" />
          <col className="w-[15%]" />
          <col className="w-[5%]" />
        </colgroup>
        {children}
      </table>
    </div>
  )
}
