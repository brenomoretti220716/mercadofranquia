import { ReactNode } from 'react'

interface NewsTableProps {
  children: ReactNode
}

export default function NewsTable({ children }: NewsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <colgroup>
          <col className="w-[30%]" />
          <col className="w-[20%]" />
          <col className="w-[20%]" />
          <col className="w-[20%]" />
          <col className="w-[10%]" />
        </colgroup>
        {children}
      </table>
    </div>
  )
}
