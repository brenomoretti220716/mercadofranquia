import ThreeDotsIcon from '@/src/components/icons/threeDotsIcon'
import { User } from '@/src/schemas/users/User'
import { truncateText } from '@/src/utils/truncateText'

interface AdminUsersTableRowProps {
  user: User
  onEditClick: (user: User) => void
}

export default function AdminUsersTableRow({
  user,
  onEditClick,
}: AdminUsersTableRowProps) {
  return (
    <tr key={user.id} className="bg-[#f6f6f9] border-b border-gray-200">
      {/* Name Column */}
      <td className="px-3 md:px-6 py-4 font-medium text-gray-900">
        <div className="truncate" title={user.name || 'N/A'}>
          {truncateText(user.name || '', 25)}
        </div>
      </td>

      {/* Email Column */}
      <td className="px-3 md:px-6 py-4">
        <div className="truncate" title={user.email || 'N/A'}>
          {truncateText(user.email || '', 30)}
        </div>
      </td>

      {/* Role Column */}
      <td className="px-3 md:px-6 py-4 text-center">
        <div className="truncate">{user.role || 'N/A'}</div>
      </td>

      {/* Status Column */}
      <td className="px-3 md:px-6 py-4 text-center">
        <span
          className={`px-2 py-1 rounded-full text-xs ${user.isActive ? 'text-green-800 bg-green-100' : 'text-red-800 bg-red-100'}`}
        >
          {user.isActive ? 'Ativo' : 'Inativo'}
        </span>
      </td>

      {/* Actions Column */}
      <td className="px-3 md:px-6 py-4 text-center">
        <button
          onClick={() => onEditClick(user)}
          className="text-gray-500 hover:text-gray-700"
        >
          <ThreeDotsIcon />
        </button>
      </td>
    </tr>
  )
}
