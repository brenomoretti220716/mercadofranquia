'use client'

import { useRouter } from 'next/navigation'
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  useQueryState,
} from 'nuqs'
import { useState } from 'react'

import BaseModal from '@/src/components/ui/BaseModal'
import { Pagination } from '@/src/components/ui/Pagination'
import RoundedButton from '@/src/components/ui/RoundedButton'
import SearchBar from '@/src/components/ui/SearchBar'
import { useAdminRankingPaginated } from '@/src/hooks/franchises/useRanking'
import { getClientAuthCookie } from '@/src/utils/clientCookie'

import EditFranchise from './EditFranchise'
import RegisterFranchise from './RegisterFranchise'
import AdminFranchiseTable from './adminFranchiseTable/AdminFranchiseTable'
import AdminFranchiseTableBody from './adminFranchiseTable/AdminFranchiseTableBody'
import AdminFranchiseTableHeader from './adminFranchiseTable/AdminFranchiseTableHeader'
import AdminFranchiseTableRow from './adminFranchiseTable/AdminFranchiseTableRow'

import type { Franchise } from '@/src/schemas/franchises/Franchise'

export default function AdminFranchisePanel() {
  const router = useRouter()
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useQueryState(
    'isRegisterModalOpen',
    parseAsBoolean.withDefault(false),
  )
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false)
  const [selectedFranchise, setSelectedFranchise] = useState<Franchise>()
  const [searchInput, setSearchInput] = useQueryState(
    'search',
    parseAsString.withDefault(''),
  )
  const [searchTerm, setSearchTerm] = useState(searchInput)
  const [pageQuery, setPageQuery] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({ history: 'push' }),
  )
  const limit = 10
  const token = getClientAuthCookie() || ''

  const { franchises, total, page, totalSponsored } = useAdminRankingPaginated({
    page: pageQuery,
    limit,
    search: searchTerm,
    token,
  })

  const handleRegisterModal = () => {
    setIsRegisterModalOpen(true)
  }

  const handleRegisterCloseModal = () => {
    setIsRegisterModalOpen(false)
  }

  const handleEditingModal = (franchise: Franchise) => {
    setSelectedFranchise(franchise)
    setIsEditingModalOpen(true)
  }

  const handleCloseEditingModal = () => {
    setIsEditingModalOpen(false)
    setSelectedFranchise(undefined)
  }

  const handleViewFranchise = (franchiseId: string) => {
    router.push(`/admin/franquias/${franchiseId}`)
  }

  const handleImportSuccess = () => {
    setIsRegisterModalOpen(false)
  }

  const handleEditSuccess = () => {
    setIsEditingModalOpen(false)
    setSelectedFranchise(undefined)
  }

  return (
    <>
      <div
        id="admin-franchise-panel"
        className="flex m-5 md:m-10 w-auto flex-col"
      >
        <div className="flex flex-wrap items-baseline gap-4 mb-4">
          <h2 className="text-2xl font-medium">Painel de Franquias</h2>
          {typeof totalSponsored === 'number' && (
            <span className="inline-flex items-center rounded-full border border-[#E25E3E]/50 bg-[#E4AC9E]/20 px-3 py-1 text-sm font-semibold text-gray-700 tabular-nums">
              Patrocinados {totalSponsored} / 5
            </span>
          )}
          <RoundedButton
            color="#E25E3E"
            hoverColor="#000000"
            text="Gerenciar Patrocinados"
            textColor="white"
            onClick={() => router.push('/admin/patrocinados')}
          />
          <RoundedButton
            color="#E25E3E"
            hoverColor="#000000"
            text="Gerenciar BigNumbers"
            textColor="white"
            onClick={() => router.push('/admin/big-numbers')}
          />
        </div>
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <div className="flex flex-col gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-[40vw]">
              <SearchBar
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                setSearchTerm={setSearchTerm}
                setPage={setPageQuery}
              />
            </div>
          </div>

          <div className="flex items-end w-full md:w-auto">
            <RoundedButton
              color="#000000"
              hoverColor="#E25E3E"
              text="+ Atualização da listagem"
              textColor="white"
              onClick={handleRegisterModal}
            />
          </div>
        </div>

        <BaseModal
          tittleText="Importar Franquias"
          subtittleText="Faça upload de um arquivo CSV para importar franquias em lote."
          isOpen={isRegisterModalOpen}
          onClose={handleRegisterCloseModal}
        >
          <RegisterFranchise onSuccess={handleImportSuccess} />
        </BaseModal>

        <BaseModal
          tittleText="Gerenciar Franquia"
          subtittleText="Atualize os dados da franquia via CSV ou altere seu status de ativação."
          isOpen={isEditingModalOpen}
          onClose={handleCloseEditingModal}
        >
          {selectedFranchise && (
            <EditFranchise
              franchise={selectedFranchise}
              onSuccess={handleEditSuccess}
              totalSponsored={totalSponsored}
            />
          )}
        </BaseModal>

        <div className="overflow-x-auto [&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-500">
          <AdminFranchiseTable>
            <AdminFranchiseTableHeader />
            <AdminFranchiseTableBody>
              {franchises.length > 0 ? (
                franchises.map((franchise: Franchise, index: number) => (
                  <AdminFranchiseTableRow
                    key={franchise.id}
                    franchise={franchise}
                    onRowClick={handleViewFranchise}
                    onEditClick={handleEditingModal}
                    previousFranchise={
                      index > 0 ? franchises[index - 1] : undefined
                    }
                    nextFranchise={
                      index < franchises.length - 1
                        ? franchises[index + 1]
                        : undefined
                    }
                  />
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    {searchInput
                      ? 'Nenhuma franquia encontrada para a pesquisa.'
                      : 'Nenhuma franquia cadastrada.'}
                  </td>
                </tr>
              )}
            </AdminFranchiseTableBody>
          </AdminFranchiseTable>
        </div>
        <div className="flex mt-10">
          <Pagination
            page={page}
            total={total}
            limit={limit}
            onPageChange={setPageQuery}
            scrollToId="admin-franchise-panel"
            scrollMarginTop={88}
          />
        </div>
      </div>
    </>
  )
}
