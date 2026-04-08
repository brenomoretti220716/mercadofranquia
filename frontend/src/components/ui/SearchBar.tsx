import CloseIcon from '../icons/closeIcon'
import SearchIcon from '../icons/searchIcon'

interface SearchBarProps {
  searchInput: string
  setSearchInput: (value: string) => void
  setSearchTerm: (value: string) => void
  setPage: (value: number) => void
  placeholder?: string
}

export default function SearchBar({
  searchInput,
  setSearchInput,
  setSearchTerm,
  setPage,
  placeholder,
}: SearchBarProps) {
  const handleClear = () => {
    setSearchInput('')
    setSearchTerm('')
    setPage(1)
  }

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <SearchIcon width={18} height={18} color="#747473" />
      </div>
      <input
        type="text"
        placeholder={placeholder || 'Buscar opções...'}
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setSearchTerm(searchInput)
            setPage(1)
          }
        }}
        className={`flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 pl-10 pr-10 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm`}
      />
      {searchInput && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded-full transition-colors"
          aria-label="Limpar pesquisa"
        >
          <CloseIcon width={16} height={16} color="#747473" />
        </button>
      )}
    </div>
  )
}
