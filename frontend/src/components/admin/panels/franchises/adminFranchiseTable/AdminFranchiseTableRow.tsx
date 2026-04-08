import StarIcon from '@/src/components/icons/starIcon'
import ThreeDotsIcon from '@/src/components/icons/threeDotsIcon'
import type { Franchise } from '@/src/schemas/franchises/Franchise'
import { truncateText } from '@/src/utils/truncateText'
import Image from 'next/image'

interface AdminFranchiseTableRowProps {
  franchise: Franchise
  onRowClick: (franchiseId: string) => void
  onEditClick: (franchise: Franchise) => void
  previousFranchise?: Franchise
  nextFranchise?: Franchise
}

export default function AdminFranchiseTableRow({
  franchise,
  onRowClick,
  onEditClick,
  previousFranchise,
  nextFranchise,
}: AdminFranchiseTableRowProps) {
  const isFirstInGroup =
    franchise.isSponsored && !previousFranchise?.isSponsored
  const isLastInGroup = franchise.isSponsored && !nextFranchise?.isSponsored

  const getRowBorderClasses = () => {
    return ''
  }

  const getFirstCellBorderClasses = () => {
    if (!franchise.isSponsored) return ''
    let classes = 'border-l-2 border-[#E25E3E]'
    if (isFirstInGroup) classes += ' rounded-tl-sm'
    if (isLastInGroup) classes += ' rounded-bl-sm'
    return classes
  }

  const getLastCellBorderClasses = () => {
    if (!franchise.isSponsored) return ''
    let classes = 'border-r-2 border-[#E25E3E]'
    if (isFirstInGroup) classes += ' rounded-tr-sm'
    if (isLastInGroup) classes += ' rounded-br-sm'
    return classes
  }

  const getTopCellBorderClasses = () => {
    if (!franchise.isSponsored || !isFirstInGroup) return ''
    return 'border-t-2 border-[#E25E3E]'
  }

  const getBottomCellBorderClasses = () => {
    if (!franchise.isSponsored || !isLastInGroup) return ''
    return 'border-b-2 border-[#E25E3E]'
  }

  const getRowBackgroundClass = () => {
    if (franchise.isSponsored)
      return 'bg-gradient-to-r from-[#f6f6f9] to-[#E4AC9E]/30'
    if (franchise.isActive) return 'bg-[#f6f6f9]'
    return 'bg-red-50'
  }

  return (
    <>
      <tr
        key={franchise.id}
        className={`border-b border-gray-200 ${
          franchise.isSponsored ? 'hover:bg-[#E4AC9E]/40' : 'hover:bg-gray-100'
        } cursor-pointer transition-colors relative ${getRowBackgroundClass()} ${getRowBorderClasses()}`}
        onClick={() => onRowClick(franchise.id)}
      >
        {/* Franchise Name Column */}
        <td
          className={`px-4 py-4 font-medium text-gray-900 relative ${getFirstCellBorderClasses()} ${getTopCellBorderClasses()} ${getBottomCellBorderClasses()}`}
        >
          {isFirstInGroup && (
            <div className="absolute left-4 -top-2.5 z-10">
              <span className="bg-white text-[#E25E3E] text-xs font-semibold px-1 border-2 border-[#E25E3E] rounded-sm">
                Patrocinados
              </span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
              {franchise.logoUrl ? (
                <Image
                  width={1000}
                  height={1000}
                  src={franchise.logoUrl}
                  alt={franchise.name || 'Franchise'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.nextElementSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              <div
                className={`w-full h-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-semibold ${franchise.logoUrl ? 'hidden' : ''}`}
              >
                {franchise.name ? franchise.name.charAt(0).toUpperCase() : 'F'}
              </div>
            </div>
            <div
              className="truncate flex-1 min-w-0"
              title={franchise.name || 'N/A'}
            >
              {truncateText(franchise.name || '', 20)}
            </div>
          </div>
        </td>

        {/* Units Column */}
        <td
          className={`px-4 py-4 text-center ${getTopCellBorderClasses()} ${getBottomCellBorderClasses()}`}
        >
          <div className="text-xs text-gray-600 font-medium whitespace-nowrap">
            {franchise.totalUnits ?? 'Não informado'}
          </div>
        </td>

        {/* Rating Column */}
        <td
          className={`px-4 py-4 text-center ${getTopCellBorderClasses()} ${getBottomCellBorderClasses()}`}
        >
          <div className="text-xs flex items-center gap-2 justify-center text-gray-600 font-medium whitespace-nowrap">
            {franchise.averageRating?.toFixed(1) ?? '0'}
            <StarIcon width={16} height={16} filled={true} color="#E25E3E" />
          </div>
        </td>

        {/* Investment Column */}
        <td
          className={`px-4 py-4 text-center ${getTopCellBorderClasses()} ${getBottomCellBorderClasses()}`}
        >
          <div className="text-xs text-gray-600 font-medium whitespace-nowrap">
            {franchise.minimumInvestment || 'Não informado'}
          </div>
        </td>

        {/* Return on Investment Column */}
        <td
          className={`px-4 py-4 text-center ${getTopCellBorderClasses()} ${getBottomCellBorderClasses()}`}
        >
          <div
            className="text-xs text-gray-600 whitespace-nowrap"
            title={
              franchise.minimumReturnOnInvestment != null
                ? String(franchise.minimumReturnOnInvestment)
                : 'N/A'
            }
          >
            {truncateText(
              franchise.minimumReturnOnInvestment != null
                ? String(franchise.minimumReturnOnInvestment)
                : 'Não informado',
              15,
            )}
          </div>
        </td>

        {/* Franchise Fee Column */}
        <td
          className={`px-4 py-4 text-center ${getTopCellBorderClasses()} ${getBottomCellBorderClasses()}`}
        >
          <div
            className="text-xs text-gray-600 whitespace-nowrap"
            title={
              franchise.franchiseFee != null
                ? String(franchise.franchiseFee)
                : 'N/A'
            }
          >
            {truncateText(
              franchise.franchiseFee != null
                ? String(franchise.franchiseFee)
                : 'Não informado',
              15,
            )}
          </div>
        </td>

        {/* Average Monthly Revenue Column */}
        <td
          className={`px-4 py-4 text-center ${getTopCellBorderClasses()} ${getBottomCellBorderClasses()}`}
        >
          <div
            className="text-xs text-gray-600 whitespace-nowrap"
            title={
              franchise.averageMonthlyRevenue != null
                ? String(franchise.averageMonthlyRevenue)
                : 'N/A'
            }
          >
            {truncateText(
              franchise.averageMonthlyRevenue != null
                ? String(franchise.averageMonthlyRevenue)
                : 'Não informado',
              15,
            )}
          </div>
        </td>

        {/* Actions Column */}
        <td
          className={`px-4 py-4 text-center ${getLastCellBorderClasses()} ${getTopCellBorderClasses()} ${getBottomCellBorderClasses()}`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEditClick(franchise)
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Gerenciar franquia"
          >
            <ThreeDotsIcon />
          </button>
        </td>
      </tr>
    </>
  )
}
