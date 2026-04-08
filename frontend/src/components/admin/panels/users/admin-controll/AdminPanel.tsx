'use client'

import BaseModal from '@/src/components/ui/BaseModal'
import { Pagination } from '@/src/components/ui/Pagination'
import RoundedButton from '@/src/components/ui/RoundedButton'
import SearchBar from '@/src/components/ui/SearchBar'
import { useUsersPaginated } from '@/src/hooks/users/useUsersPaginated'
import { User } from '@/src/schemas/users/User'
import { getClientAuthCookie } from '@/src/utils/clientCookie'
import { parseAsInteger, useQueryState } from 'nuqs'
import { useCallback, useState } from 'react'
import AdminEditing from './AdminEditing'
import AdminRegister from './AdminRegister'
import AdminUsersTable from './adminUsersTable/AdminUsersTable'
import AdminUsersTableBody from './adminUsersTable/AdminUsersTableBody'
import AdminUsersTableHeader from './adminUsersTable/AdminUsersTableHeader'
import AdminUsersTableRow from './adminUsersTable/AdminUsersTableRow'

export default function AdminPanel() {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
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

  const { data: apiData, refetch } = useUsersPaginated({
    role: 'admin',
    page,
    limit,
    search,
    token: token ?? '',
  })

  const users: User[] = apiData?.data || []
  const total = apiData?.total || 0

  const handleRegisterModal = () => {
    setIsRegisterModalOpen(true)
  }

  const handleCloseRegisterModal = () => {
    setIsRegisterModalOpen(false)
  }

  const handleEditingModal = (user: User) => {
    setSelectedUser(user)
    setIsEditingModal(true)
  }

  const handleCloseEditingModal = () => {
    setIsEditingModal(false)
  }

  const refreshUserList = useCallback(async () => {
    await refetch()
  }, [refetch])

  return (
    <>
      <div id="admin-panel" className="flex m-5 md:m-10 w-auto flex-col">
        <h2 className="text-2xl font-medium mb-4">Usuário administrador</h2>
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
              color="#000000"
              hoverColor="#E25E3E"
              text="+ Novo usuário"
              textColor="white"
              onClick={handleRegisterModal}
            />
          </div>
        </div>

        <BaseModal
          tittleText="Cadastro de usuário - Administrador"
          subtittleText="Você está cadastrando um usuário Administrador. Ele terá acesso a todas as funcionalidades e informações do painel administrativo."
          isOpen={isRegisterModalOpen}
          onClose={handleCloseRegisterModal}
        >
          <AdminRegister
            onSuccess={refreshUserList}
            onClose={handleCloseRegisterModal}
          />
        </BaseModal>

        <BaseModal
          tittleText="Edição de usuário - Administrador"
          subtittleText="Você está editando um usuário Administrador. Ele receberá uma notificação por e-mail informando que os dados de acesso foram alterados."
          isOpen={isEditingModal}
          onClose={handleCloseEditingModal}
        >
          <AdminEditing
            onSuccess={refreshUserList}
            onClose={handleCloseEditingModal}
            user={selectedUser}
          />
        </BaseModal>

        <div className="overflow-x-auto [&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-500">
          <AdminUsersTable>
            <AdminUsersTableHeader />
            <AdminUsersTableBody>
              {users.length > 0 ? (
                users.map((user) => (
                  <AdminUsersTableRow
                    key={user.id}
                    user={user}
                    onEditClick={handleEditingModal}
                  />
                ))
              ) : (
                <tr className="bg-[#f6f6f9] border-b border-gray-200">
                  <td
                    colSpan={5}
                    className="px-3 md:px-6 py-4 text-center text-gray-500"
                  >
                    {search
                      ? `Nenhum usuário encontrado para "${search}"`
                      : 'Nenhum usuário encontrado'}
                  </td>
                </tr>
              )}
            </AdminUsersTableBody>
          </AdminUsersTable>
        </div>
        {/* Paginação visual */}
        <div className="flex mt-10">
          <Pagination
            page={page}
            total={total}
            limit={limit}
            onPageChange={setPage}
            scrollToId="admin-panel"
            scrollMarginTop={88}
          />
        </div>
      </div>
    </>
  )
}
