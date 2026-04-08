'use client'

import GridIcon from '../icons/gridIcon'
import TableIcon from '../icons/tableIcon'

interface ViewModeToggleProps {
  viewMode: 'cards' | 'table'
  onChange: (mode: 'cards' | 'table') => void
}

const ViewModeToggle = ({ viewMode, onChange }: ViewModeToggleProps) => {
  return (
    <div className="inline-flex items-center gap-2 bg-card rounded-xl p-1 border border-border w-fit">
      <button
        onClick={() => onChange('cards')}
        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
          viewMode === 'cards'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <GridIcon
          width={16}
          height={16}
          color={viewMode === 'cards' ? 'white' : 'currentColor'}
        />
        Cards
      </button>
      <button
        onClick={() => onChange('table')}
        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
          viewMode === 'table'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <TableIcon
          width={16}
          height={16}
          color={viewMode === 'table' ? 'white' : 'currentColor'}
        />
        Tabela
      </button>
    </div>
  )
}

export default ViewModeToggle
