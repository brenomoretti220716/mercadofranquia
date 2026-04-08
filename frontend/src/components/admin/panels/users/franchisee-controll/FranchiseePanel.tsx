'use client'

import BaseModal from '@/src/components/ui/BaseModal'
import { Pagination } from '@/src/components/ui/Pagination'
import SearchBar from '@/src/components/ui/SearchBar'
import { useFranchises } from '@/src/hooks/franchises/useFranchises'
import { User } from '@/src/schemas/users/User'
import { getClientAuthCookie } from '@/src/utils/clientCookie'
import { truncateText } from '@/src/utils/truncateText'
import { parseAsInteger, useQueryState } from 'nuqs'
import { useCallback, useMemo, useState } from 'react'
import FranchiseeEditing from './FranchiseeEditing'
import FranchiseeUsersTable from './franchiseeUsersTable/FranchiseeUsersTable'
import FranchiseeUsersTableHeader from './franchiseeUsersTable/FranchiseeUsersTableHeader'
import FranchiseeUsersTableBody from './franchiseeUsersTable/FranchiseeUsersTableBody'
import FranchiseeUsersTableRow from './franchiseeUsersTable/FranchiseeUsersTableRow'
import { useUsersPaginated } from '@/src/hooks/users/useUsersPaginated'
import { Franchise } from '@/src/schemas/franchises/Franchise'

export default function FranchiseePanel() {
  const [isEditingModal, setIsEditingModal] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useQueryState('search', {
    defaultValue: '',
    history: 'push',
  })
  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({ history: 'push' }),
  )
  const limit = 10
  const token = getClientAuthCookie()
  const [selectedUser, setSelectedUser] = useState<User>()

  const { isError: hasErrorFranchises, error: franchisesError } =
    useFranchises()

  const { data: apiData, refetch } = useUsersPaginated({
    role: 'members',
    page,
    limit,
    search,
    token: token ?? '',
  })

  const users: User[] = apiData?.data
  const total = apiData?.total || 0

  const sortUsersAlphabetically = useCallback((userList: User[]): User[] => {
    return [...userList].sort((a, b) => {
      const nameA = (a.name || '').toLowerCase()
      const nameB = (b.name || '').toLowerCase()
      return nameA.localeCompare(nameB)
    })
  }, [])

  const filteredUsers = useMemo(() => {
    const sortedUsers = sortUsersAlphabetically(users)

    if (search.trim() === '') {
      return sortedUsers
    }

    const searchLower = search.toLowerCase()
    const filtered = users.filter((user) => {
      const name = (user.name || '').toLowerCase()
      const email = (user.email || '').toLowerCase()
      const city = (user.profile?.city || '').toLowerCase()
      const role = (user.role || '').toLowerCase()
      const status = user.isActive ? 'ativo' : 'inativo'

      const franchiseSearch = (user.franchiseeOf || [])
        .map((franchise) => {
          if (typeof franchise === 'object' && franchise !== null) {
            const franchiseObj = franchise as Franchise

            return [
              franchiseObj.id || '',
              franchiseObj.name || '',
              franchiseObj.segment || '',
              franchiseObj.subsegment || '',
            ]
              .join(' ')
              .toLowerCase()
          }
          return String(franchise).toLowerCase()
        })
        .join(' ')

      return (
        name.includes(searchLower) ||
        email.includes(searchLower) ||
        city.includes(searchLower) ||
        role.includes(searchLower) ||
        status.includes(searchLower) ||
        franchiseSearch.includes(searchLower)
      )
    })

    return sortUsersAlphabetically(filtered)
  }, [users, search, sortUsersAlphabetically])

  const handleEditingModal = (user: User) => {
    setSelectedUser(user)
    setIsEditingModal(true)
  }

  const handleCloseEditingModal = () => {
    setIsEditingModal(false)
  }

  const renderFranchises = useCallback(
    (franchiseeOf: Franchise[] | undefined) => {
      if (!franchiseeOf || franchiseeOf.length === 0) {
        return (
          <div className="flex justify-center">
            <span className="text-gray-500 text-xs">Nenhuma</span>
          </div>
        )
      }

      const franchiseNames = franchiseeOf
        .map((franchise) => {
          if (typeof franchise === 'object' && franchise !== null) {
            return franchise.name || franchise.id || 'Sem nome'
          }
          return String(franchise)
        })
        .filter(Boolean)
        .filter((name) => name !== 'null' && name !== 'undefined')

      if (franchiseNames.length === 0) {
        return (
          <div className="flex justify-center">
            <span className="text-gray-500 text-xs">Dados inválidos</span>
          </div>
        )
      }

      const allFranchisesText = franchiseNames.join(', ')

      return (
        <div className="flex flex-wrap gap-1 justify-center items-center max-w-[180px] mx-auto">
          {franchiseNames.slice(0, 2).map((franchiseName, index) => (
            <span
              key={`${franchiseName}-${index}`}
              className="inline-flex items-center px-2 py-1 bg-[#E4AC9E] text-white text-xs rounded-sm"
              title={String(franchiseName)}
            >
              {truncateText(franchiseName, 10)}
            </span>
          ))}
          {franchiseNames.length > 2 && (
            <span
              title={allFranchisesText}
              className="text-xs text-gray-500 cursor-help"
            >
              +{franchiseNames.length - 2} mais
            </span>
          )}
        </div>
      )
    },
    [],
  )

  const refreshUserList = useCallback(async () => {
    await refetch()
  }, [refetch])

  // Loading/Erro tratados via Suspense/ErrorBoundary

  if (hasErrorFranchises) {
    console.warn('Erro ao carregar franquias para modais:', franchisesError)
  }

  return (
    <>
      <div id="franchisee-panel" className="flex m-10 w-auto flex-col">
        <h2 className="text-2xl font-medium">Usuário Membro</h2>

        {hasErrorFranchises && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-yellow-800 text-sm">
              ⚠️ Não foi possível carregar as informações das franquias para
              edição. A listagem funcionará normalmente.
            </p>
          </div>
        )}

        <div className="flex flex-row justify-between items-center my-5">
          <div className="relative w-[40vw]">
            <SearchBar
              searchInput={searchInput}
              setSearchInput={setSearchInput}
              setSearchTerm={setSearch}
              setPage={setPage}
            />
          </div>
        </div>

        <BaseModal
          tittleText="Edição de Usuário Membro"
          subtittleText="Use os acordeões abaixo para editar as informações básicas e de perfil do usuário. Você também pode ativar ou desativar o status do usuário usando o botão de alternância."
          isOpen={isEditingModal}
          onClose={handleCloseEditingModal}
        >
          <FranchiseeEditing
            onSuccess={refreshUserList}
            onClose={handleCloseEditingModal}
            user={selectedUser}
          />
        </BaseModal>

        <FranchiseeUsersTableHeader />

        <FranchiseeUsersTable>
          <FranchiseeUsersTableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <FranchiseeUsersTableRow
                  key={user.id}
                  user={user}
                  onEditClick={handleEditingModal}
                  renderFranchises={renderFranchises}
                />
              ))
            ) : (
              <tr className="bg-[#f6f6f9] border-b border-gray-200">
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <div className="text-gray-400 mb-2">
                      <svg
                        className="w-12 h-12"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                        />
                      </svg>
                    </div>
                    <div className="text-lg font-medium text-gray-600 mb-1">
                      {search.trim()
                        ? 'Nenhum usuário encontrado'
                        : 'Nenhum usuário cadastrado'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {search.trim()
                        ? `Sua pesquisa por "${search}" não retornou resultados.`
                        : 'Não há usuários franchisees cadastrados no sistema.'}
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </FranchiseeUsersTableBody>
        </FranchiseeUsersTable>
        <div className="flex mt-10">
          <Pagination
            page={page}
            total={total}
            limit={limit}
            onPageChange={setPage}
            scrollToId="franchisee-panel"
            scrollMarginTop={88}
          />
        </div>
      </div>
    </>
  )
}
