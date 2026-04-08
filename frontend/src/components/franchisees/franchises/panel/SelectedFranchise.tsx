'use client'

import dynamic from 'next/dynamic'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useContext, useState } from 'react'

import MediaCarousel from '@/src/components/ui/MediaCarousel'
import ModalIncompleteProfile from '@/src/components/ui/ModalIncompleteProfile'
import ModalRedirectLogin from '@/src/components/ui/ModalRedirectLogin'
import VideoCarousel from '@/src/components/ui/VideoCarousel'
import { AuthContext } from '@/src/contexts/AuthContext'
import {
  sortDirectionToApi,
  useRankingFilters,
} from '@/src/contexts/RankingContext'
import {
  useCheckFavorite,
  useToggleFavorite,
} from '@/src/hooks/franchises/useFavoriteMutations'
import { useFranchiseRanking } from '@/src/hooks/franchises/useRanking'
import { formatDateToBrazilian } from '@/src/utils/dateFormatters'
import {
  hasValidImages,
  hasValidVideos,
  normalizeGalleryUrls,
} from '@/src/utils/franchiseImageUtils'

import HeaderRanking from '@/src/components/ranking/HeaderRanking'
import ModalRedirectSeccondStep from '@/src/components/ui/ModalRedirectSeccondStep'
import { BusinessModelsSkeleton } from '@/src/components/ui/skeletons/BusinessModelSkeleton'
import { CommentSectionSkeleton } from '@/src/components/ui/skeletons/CommentSectionSkeleton'
import { isMember, useAuth } from '@/src/hooks/users/useAuth'
import { useProfileCompletion } from '@/src/hooks/users/useProfileCompletion'

interface SelectedFranchiseProps {
  selectedFranchise?: string
}

const loadBusinessModelsSection = () =>
  import(
    '@/src/components/franchisors/panels/franchises/businessModels/BusinessModelsSection'
  )

const BusinessModelsSection = dynamic(loadBusinessModelsSection, {
  loading: () => <BusinessModelsSkeleton />,
})

const loadCommentPanel = () =>
  import('@/src/components/franchisees/franchises/comments/CommentPanel')

const CommentPanel = dynamic(loadCommentPanel, {
  loading: () => <CommentSectionSkeleton />,
})

export default function SelectedFranchise({
  selectedFranchise,
}: SelectedFranchiseProps) {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  // Dynamic segment in the route is `[franquia]`, so we read that param
  const franchiseSlug = (params?.franquia as string) || selectedFranchise || ''
  const searchTerm = searchParams.get('search') || ''

  const { isAuthenticated } = useContext(AuthContext)

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isIncompleteProfileModalOpen, setIsIncompleteProfileModalOpen] =
    useState(false)

  const {
    isByDesc,
    isByRatingAverage,
    isByUnits,
    isByInvestment,
    isByReturn,
    isByFranchiseFee,
    isByaverageMonthlyRevenue,
    valueFilters,
    buildUrl,
  } = useRankingFilters()

  const { franchise, nextFranchise, previousFranchise } = useFranchiseRanking({
    slug: franchiseSlug,
    search: searchTerm,
    nameSort: sortDirectionToApi(isByDesc),
    ratingSort: sortDirectionToApi(isByRatingAverage),
    unitsSort: sortDirectionToApi(isByUnits),
    investmentSort: sortDirectionToApi(isByInvestment),
    roiSort: sortDirectionToApi(isByReturn),
    franchiseFeeSort: sortDirectionToApi(isByFranchiseFee),
    revenueSort: sortDirectionToApi(isByaverageMonthlyRevenue),
    minInvestment: valueFilters.minInvestment,
    maxInvestment: valueFilters.maxInvestment,
    minROI: valueFilters.minROI,
    maxROI: valueFilters.maxROI,
    minFranchiseFee: valueFilters.minFranchiseFee,
    maxFranchiseFee: valueFilters.maxFranchiseFee,
    minRevenue: valueFilters.minRevenue,
    maxRevenue: valueFilters.maxRevenue,
    minUnits: valueFilters.minUnits,
    maxUnits: valueFilters.maxUnits,
    rating: valueFilters.rating,
    segment: valueFilters.segment,
  })

  const toggleFavorite = useToggleFavorite()
  const { data: favoriteData } = useCheckFavorite(
    franchiseSlug,
    isAuthenticated,
  )
  const isFavorited = favoriteData?.isFavorited || false

  const { payload } = useAuth()
  const { data: profileCompletion } = useProfileCompletion(isAuthenticated)
  const isValidMember = isMember(payload)

  const handleFavoriteClick = () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true)
      return
    }

    // Check if profile is complete
    if (profileCompletion && !profileCompletion.isComplete) {
      setIsIncompleteProfileModalOpen(true)
      return
    }

    if (isValidMember) {
      setIsMemberModalOpen(true)
      return
    }

    toggleFavorite.mutate(franchiseSlug)
  }

  const handleCancelModal = () => {
    setIsLoginModalOpen(false)
    setIsMemberModalOpen(false)
    setIsIncompleteProfileModalOpen(false)
  }

  const handleBackToRanking = () => {
    router.push('/ranking')
  }

  if (!franchise) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] m-10">
        <h2 className="text-foreground text-xl font-bold mb-2 text-center">
          Esta franquia não está disponível no momento.
        </h2>
        <p className="text-muted-foreground text-base mb-6 text-center max-w-xl">
          Ela pode ter sido desativada ou removida da plataforma.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Voltar para a página anterior
          </button>
          <button
            onClick={handleBackToRanking}
            className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            Ir para o ranking
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <HeaderRanking
        franchise={franchise}
        nextFranchise={nextFranchise}
        previousFranchise={previousFranchise}
        isFavorited={isFavorited}
        onFavoriteClick={handleFavoriteClick}
        isLoading={toggleFavorite.isPending}
        buildUrl={buildUrl}
      />

      <div className="flex flex-col m-4 sm:m-5 md:m-10 w-auto min-h-screen gap-4 md:gap-5">
        {/* Media Section - only show if at least one field exists */}
        {(hasValidImages(franchise.thumbnailUrl, franchise.galleryUrls) ||
          hasValidVideos(franchise.videoUrl)) && (
          <div className="flex flex-col lg:flex-row gap-4 md:gap-5">
            {/* Image Carousel - combines thumbnailUrl (first) + galleryUrls (rest) */}
            {hasValidImages(franchise.thumbnailUrl, franchise.galleryUrls) ? (
              <MediaCarousel
                images={[
                  ...(franchise.thumbnailUrl ? [franchise.thumbnailUrl] : []),
                  ...normalizeGalleryUrls(franchise.galleryUrls),
                ]}
                fallbackImage="/assets/banner.jpg"
                alt={franchise.name}
                className="w-full"
              />
            ) : (
              <MediaCarousel
                images={[]}
                fallbackImage="/assets/banner.jpg"
                alt={franchise.name}
                className="w-full"
              />
            )}

            {/* Video Frame */}
            {hasValidVideos(franchise.videoUrl) ? (
              <VideoCarousel
                videos={franchise.videoUrl}
                title={`Vídeo da ${franchise.name}`}
                className="w-full"
                posterSrc={franchise.thumbnailUrl}
                fallbackImage="/assets/banner.jpg"
              />
            ) : (
              <VideoCarousel
                videos={null}
                title={`Vídeo da ${franchise.name}`}
                className="w-full"
                posterSrc={franchise.thumbnailUrl}
                fallbackImage="/assets/banner.jpg"
              />
            )}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 md:gap-5">
          {/* Card Principal */}
          <div className="flex flex-col w-full bg-white rounded-2xl shadow-sm border border-border/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className="flex flex-col p-5 sm:p-6 md:p-10 gap-4 md:gap-5">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                {franchise.name}
              </h2>

              <div className="flex flex-col">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                  Valor investimento
                </h3>
                <p className="font-normal text-sm sm:text-base text-muted-foreground">
                  {franchise.minimumInvestment || 'Não informado'}
                </p>
              </div>

              <div className="flex flex-col">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                  Estado Sede
                </h3>
                <p className="font-normal text-sm sm:text-base text-muted-foreground">
                  {franchise.headquarterState || 'Não informado'}
                </p>
              </div>

              <div className="flex flex-col">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                  Número de Unidades
                </h3>
                <p className="font-normal text-sm sm:text-base text-muted-foreground">
                  {franchise.totalUnits?.toLocaleString('pt-BR') ||
                    'Não informado'}
                </p>
              </div>

              <div className="flex flex-col">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                  Segmento de atuação da franquia
                </h3>
                <p className="font-normal text-sm sm:text-base text-muted-foreground">
                  {franchise.segment || 'Não informado'}
                </p>
              </div>

              <div className="flex flex-col">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                  Subsegmento primário
                </h3>
                <p className="font-normal text-sm sm:text-base text-muted-foreground">
                  {franchise.subsegment || 'Não informado'}
                </p>
              </div>

              <div className="flex flex-col">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                  Tipo de Negócio
                </h3>
                <p className="font-normal text-sm sm:text-base text-muted-foreground">
                  {franchise.businessType || 'Não informado'}
                </p>
              </div>
            </div>
          </div>

          {/* SideCard */}
          <div className="flex flex-col w-full gap-4 md:gap-5">
            {/* SideCard Top */}
            <div className="flex flex-col w-full h-auto bg-white p-5 sm:p-6 md:p-10 rounded-2xl shadow-sm border border-border/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Sobre o negócio
              </h2>

              <div className="flex flex-col mt-4 md:mt-5">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                  Fundação
                </h3>
                <p className="font-normal text-sm sm:text-base text-muted-foreground">
                  {franchise.brandFoundationYear || 'Não informado'}
                </p>
              </div>

              <div className="flex flex-col mt-4 md:mt-5">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                  Início da franquia
                </h3>
                <p className="font-normal text-sm sm:text-base text-muted-foreground">
                  {franchise.franchiseStartYear || 'Não informado'}
                </p>
              </div>

              <div className="flex flex-col mt-4 md:mt-5">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                  Associada ABF desde
                </h3>
                <p className="font-normal text-sm sm:text-base text-muted-foreground">
                  {franchise.abfSince || 'Não informado'}
                </p>
              </div>
            </div>

            {/* SideCard Bottom */}
            <div className="flex flex-col w-full h-auto bg-white p-5 sm:p-6 md:p-10 rounded-2xl shadow-sm border border-border/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex flex-col">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  Informações de contato
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Última atualização pela franquia:{' '}
                  {formatDateToBrazilian(franchise.updatedAt)}
                </p>
              </div>

              {franchise.contact ? (
                <>
                  <div className="flex flex-col mt-4 md:mt-5">
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                      Telefone
                    </h3>
                    <p className="font-normal text-sm sm:text-base text-muted-foreground">
                      {franchise.contact.phone || 'Não informado'}
                    </p>
                  </div>

                  <div className="flex flex-col mt-4 md:mt-5">
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                      E-mail
                    </h3>
                    <p className="font-normal text-sm sm:text-base text-muted-foreground">
                      {franchise.contact.email || 'Não informado'}
                    </p>
                  </div>

                  <div className="flex flex-col mt-4 md:mt-5">
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                      Site
                    </h3>
                    {franchise.contact.website ? (
                      <a
                        href={franchise.contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-normal text-sm sm:text-base text-primary hover:text-primary/80 underline break-words transition-colors"
                      >
                        {franchise.contact.website}
                      </a>
                    ) : (
                      <p className="font-normal text-sm sm:text-base text-muted-foreground">
                        Não informado
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col mt-4 md:mt-5">
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                      Telefone
                    </h3>
                    <p className="font-normal text-sm sm:text-base text-muted-foreground">
                      Não informado
                    </p>
                  </div>

                  <div className="flex flex-col mt-4 md:mt-5">
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                      E-mail
                    </h3>
                    <p className="font-normal text-sm sm:text-base text-muted-foreground">
                      Não informado
                    </p>
                  </div>

                  <div className="flex flex-col mt-4 md:mt-5">
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                      Site
                    </h3>
                    <p className="font-normal text-sm sm:text-base text-muted-foreground">
                      Não informado
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {/* Detailed Description Section */}
        {franchise.detailedDescription && (
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-xl sm:text-2xl md:text-3xl my-4 md:my-5 text-foreground">
              Descrição
            </h2>
            <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm border border-border/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <p className="text-foreground whitespace-pre-wrap text-sm sm:text-base break-words">
                {franchise.detailedDescription}
              </p>
            </div>
          </div>
        )}
        {/* Business Models Section */}
        {franchise.businessModels && franchise.businessModels.length > 0 && (
          <BusinessModelsSection
            franchiseId={franchiseSlug}
            token={''}
            isOwner={false}
          />
        )}
      </div>

      {franchiseSlug && (
        <CommentPanel
          franchiseId={franchiseSlug}
          isReview={franchise.isReview}
        />
      )}

      <ModalRedirectLogin
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
      <ModalIncompleteProfile
        isOpen={isIncompleteProfileModalOpen}
        onClose={() => setIsIncompleteProfileModalOpen(false)}
      />

      <ModalRedirectSeccondStep
        isOpen={isMemberModalOpen}
        onClose={handleCancelModal}
      />
    </>
  )
}
