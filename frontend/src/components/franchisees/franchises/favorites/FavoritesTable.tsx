import { ReactNode } from 'react'

interface FavoritesTableProps {
  children: ReactNode
}

export default function FavoritesTable({ children }: FavoritesTableProps) {
  return (
    <div
      id="favorites-table"
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table
          className="w-full table-fixed"
          aria-label="Lista de franquias favoritas"
        >
          <colgroup>
            <col className="w-[12%] md:w-[6%]" />
            <col className="w-[44%] md:w-[26%]" />
            <col className="hidden md:table-column md:w-[19%]" />
            <col className="w-[44%] md:w-[15%]" />
            <col className="hidden md:table-column md:w-[17%]" />
            <col className="hidden md:table-column md:w-[17%]" />
          </colgroup>
          {children}
        </table>
      </div>
    </div>
  )
}
