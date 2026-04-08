import ThreeDotsIcon from '@/src/components/icons/threeDotsIcon'
import type { AbfSegmentEntry } from '@/src/services/abfSegments'
import { isAbfYearQuarterForecast } from '@/src/utils/abfQuarterForecast'
import { truncateText } from '@/src/utils/truncateText'

interface AbfSegmentsTableRowProps {
  entry: AbfSegmentEntry
  onEditClick: (entry: AbfSegmentEntry) => void
  formatValue?: (value: number) => string
}

export default function AbfSegmentsTableRow({
  entry,
  onEditClick,
  formatValue = (v) => String(v),
}: AbfSegmentsTableRowProps) {
  const isForecast = isAbfYearQuarterForecast(entry.year, entry.quarter)

  return (
    <tr className="bg-[#f6f6f9] border-b border-gray-200">
      <td className="px-4 py-4 font-medium text-gray-900">{entry.year}</td>
      <td className="px-4 py-4">
        <span className="inline-flex items-center gap-2">
          {entry.quarter}
          {isForecast ? (
            <span className="rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 text-xs font-medium">
              Previsão
            </span>
          ) : null}
        </span>
      </td>
      <td className="px-4 py-4 text-center">{entry.acronym}</td>
      <td className="px-4 py-4">
        <div className="truncate" title={entry.segment || ''}>
          {truncateText(entry.segment || '', 60)}
        </div>
      </td>
      <td className="px-4 py-4 text-center">{formatValue(entry.value)}</td>
      <td className="px-4 py-4 text-center">
        <button
          type="button"
          onClick={() => onEditClick(entry)}
          className="text-gray-500 hover:text-gray-700"
        >
          <ThreeDotsIcon />
        </button>
      </td>
    </tr>
  )
}
