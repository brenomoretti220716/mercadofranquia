import ThreeDotsIcon from '@/src/components/icons/threeDotsIcon'
import { NewsSchema } from '@/src/schemas/users/News'
import { truncateText } from '@/src/utils/truncateText'

interface NewsTableRowProps {
  newsItem: NewsSchema
  onEditClick: (newsItem: NewsSchema) => void
  formatDate: (dateString: string | Date | undefined) => string
  renderCategory: (category: string | undefined) => React.ReactNode
}

export default function NewsTableRow({
  newsItem,
  onEditClick,
  formatDate,
  renderCategory,
}: NewsTableRowProps) {
  return (
    <tr key={newsItem.id} className="bg-[#f6f6f9] border-b border-gray-200">
      {/* Title Column */}
      <td className="px-4 py-4 font-medium text-gray-900">
        <div className="truncate" title={newsItem.title || 'N/A'}>
          {truncateText(newsItem.title || '', 40)}
        </div>
      </td>

      {/* Publication Date Column */}
      <td className="px-4 py-4 text-center">
        <div className="text-xs text-gray-600">
          {formatDate(newsItem.createdAt)}
        </div>
      </td>

      {/* Last Edit Column */}
      <td className="px-4 py-4 text-center">
        <div className="text-xs text-gray-600">
          {formatDate(newsItem.updatedAt)}
        </div>
      </td>

      {/* Category Column */}
      <td className="px-4 py-4">{renderCategory(newsItem.category)}</td>

      {/* Actions Column */}
      <td className="px-4 py-4 text-center">
        <button
          onClick={() => onEditClick(newsItem)}
          className="text-gray-500 hover:text-gray-700"
        >
          <ThreeDotsIcon />
        </button>
      </td>
    </tr>
  )
}
