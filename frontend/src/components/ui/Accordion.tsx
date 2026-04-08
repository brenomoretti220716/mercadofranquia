'use client'

import { ReactNode, useState } from 'react'
import ArrowDownIcon from '../icons/arrowDownIcon'
import ArrowUpIcon from '../icons/arrowUpIcon'

interface AccordionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  className?: string
  toComplete?: boolean
  headerActions?: ReactNode
  titleIcon?: ReactNode
  titleClassName?: string
}

export default function Accordion({
  title,
  children,
  defaultOpen = false,
  className = '',
  toComplete = false,
  headerActions,
  titleIcon,
  titleClassName = 'text-lg font-semibold',
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={`border border-gray-200 rounded-lg ${className}`}>
      <div className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex justify-between items-center"
        >
          <h3
            className={`${titleClassName} text-gray-900 flex items-center gap-2`}
          >
            {titleIcon && (
              <span
                onClick={(e) => e.stopPropagation()}
                className="flex items-center"
              >
                {titleIcon}
              </span>
            )}
            {toComplete ? (
              <span className={`${titleClassName} text-orange-500`}>* </span>
            ) : null}
            {title}
          </h3>
          <div className="transition-transform duration-200 ml-4">
            {isOpen ? (
              <ArrowUpIcon width={20} height={20} />
            ) : (
              <ArrowDownIcon width={20} height={20} />
            )}
          </div>
        </button>
        {headerActions && (
          <div className="ml-4" onClick={(e) => e.stopPropagation()}>
            {headerActions}
          </div>
        )}
      </div>

      {isOpen && <div className="p-6 bg-white rounded-b-lg">{children}</div>}
    </div>
  )
}
