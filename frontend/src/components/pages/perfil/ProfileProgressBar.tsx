'use client'

import CheckCircleIcon from '@/src/components/icons/checkCircleIcon'
import XCircleIcon from '@/src/components/icons/xCircleIcon'
import { useProfileCompletion } from '@/src/hooks/users/useProfileCompletion'
import { getFieldDisplayName } from '@/src/utils/profileCompletion'

export default function ProfileProgressBar() {
  const { data: profileCompletion, isLoading } = useProfileCompletion(true)

  if (isLoading) {
    return (
      <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  if (!profileCompletion) {
    return null
  }

  const { isComplete, completionPercentage, missingFields } = profileCompletion

  return (
    <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          Completude do Perfil
        </h3>
        <span
          className={`text-lg font-bold ${
            isComplete ? 'text-green-600' : 'text-orange-600'
          }`}
        >
          {completionPercentage}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full transition-all duration-500 ${
            isComplete ? 'bg-green-600' : 'bg-orange-500'
          }`}
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Completion status */}
      {isComplete ? (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircleIcon width={20} height={20} color="currentColor" />
          <p className="text-sm font-medium">
            Seu perfil está completo! Você pode usar todas as funcionalidades da
            plataforma.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-orange-600">
            <XCircleIcon
              width={20}
              height={20}
              color="currentColor"
              className="mt-0.5 flex-shrink-0"
            />
            <p className="text-sm font-medium">
              Complete as informações abaixo para utilizar todas as
              funcionalidades:
            </p>
          </div>
          <ul className="ml-7 space-y-1">
            {missingFields.map((field) => (
              <li key={field} className="text-sm text-gray-600">
                • {getFieldDisplayName(field)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
