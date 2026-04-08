import StarIcon from '@/src/components/icons/starIcon'
import TriangleIcon from '@/src/components/icons/triangleIcon'
import Marquee from '@/src/components/ui/Marquee'
import { Franchise } from '@/src/schemas/franchises/Franchise'
import { formatInvestmentRange } from '@/src/utils/formatters'
import Image from 'next/image'

interface FavoritesTableRowProps {
  franchise: Franchise
  position: number
  onRowClick: (franchiseSlug: string) => void
  previousFranchise?: Franchise
  nextFranchise?: Franchise
}

export default function FavoritesTableRow({
  franchise,
  position,
  onRowClick,
}: FavoritesTableRowProps) {
  const isSponsored = franchise.isSponsored ?? false

  return (
    <tr
      key={franchise.id}
      onClick={() => onRowClick(franchise.slug ?? franchise.id)}
      className={`border-b last:border-0 transition-colors cursor-pointer ${
        isSponsored
          ? 'bg-card border-orange-200 hover:bg-secondary/30 dark:border-orange-700'
          : 'border-border hover:bg-secondary/30'
      }`}
    >
      <td className="p-2 md:p-4 overflow-hidden" style={{ maxWidth: 0 }}>
        <span
          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm md:text-base ${
            isSponsored
              ? 'text-orange-600 dark:text-orange-400 bg-primary/10'
              : 'text-[#626D84] bg-[#E8EAEE]'
          }`}
        >
          {position}
        </span>
      </td>
      <td
        className="p-2 md:p-4 overflow-hidden md:overflow-hidden"
        style={{ maxWidth: 0 }}
      >
        <div className="flex items-center gap-2 md:gap-3 min-w-0 w-full">
          {franchise.logoUrl ? (
            <Image
              src={franchise.logoUrl}
              alt={franchise.name}
              width={32}
              height={32}
              className="object-contain rounded shrink-0 w-6 h-6 md:w-8 md:h-8"
            />
          ) : (
            <span className="text-xl md:text-2xl shrink-0">🏢</span>
          )}
          <div className="flex items-center gap-1 md:gap-2 min-w-0 flex-1">
            <Marquee className="flex-1 min-w-0">
              <span className="font-medium text-foreground text-sm md:text-base">
                {franchise.name}
              </span>
            </Marquee>
            {isSponsored && (
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-400/20 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 flex-[0_0_auto] shrink-0">
                ⭐ Patrocinado
              </span>
            )}
          </div>
        </div>
      </td>
      <td
        className="p-4 text-center text-muted-foreground hidden md:table-cell min-w-0 overflow-hidden"
        style={{ width: '19%', maxWidth: '19%' }}
      >
        <span className="truncate block">
          {franchise.segment || 'Consulte'}
        </span>
      </td>
      <td
        className="p-2 md:p-4 text-center overflow-hidden"
        style={{ maxWidth: 0 }}
      >
        <div className="flex items-center justify-center gap-0.5 min-w-0 overflow-hidden">
          {Array.from({ length: 5 }).map((_, index) => {
            const rating = franchise.averageRating || 0
            const isFilled = index < Math.floor(rating)
            return (
              <StarIcon
                key={index}
                width={14}
                height={14}
                color={isFilled ? '#facc15' : '#d1d5db'}
                filled={isFilled}
                className="shrink-0"
              />
            )
          })}
          {franchise.averageRating !== null &&
            franchise.averageRating !== undefined && (
              <span className="font-semibold text-sm md:text-base whitespace-nowrap ml-1">
                {franchise.averageRating.toFixed(1)}
              </span>
            )}
        </div>
      </td>
      <td
        className="p-4 text-center text-foreground hidden md:table-cell overflow-hidden"
        style={{ width: '17%', maxWidth: '17%' }}
      >
        <div className="flex items-center justify-center gap-1">
          <span className="truncate block">{franchise.totalUnits ?? '—'}</span>
          {franchise.unitsEvolution === 'UP' && (
            <TriangleIcon
              width={12}
              height={12}
              color="#22c55e"
              upsideDown={false}
            />
          )}
          {franchise.unitsEvolution === 'DOWN' && (
            <TriangleIcon
              width={12}
              height={12}
              color="#ef4444"
              upsideDown={true}
            />
          )}
        </div>
      </td>
      <td
        className="p-4 text-center text-foreground hidden md:table-cell overflow-hidden"
        style={{ width: '17%', maxWidth: '17%' }}
      >
        <span className="inline-block px-3 py-1 bg-primary/20 text-[#265973] rounded-full">
          {formatInvestmentRange(
            franchise.minimumInvestment,
            franchise.maximumInvestment,
          )}
        </span>
      </td>
    </tr>
  )
}
