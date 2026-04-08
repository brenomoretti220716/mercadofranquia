'use client'

import EditIcon from '@/src/components/icons/editIcon'
import BusinessModelsSection from '@/src/components/franchisors/panels/franchises/businessModels/BusinessModelsSection'
import DetailedDescriptionUpdate from '@/src/components/franchisors/panels/franchises/updateFranchises/DetailedDescriptionUpdate'
import FranchiseDataEdit from '@/src/components/franchisors/panels/franchises/updateFranchises/FranchiseDataEdit'
import GalleryUpdate from '@/src/components/franchisors/panels/franchises/updateFranchises/GalleryUpdate'
import LogoUpdate from '@/src/components/franchisors/panels/franchises/updateFranchises/LogoUpdate'
import ThumbnailUpdate from '@/src/components/franchisors/panels/franchises/updateFranchises/ThumbnailUpdate'
import VideoUpdate from '@/src/components/franchisors/panels/franchises/updateFranchises/VideoUpdate'
import type { Franchise } from '@/src/schemas/franchises/Franchise'
import Image from 'next/image'
import { useState } from 'react'

interface FranchiseEditDetailsProps {
  franchise: Franchise
  token: string
}

export default function FranchiseEditDetails({
  franchise,
  token,
}: FranchiseEditDetailsProps) {
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false)
  const [isLogoHovered, setIsLogoHovered] = useState(false)

  return (
    <>
      <div className="flex flex-col m-4 sm:m-6 md:m-10 w-auto min-h-screen gap-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-15 md:h-15 flex-shrink-0 overflow-hidden rounded-full cursor-pointer group"
              onClick={() => setIsLogoModalOpen(true)}
              onMouseEnter={() => setIsLogoHovered(true)}
              onMouseLeave={() => setIsLogoHovered(false)}
            >
              {franchise.logoUrl ? (
                <Image
                  src={franchise.logoUrl}
                  alt={franchise.name}
                  fill
                  className="object-cover transition-opacity duration-200 group-hover:opacity-70"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.nextElementSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              <div
                className={`absolute inset-0 w-12 h-12 sm:w-14 sm:h-14 md:w-15 md:h-15 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-semibold transition-opacity duration-200 group-hover:opacity-70 ${franchise.logoUrl ? 'hidden' : ''}`}
              >
                {franchise.name ? franchise.name.charAt(0).toUpperCase() : 'F'}
              </div>
              <div
                className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 transition-opacity duration-200 ${isLogoHovered ? 'opacity-100' : 'opacity-0'}`}
              >
                <EditIcon width={24} height={24} color="white" />
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground truncate">
              {franchise.name}
            </h1>
          </div>
          <div className="flex items-center md:justify-end">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-primary">
              Você está na posição #{franchise.rankingPosition}!
            </h1>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <ThumbnailUpdate franchise={franchise} />
          <GalleryUpdate franchise={franchise} />
          <VideoUpdate key={franchise.id} franchise={franchise} />
        </div>

        <FranchiseDataEdit franchise={franchise} token={token} />
        <DetailedDescriptionUpdate
          franchiseId={franchise.id}
          initialDescription={franchise.detailedDescription}
          token={token}
        />
        <BusinessModelsSection
          franchiseId={franchise.id}
          token={token}
          isOwner={true}
        />
      </div>

      <LogoUpdate
        franchise={franchise}
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
      />
    </>
  )
}
