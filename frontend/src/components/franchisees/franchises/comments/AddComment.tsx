import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import StarIcon from '@/src/components/icons/starIcon'
import RoundedButton from '@/src/components/ui/RoundedButton'
import FormTextarea from '@/src/components/ui/FormTextarea'
import { useCreateAuthenticatedReview } from '@/src/hooks/reviews/useReviewMutations'
import { CreateAuthenticatedReviewFormSchema } from '@/src/schemas/franchises/Reviews'

import ValidateCode from './ValidateCode'

import type { CreateAuthenticatedReviewFormData } from '@/src/schemas/franchises/Reviews'

interface AddCommentProps {
  onClose?: () => void
  onSuccess?: () => void
  onShowCodeModal?: (email: string) => void
  onBack?: () => void
  franchiseId: string
  isCodeModal?: boolean
  userEmail?: string
}

export default function AddComment({
  onClose,
  onSuccess,
  onBack,
  franchiseId,
  isCodeModal = false,
  userEmail,
}: AddCommentProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)

  const {
    mutate: createAuthenticatedReview,
    isPending: isCreatingAuthenticatedReview,
    isSuccess: isCreatingAuthenticatedReviewSuccess,
  } = useCreateAuthenticatedReview()

  // Only authenticated users reach this component, so use authenticated schema
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CreateAuthenticatedReviewFormData>({
    resolver: zodResolver(CreateAuthenticatedReviewFormSchema),
    mode: 'onChange',
    defaultValues: {
      anonymous: false,
      rating: 0,
      comment: '',
    },
  })

  // No need to set default values for authenticated users since they don't fill those fields

  useEffect(() => {
    if (isCreatingAuthenticatedReviewSuccess) {
      onSuccess?.()
    }
  }, [isCreatingAuthenticatedReviewSuccess, onSuccess])

  const handleStarClick = (starRating: number) => {
    setRating(starRating)
    setValue('rating', starRating, { shouldValidate: true })
  }

  const handleStarHover = (starRating: number) => {
    setHoverRating(starRating)
  }

  const handleStarLeave = () => {
    setHoverRating(0)
  }

  const handleBack = () => {
    onBack?.()
  }

  const handleReview = (data: CreateAuthenticatedReviewFormData) => {
    // Previne múltiplos envios
    if (isCreatingAuthenticatedReview) {
      return
    }

    // Only authenticated users reach this component
    createAuthenticatedReview({
      data,
      franchiseId,
    })
  }

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1
      const isActive = starValue <= (hoverRating || rating)

      return (
        <button
          key={index}
          type="button"
          onClick={() => handleStarClick(starValue)}
          onMouseEnter={() => handleStarHover(starValue)}
          onMouseLeave={handleStarLeave}
          className="focus:outline-none transition-transform hover:scale-110 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          <StarIcon
            color={isActive ? '#E25E3E' : '#B4B4B4'}
            filled={true}
            width={24}
            height={24}
          />
        </button>
      )
    })
  }

  // Se estiver no modal de código, renderizar apenas o input de código
  if (isCodeModal) {
    return (
      <ValidateCode
        franchiseId={franchiseId}
        email={userEmail || ''}
        onSuccess={onSuccess}
        onBack={handleBack}
      />
    )
  }

  return (
    <>
      <form
        className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 rounded-md w-full"
        onSubmit={handleSubmit(handleReview)}
        noValidate
      >
        {/* Personal data fields removed - only authenticated users reach this component */}

        {/* Avaliação */}
        <div className="flex flex-col">
          <label className="mb-2 font-medium">Avaliação *</label>

          <div className="flex gap-1 mb-2">{renderStars()}</div>

          <p className="text-sm text-gray-600">
            {rating > 0
              ? `Você avaliou com ${rating} estrela${rating > 1 ? 's' : ''}`
              : 'Clique nas estrelas para avaliar'}
          </p>

          {errors.rating && (
            <div className="text-red-500 text-sm mt-1">
              {errors.rating.message}
            </div>
          )}
        </div>

        <FormTextarea
          label="Depoimento *"
          id="comment"
          rows={4}
          placeholder="Compartilhe sua experiência como franqueado desta rede. Como tem sido sua jornada? Quais foram os principais desafios e conquistas? (mínimo 10 caracteres)"
          error={errors.comment?.message}
          register={register('comment')}
          disabled={isSubmitting}
          paddingVariant="compact"
          showCharacterCount={true}
          maxCharacterCount={2000}
          className="rounded-sm"
        />

        {/* Checkbox Anônimo */}
        <div className="flex items-center gap-2">
          <input
            id="anonymous"
            type="checkbox"
            className="w-4 h-4 text-[#E25E3E] bg-gray-100 border-gray-300 rounded focus:ring-[#E25E3E] focus:ring-2 disabled:cursor-not-allowed"
            disabled={isSubmitting}
            {...register('anonymous')}
          />
          <label
            htmlFor="anonymous"
            className="text-sm font-medium text-gray-700"
          >
            Publicar como anônimo
          </label>
        </div>

        {/* Aviso sobre privacidade */}
        <div className="text-xs text-gray-500 text-center pt-2">
          <p>
            Seu depoimento será público e poderá ajudar outros empreendedores.
            {watch('anonymous')
              ? ' Seu nome não será exibido.'
              : ' Seu nome será exibido junto ao depoimento.'}
          </p>
        </div>

        {/* Botões */}
        <div className="flex flex-col gap-3 pt-4">
          <RoundedButton
            text={
              isCreatingAuthenticatedReview
                ? 'Enviando...'
                : 'Enviar depoimento'
            }
            color="#E25E3E"
            textColor="white"
            disabled={isSubmitting || isCreatingAuthenticatedReview}
          />

          <div className="flex justify-center text-sm">
            <a
              onClick={() => onClose?.()}
              className="text-[#E25E3E] underline ml-1 hover:text-[#E20E3E] cursor-pointer"
            >
              Cancelar
            </a>
          </div>
        </div>
      </form>
    </>
  )
}
