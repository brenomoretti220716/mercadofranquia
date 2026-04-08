'use client'

import { useParams, useRouter } from 'next/navigation'
import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchBusinessModelById } from '@/src/hooks/businessModels/useBusinessModels'
import Image from 'next/image'

export default function BusinessModelDetail() {
  const params = useParams()
  const router = useRouter()
  const businessModelId = params?.id as string

  const { data: businessModel } = useSuspenseQuery({
    queryKey: ['businessModel', businessModelId],
    queryFn: () => fetchBusinessModelById(businessModelId),
  })

  if (!businessModel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-gray-500 text-lg">
          Modelo de negócio não encontrado
        </p>
        <button
          onClick={() => router.back()}
          className="text-[#E25E3E] hover:text-[#E20E3E] underline"
        >
          Voltar
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-10">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-[#E25E3E] transition-colors"
          aria-label="Voltar"
        >
          <span className="text-sm sm:text-base cursor-pointer">
            {' '}
            &larr; Voltar
          </span>
        </button>
      </div>

      {/* Main content */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
        {/* Image section */}
        <div className="w-full lg:w-1/2">
          <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px] rounded-2xl overflow-hidden">
            <Image
              src={businessModel.photoUrl}
              alt={businessModel.name}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Content section */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <div>
            <h1 className="font-bold text-3xl sm:text-4xl mb-4">
              {businessModel.name}
            </h1>
            <div className="w-16 h-1 bg-[#E25E3E] rounded-full"></div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-semibold text-lg sm:text-xl mb-2 text-gray-700">
                Descrição
              </h2>
              <p className="text-gray-600 text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
                {businessModel.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
