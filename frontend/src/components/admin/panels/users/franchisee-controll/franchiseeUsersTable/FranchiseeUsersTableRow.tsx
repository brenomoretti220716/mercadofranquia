import ThreeDotsIcon from '@/src/components/icons/threeDotsIcon'
import { Franchise } from '@/src/schemas/franchises/Franchise'
import { User } from '@/src/schemas/users/User'
import { truncateText } from '@/src/utils/truncateText'

interface FranchiseeUsersTableRowProps {
  user: User
  onEditClick: (user: User) => void
  renderFranchises: (franchiseeOf: Franchise[] | undefined) => React.JSX.Element
}

export default function FranchiseeUsersTableRow({
  user,
  onEditClick,
  renderFranchises,
}: FranchiseeUsersTableRowProps) {
  return (
    <tr key={user.id} className="bg-[#f6f6f9] border-b border-gray-200">
      {/* Name Column */}
      <td className="px-6 py-4 font-medium text-gray-900">
        <div className="truncate" title={user.name || 'N/A'}>
          {truncateText(user.name || '', 20, 'N/A')}
        </div>
      </td>

      {/* Email Column */}
      <td className="px-6 py-4">
        <div className="truncate" title={user.email || 'N/A'}>
          {truncateText(user.email || '', 20, 'N/A')}
        </div>
      </td>

      {/* City Column */}
      <td className="px-6 py-4 text-center">
        <div className="truncate" title={user.profile?.city || 'N/A'}>
          {truncateText(user.profile?.city || 'N/A', 12, 'N/A')}
        </div>
      </td>

      {/* Role Column */}
      <td className="px-6 py-4 text-center">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium">
          {(() => {
            switch (user.role) {
              case 'FRANCHISEE':
                return 'Franqueado'
              case 'CANDIDATE':
                return 'Candidato'
              case 'ENTHUSIAST':
                return 'Entusiasta'
              case 'MEMBER':
                return 'Membro'
              default:
                return 'N/A'
            }
          })()}
        </span>
      </td>

      {/* Franchises Column */}
      <td className="px-6 py-4">{renderFranchises(user.franchiseeOf)}</td>

      {/* Status Column */}
      <td className="px-6 py-4 text-center">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            user.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {user.isActive ? 'Ativo' : 'Inativo'}
        </span>
      </td>

      {/* Actions Column */}
      <td className="px-6 py-4 text-center">
        <button
          onClick={() => onEditClick(user)}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          title="Editar usuário"
        >
          <ThreeDotsIcon />
        </button>
      </td>
    </tr>
  )
}
