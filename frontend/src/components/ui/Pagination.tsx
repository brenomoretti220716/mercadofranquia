import React from 'react'

interface PaginationProps {
  page: number
  total: number
  limit: number
  onPageChange: (page: number) => void
  /** When set, scrolls to the element with this id (e.g. `#component-tag-name`) on page change */
  scrollToId?: string
  /** Margin in px above the target when scrolling (default 80). Leaves breathing room below fixed headers. */
  scrollMarginTop?: number
}

const DEFAULT_SCROLL_MARGIN_TOP = 80

export const Pagination: React.FC<PaginationProps> = ({
  page,
  total,
  limit,
  onPageChange,
  scrollToId,
  scrollMarginTop = DEFAULT_SCROLL_MARGIN_TOP,
}) => {
  const totalPages = Math.ceil(total / limit)
  if (totalPages <= 1) return null

  const scrollToTarget = () => {
    if (!scrollToId) return
    // Defer scroll until after React has committed the new page content to the DOM,
    // so the target element and layout are updated (fixes scroll not working on some pages).
    const runScroll = () => {
      const el = document.getElementById(scrollToId)
      if (!el) return
      const prevMargin = (el as HTMLElement).style.scrollMarginTop
      ;(el as HTMLElement).style.scrollMarginTop = `${scrollMarginTop}px`
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      ;(el as HTMLElement).style.scrollMarginTop = prevMargin
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(runScroll)
    })
  }

  const handlePageChange = (newPage: number) => {
    onPageChange(newPage)
    scrollToTarget()
  }

  const handlePrev = () => {
    if (page > 1) handlePageChange(page - 1)
  }
  const handleNext = () => {
    if (page < totalPages) handlePageChange(page + 1)
  }

  // Gera uma lista de páginas para exibir (máximo de 5 páginas)
  const getPages = () => {
    const pages = []
    let start = Math.max(1, page - 1)
    let end = Math.min(totalPages, page + 1)
    if (end - start < 2) {
      if (start === 1) end = Math.min(totalPages, start + 2)
      if (end === totalPages) start = Math.max(1, end - 2)
    }
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  const NAV_BTN =
    'flex w-8 h-8 sm:w-10 sm:h-10 items-center rounded-full justify-center border border-border text-xs sm:text-sm font-medium text-[#171726] dark:text-foreground hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'

  return (
    <nav className="flex flex-wrap gap-1.5 sm:gap-2 items-center justify-center mt-6 sm:mt-8">
      <button
        className={NAV_BTN}
        onClick={() => handlePageChange(1)}
        disabled={page === 1}
        title="Primeira página"
      >
        &#171;
      </button>
      <button className={NAV_BTN} onClick={handlePrev} disabled={page === 1}>
        &lt;
      </button>

      {getPages().map((p) => (
        <button
          key={p}
          onClick={() => handlePageChange(p)}
          className={`flex w-8 h-8 sm:w-10 sm:h-10 items-center rounded-full justify-center border text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
            p === page
              ? 'bg-primary border-primary text-white'
              : 'border-border text-[#171726] dark:text-foreground hover:bg-secondary'
          }`}
          disabled={p === page}
        >
          {p}
        </button>
      ))}

      <button
        className={NAV_BTN}
        onClick={handleNext}
        disabled={page === totalPages}
      >
        &gt;
      </button>
      <button
        className={NAV_BTN}
        onClick={() => handlePageChange(totalPages)}
        disabled={page === totalPages}
        title="Última página"
      >
        &#187;
      </button>
    </nav>
  )
}
