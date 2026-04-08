'use client'

import FormTextarea from '@/src/components/ui/FormTextarea'
import RoundedButton from '@/src/components/ui/RoundedButton'
import { useCreateNewsComment } from '@/src/hooks/news/useNewsComments'
import {
  CreateNewsCommentData,
  CreateNewsCommentSchema,
} from '@/src/schemas/news/NewsComment'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

interface AddNewsCommentProps {
  newsId: string
  onSuccess?: () => void
}

export default function AddNewsComment({
  newsId,
  onSuccess,
}: AddNewsCommentProps) {
  const {
    mutate: createComment,
    isPending: isCreating,
    isSuccess,
  } = useCreateNewsComment()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateNewsCommentData>({
    resolver: zodResolver(CreateNewsCommentSchema),
    mode: 'onChange',
    defaultValues: {
      content: '',
    },
  })

  useEffect(() => {
    if (isSuccess) {
      reset()
      onSuccess?.()
    }
  }, [isSuccess, onSuccess, reset])

  const handleCreateComment = (data: CreateNewsCommentData) => {
    if (isCreating) return

    createComment({
      newsId,
      data,
    })
  }

  return (
    <form
      className="space-y-3 sm:space-y-4 w-full"
      onSubmit={handleSubmit(handleCreateComment)}
      noValidate
    >
      <FormTextarea
        label="Seu comentário"
        id="content"
        rows={4}
        placeholder="Compartilhe sua opinião sobre esta notícia... (mínimo 10 caracteres)"
        error={errors.content?.message}
        register={register('content')}
        disabled={isSubmitting || isCreating}
        paddingVariant="compact"
        showCharacterCount={true}
        maxCharacterCount={1000}
        className="rounded-sm"
      />

      <div className="flex justify-end">
        <RoundedButton
          text={isCreating ? 'Enviando...' : 'Adicionar comentário'}
          color="#E25E3E"
          textColor="white"
          disabled={isSubmitting || isCreating}
        />
      </div>
    </form>
  )
}
