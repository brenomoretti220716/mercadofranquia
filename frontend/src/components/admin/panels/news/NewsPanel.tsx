'use client'

import BaseModal from '@/src/components/ui/BaseModal'
import { Pagination } from '@/src/components/ui/Pagination'
import RoundedButton from '@/src/components/ui/RoundedButton'
import SearchBar from '@/src/components/ui/SearchBar'
import { getNewsCategoryByValue } from '@/src/constants/newsCategories'
import { useNews } from '@/src/hooks/news/useNews'
import { NewsSchema } from '@/src/schemas/users/News'
import { formatDateTimeToBrazilian } from '@/src/utils/dateFormatters'
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs'
import { useCallback, useState } from 'react'
import NewsEditing from './NewsEditing'
import NewsRegister from './NewsRegister'
import NewsTable from './newsTable/NewsTable'
import NewsTableBody from './newsTable/NewsTableBody'
import NewsTableHeader from './newsTable/NewsTableHeader'
import NewsTableRow from './newsTable/NewsTableRow'

export default function NewsPanel() {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [isEditingModal, setIsEditingModal] = useState(false)
  const [selectedNews, setSelectedNews] = useState<NewsSchema | undefined>(
    undefined,
  )
  const [searchInput, setSearchInput] = useQueryState(
    'search',
    parseAsString.withDefault(''),
  )
  const [searchTerm, setSearchTerm] = useState(searchInput)

  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({ history: 'push' }),
  )
  const limit = 8

  const { data, refetch } = useNews({
    page,
    limit,
    search: searchTerm,
  })
  const news = data?.items || []
  const total = data?.total || 0

  const formatDate = formatDateTimeToBrazilian

  const handleRegisterModal = () => {
    setIsRegisterModalOpen(true)
  }

  const handleRegisterCloseModal = () => {
    setIsRegisterModalOpen(false)
  }

  const handleEditingModal = (newsItem: NewsSchema) => {
    setSelectedNews({
      title: newsItem.title ?? '',
      category: newsItem.category ?? '',
      summary: newsItem.summary ?? '',
      content: newsItem.content ?? '',
      photoUrl: newsItem.photoUrl ?? '',
      isActive: newsItem.isActive ?? true,
      id: newsItem.id ?? '',
      createdAt: newsItem.createdAt,
      updatedAt: newsItem.updatedAt,
      createdBy: newsItem.createdBy,
    })
    setIsEditingModal(true)
  }

  const handleCloseEditingModal = () => {
    setIsEditingModal(false)
  }

  const renderCategory = useCallback((category: string | undefined) => {
    if (!category) {
      return (
        <div className="flex justify-center">
          <span className="text-gray-500 text-xs">Sem categoria</span>
        </div>
      )
    }

    const colorClass =
      getNewsCategoryByValue(category)?.colorClass ||
      'bg-gray-100 text-gray-800'
    const label =
      getNewsCategoryByValue(category)?.label ||
      `${category.charAt(0).toUpperCase()}${category.slice(1)}`

    return (
      <div className="flex justify-center">
        <span
          className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${colorClass}`}
        >
          {label}
        </span>
      </div>
    )
  }, [])

  const refreshNewsList = useCallback(async () => {
    await refetch()
  }, [refetch])

  // Loading/Erro tratados via Suspense/ErrorBoundary da rota

  return (
    <>
      <div id="admin-news-panel" className="flex m-10 w-auto flex-col">
        <h2 className="text-2xl font-medium">Painel de Notícias</h2>
        <div className="flex flex-row justify-between items-center my-5">
          <div className="relative w-[40vw]">
            <SearchBar
              searchInput={searchInput}
              setSearchInput={setSearchInput}
              setSearchTerm={setSearchTerm}
              setPage={setPage}
            />
          </div>

          <RoundedButton
            color="#000000"
            hoverColor="#E25E3E"
            text="+ Nova notícia"
            textColor="white"
            onClick={handleRegisterModal}
          />
        </div>

        <BaseModal
          tittleText="Cadastro de Notícia"
          subtittleText="Após o cadastro a notícia será refletida imediatamente no site."
          isOpen={isRegisterModalOpen}
          onClose={handleRegisterCloseModal}
        >
          <NewsRegister
            onClose={handleRegisterCloseModal}
            onSuccess={refreshNewsList}
          />
        </BaseModal>

        <BaseModal
          tittleText="Edição de Notícia"
          subtittleText="Após a edição a notícia será refletida imediatamente no site."
          isOpen={isEditingModal}
          onClose={handleCloseEditingModal}
        >
          {selectedNews && (
            <NewsEditing
              onClose={handleCloseEditingModal}
              onSuccess={refreshNewsList}
              news={{
                title: selectedNews.title ?? '',
                category: selectedNews.category ?? '',
                summary: selectedNews.summary ?? '',
                content: selectedNews.content ?? '',
                photoUrl: selectedNews.photoUrl ?? '',
                isActive: selectedNews.isActive ?? true,
                id: selectedNews.id ?? '',
                createdAt: selectedNews.createdAt,
                updatedAt: selectedNews.updatedAt,
                createdBy: selectedNews.createdBy,
              }}
            />
          )}
        </BaseModal>

        <NewsTableHeader />

        <NewsTable>
          <NewsTableBody>
            {news.length > 0 ? (
              news.map((newsItem) => {
                const safeNewsItem = {
                  ...newsItem,
                  title: newsItem.title ?? '',
                  category: newsItem.category ?? '',
                  summary: newsItem.summary ?? '',
                  content: newsItem.content ?? '',
                  photoUrl: newsItem.photoUrl ?? '',
                  isActive: newsItem.isActive ?? true,
                  id: newsItem.id ?? '',
                }
                return (
                  <NewsTableRow
                    key={safeNewsItem.id}
                    newsItem={safeNewsItem}
                    onEditClick={handleEditingModal}
                    formatDate={formatDate}
                    renderCategory={renderCategory}
                  />
                )
              })
            ) : (
              <tr className="bg-[#f6f6f9] border-b border-gray-200">
                <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                  {searchTerm
                    ? `Nenhuma notícia encontrada para "${searchTerm}"`
                    : 'Nenhuma notícia encontrada'}
                </td>
              </tr>
            )}
          </NewsTableBody>
        </NewsTable>
        <div className="flex mt-10">
          <Pagination
            page={page}
            total={total}
            limit={limit}
            onPageChange={setPage}
            scrollToId="admin-news-panel"
            scrollMarginTop={88}
          />
        </div>
      </div>
    </>
  )
}
