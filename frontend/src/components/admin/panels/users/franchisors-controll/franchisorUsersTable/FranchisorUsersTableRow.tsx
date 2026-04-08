import ThreeDotsIcon from '@/src/components/icons/threeDotsIcon'
import { Franchise } from '@/src/schemas/franchises/Franchise'
import { User } from '@/src/schemas/users/User'

interface FranchisorUsersTableRowProps {
  user: User
  onEditClick: (user: User) => void
  truncateText: (
    text: string | number | null | undefined,
    maxLength: number,
  ) => string
  renderFranchises: (franchises: Franchise[] | undefined) => React.JSX.Element
}

export default function FranchisorUsersTableRow({
  user,
  onEditClick,
  truncateText,
  renderFranchises,
}: FranchisorUsersTableRowProps) {
  return (
    <tr key={user.id} className="bg-[#f6f6f9] border-b border-gray-200">
      {/* Name Column */}
      <td className="px-6 py-4 font-medium text-gray-900">
        <div className="truncate" title={user.name || 'N/A'}>
          {truncateText(user.name || '', 25)}
        </div>
      </td>

      {/* Email Column */}
      <td className="px-6 py-4">
        <div className="truncate" title={user.email || 'N/A'}>
          {truncateText(user.email || '', 25)}
        </div>
      </td>

      {/* CPF/CNPJ Column */}
      <td className="px-6 py-4 text-center">
        <div className="truncate">
          {truncateText(user.cpf || 'não possui', 15)}
        </div>
      </td>

      {/* Franchises Column */}
      <td className="px-6 py-4">{renderFranchises(user.ownedFranchises)}</td>

      {/* Actions Column */}
      <td className="px-6 py-4 text-center">
        <button
          onClick={() => onEditClick(user)}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          title={`Editar ${user.name}`}
        >
          <ThreeDotsIcon />
        </button>
      </td>
    </tr>
  )
}
