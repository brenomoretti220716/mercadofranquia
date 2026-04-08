'use client'

import BaseModal from '@/src/components/ui/BaseModal'
import { Pagination } from '@/src/components/ui/Pagination'
import RoundedButton from '@/src/components/ui/RoundedButton'
import SearchBar from '@/src/components/ui/SearchBar'
import { useFranchises } from '@/src/hooks/franchises/useFranchises'
import { useAllFranchisorRequests } from '@/src/hooks/users/useFranchisorRequest'
import { useUsersPaginated } from '@/src/hooks/users/useUsersPaginated'
import { Franchise } from '@/src/schemas/franchises/Franchise'
import {
  FranchisorRequest,
  FranchisorRequestStatus,
} from '@/src/schemas/users/FranchisorRequest'
import { User } from '@/src/schemas/users/User'
import { getClientAuthCookie } from '@/src/utils/clientCookie'
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs'
import { useCallback, useMemo, useState } from 'react'
import FranchisorEditing from './FranchisorEditing'
import FranchisorRegister from './FranchisorRegister'
import FranchisorRequestModal from './FranchisorRequestModal'
import FranchisorRequestsTable from './franchisorRequestsTable/FranchisorRequestsTable'
import FranchisorRequestsTableBody from './franchisorRequestsTable/FranchisorRequestsTableBody'
import FranchisorRequestsTableHeader from './franchisorRequestsTable/FranchisorRequestsTableHeader'
import FranchisorRequestsTableRow from './franchisorRequestsTable/FranchisorRequestsTableRow'
import FranchisorUsersTable from './franchisorUsersTable/FranchisorUsersTable'
import FranchisorUsersTableBody from './franchisorUsersTable/FranchisorUsersTableBody'
import FranchisorUsersTableHeader from './franchisorUsersTable/FranchisorUsersTableHeader'
import FranchisorUsersTableRow from './franchisorUsersTable/FranchisorUsersTableRow'

export default function FranchisorsPanel() {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [isEditingModal, setIsEditingModal] = useState(false)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [searchInput, setSearchInput] = useQueryState(
    'search',
    parseAsString.withDefault(''),
  )
  const [search, setSearch] = useState(searchInput)
  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({ history: 'push' }),
  )
  const limit = 10
  const [selectedUser, setSelectedUser] = useState<User>()
  const [selectedRequest, setSelectedRequest] =
    useState<FranchisorRequest | null>(null)
  const token = getClientAuthCookie()

  const { isError: hasErrorFranchises, error: franchisesError } =
    useFranchises()

  const { data: requestsData, refetch: refetchRequests } =
    useAllFranchisorRequests()
  const allRequests: FranchisorRequest[] = requestsData || []

  const pendingRequests = allRequests.filter(
    (request) =>
      request.status === FranchisorRequestStatus.PENDING ||
      request.status === FranchisorRequestStatus.UNDER_REVIEW,
  )

  const { data: apiData, refetch } = useUsersPaginated({
    role: 'franchisor',
    page,
    limit,
    search,
    token: token ?? '',
  })

  const users: User[] = apiData?.data
  const total = apiData?.total || 0

  const sortUsersAlphabetically = useCallback((userList?: User[]): User[] => {
    return [...(userList || [])].sort((a, b) => {
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
    const filtered = (users || []).filter((user: User) => {
      const name = (user.name || '').toLowerCase()
      const email = (user.email || '').toLowerCase()
      const cpfCnpj = (user.cpf || '').toLowerCase()
      const franchiseIdsString = (user.ownedFranchises || [])
        .map((franchise: Franchise) => franchise.id)
        .join(' ')
        .toLowerCase()
      const franchiseNamesString = (user.ownedFranchises || [])
        .map((franchise: Franchise) =>
          franchise && franchise.name ? franchise.name.toLowerCase() : '',
        )
        .join(' ')

      return (
        name.includes(searchLower) ||
        email.includes(searchLower) ||
        cpfCnpj.includes(searchLower) ||
        franchiseIdsString.includes(searchLower) ||
        franchiseNamesString.includes(searchLower)
      )
    })
    return sortUsersAlphabetically(filtered)
  }, [users, search, sortUsersAlphabetically])

  const handleRegisterModal = () => {
    setIsRegisterModalOpen(true)
  }

  const handleRegisterCloseModal = () => {
    setIsRegisterModalOpen(false)
  }

  const handleEditingModal = (user: User) => {
    setSelectedUser(user)
    setIsEditingModal(true)
  }

  const handleCloseEditingModal = () => {
    setIsEditingModal(false)
  }

  const handleViewRequest = (request: FranchisorRequest) => {
    setSelectedRequest(request)
    setIsRequestModalOpen(true)
  }

  const handleCloseRequestModal = () => {
    setIsRequestModalOpen(false)
    setSelectedRequest(null)
  }

  const handleRequestSuccess = async () => {
    await refetchRequests()
    await refetch()
  }

  const truncateText = useCallback(
    (text: string | number | null | undefined, maxLength: number): string => {
      const textStr = String(text || '')
      if (!textStr || textStr === 'null' || textStr === 'undefined')
        return 'N/A'
      if (textStr.length <= maxLength) return textStr
      return textStr.substring(0, maxLength) + '...'
    },
    [],
  )

  const renderFranchises = useCallback(
    (franchises: Franchise[] | undefined) => {
      if (!franchises || franchises.length === 0) {
        return (
          <div className="flex justify-center">
            <span className="text-gray-500 text-xs">Nenhuma</span>
          </div>
        )
      }
      const franchiseNames = franchises
        .map((franchise) =>
          franchise.name ? String(franchise.name) : String(franchise.id),
        )
        .filter(Boolean)
        .filter((name) => name !== 'null' && name !== 'undefined')
      if (franchiseNames.length === 0) {
        return (
          <div className="flex justify-center">
            <span className="text-gray-500 text-xs">Erro nos dados</span>
          </div>
        )
      }
      const allFranchisesText = franchiseNames.join(', ')
      return (
        <div className="flex flex-wrap gap-1 justify-center items-center max-w-[200px] mx-auto">
          {franchiseNames.slice(0, 2).map((franchiseName, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 bg-[#E4AC9E] text-black text-xs rounded-sm"
              title={franchiseName}
            >
              {truncateText(franchiseName, 12)}
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
    [truncateText],
  )

  const refreshUserList = useCallback(async () => {
    await refetch()
  }, [refetch])

  if (hasErrorFranchises) {
    console.warn('Erro ao carregar franquias para modais:', franchisesError)
  }

  return (
    <>
      <div className="flex m-5 md:m-10 w-auto flex-col mb-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-medium">
              Solicitações de Franqueador
            </h2>
            <p className="text-sm text-orange-600">
              {pendingRequests.length}{' '}
              {pendingRequests.length === 1 ? 'solicitação' : 'solicitações'}{' '}
              aguardando aprovação
            </p>
          </div>
        </div>

        <div className="overflow-x-auto [&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-500">
          <FranchisorRequestsTable>
            <FranchisorRequestsTableHeader />
            <FranchisorRequestsTableBody>
              {pendingRequests.map((request) => (
                <FranchisorRequestsTableRow
                  key={request.id}
                  request={request}
                  onViewClick={handleViewRequest}
                />
              ))}
            </FranchisorRequestsTableBody>
          </FranchisorRequestsTable>
        </div>
      </div>

      <FranchisorRequestModal
        isOpen={isRequestModalOpen}
        onClose={handleCloseRequestModal}
        request={selectedRequest}
        onSuccess={handleRequestSuccess}
      />

      <div
        id="franchisors-panel"
        className="flex m-5 md:m-10 w-auto flex-col mb-8"
      >
        <h2 className="text-2xl font-medium mb-4">Usuário Franqueador</h2>
        {hasErrorFranchises && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-yellow-800 text-sm">
              ⚠️ Não foi possível carregar as informações das franquias para
              cadastro/edição. A listagem funcionará normalmente.
            </p>
          </div>
        )}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <div className="relative w-full md:w-[40vw]">
            <SearchBar
              searchInput={searchInput}
              setSearchInput={setSearchInput}
              setSearchTerm={setSearch}
              setPage={setPage}
            />
          </div>
          <div className="flex items-end w-full md:w-auto">
            <RoundedButton
              color="white"
              hoverColor="#E25E3E"
              text="+ Novo usuário"
              textColor="#555"
              disabled={true}
              onClick={handleRegisterModal}
            />
          </div>
        </div>
        <BaseModal
          tittleText="Cadastro de usuário - Franqueador"
          subtittleText="Após o cadastro o usuário receberá uma notificação por e-mail informando que os dados de acesso foram alterados."
          isOpen={isRegisterModalOpen}
          onClose={handleRegisterCloseModal}
        >
          <FranchisorRegister
            onSuccess={refreshUserList}
            onClose={handleRegisterCloseModal}
          />
        </BaseModal>
        <BaseModal
          tittleText="Edição de usuário - Franqueador"
          subtittleText="Após a edição o usuário receberá uma notificação por e-mail informando que os dados de acesso foram alterados."
          isOpen={isEditingModal}
          onClose={handleCloseEditingModal}
        >
          <FranchisorEditing
            onSuccess={refreshUserList}
            onClose={handleCloseEditingModal}
            user={selectedUser}
          />
        </BaseModal>
        <div className="overflow-x-auto [&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-500">
          <FranchisorUsersTableHeader />
          <FranchisorUsersTable>
            <FranchisorUsersTableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <FranchisorUsersTableRow
                    key={user.id}
                    user={user}
                    onEditClick={handleEditingModal}
                    truncateText={truncateText}
                    renderFranchises={renderFranchises}
                  />
                ))
              ) : (
                <tr className="bg-[#f6f6f9] border-b border-gray-200">
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    {search
                      ? `Nenhum usuário encontrado para "${search}"`
                      : 'Nenhum usuário encontrado'}
                  </td>
                </tr>
              )}
            </FranchisorUsersTableBody>
          </FranchisorUsersTable>
        </div>

        <div className="flex mt-10">
          <Pagination
            page={page}
            total={total}
            limit={limit}
            onPageChange={setPage}
            scrollToId="franchisors-panel"
            scrollMarginTop={88}
          />
        </div>
      </div>
    </>
  )
}
