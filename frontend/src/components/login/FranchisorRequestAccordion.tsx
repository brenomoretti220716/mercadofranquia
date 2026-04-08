'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import Accordion from '@/src/components/ui/Accordion'
import PhotoUploader from '@/src/components/ui/PhotoUploader'
import ModalConfirmation from '@/src/components/ui/ModalConfirmation'
import {
  useMyFranchisorRequest,
  useCreateFranchisorRequest,
  useUpdateFranchisorRequest,
  useDeleteFranchisorRequest,
} from '@/src/hooks/users/useFranchisorRequest'
import {
  FranchisorRequestStatus,
  FranchisorRequestFormSchema,
  FranchisorRequestFormInput,
  UpdateFranchisorRequestDto,
} from '@/src/schemas/users/FranchisorRequest'
import { formatCNPJ, stripNonDigits } from '@/src/utils/formaters'
import FormInput from '@/src/components/ui/FormInput'
import PhoneInput from '@/src/components/ui/PhoneInput'
import CNPJInput from '@/src/components/ui/CNPJInput'

const statusLabels = {
  [FranchisorRequestStatus.PENDING]: 'Aguardando Aprovação',
  [FranchisorRequestStatus.UNDER_REVIEW]: 'Em Análise',
  [FranchisorRequestStatus.APPROVED]: 'Aprovada',
  [FranchisorRequestStatus.REJECTED]: 'Rejeitada',
}

const statusColors = {
  [FranchisorRequestStatus.PENDING]: 'text-yellow-600',
  [FranchisorRequestStatus.UNDER_REVIEW]: 'text-blue-600',
  [FranchisorRequestStatus.APPROVED]: 'text-green-600',
  [FranchisorRequestStatus.REJECTED]: 'text-red-600',
}

export function FranchisorRequestAccordion() {
  const { data: request, isLoading, refetch } = useMyFranchisorRequest()
  const createMutation = useCreateFranchisorRequest()
  const updateMutation = useUpdateFranchisorRequest()
  const deleteMutation = useDeleteFranchisorRequest()

  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<FranchisorRequestFormInput>({
    resolver: zodResolver(FranchisorRequestFormSchema),
    defaultValues: {
      streamName: '',
      cnpj: '',
      responsable: '',
      responsableRole: '',
      commercialEmail: '',
      commercialPhone: '',
      cnpjCard: null,
      socialContract: null,
    },
  })

  useEffect(() => {
    if (request) {
      reset({
        streamName: request.streamName,
        cnpj: request.cnpj,
        responsable: request.responsable,
        responsableRole: request.responsableRole,
        commercialEmail: request.commercialEmail,
        commercialPhone: stripNonDigits(request.commercialPhone), // Strip any formatting to ensure raw digits
        cnpjCard: null,
        socialContract: null,
      })
    }
  }, [request, reset])

  // Watch form values to pass as defaultValue to PhoneInput
  const commercialPhoneValue = watch('commercialPhone')

  const onSubmit = (data: FranchisorRequestFormInput) => {
    // Validate files for new requests
    if (!request && !data.cnpjCard) {
      setError('cnpjCard', { message: 'Cartão CNPJ é obrigatório' })
      return
    }

    if (!request && !data.socialContract) {
      setError('socialContract', { message: 'Contrato social é obrigatório' })
      return
    }

    setShowSubmitModal(true)
  }

  const confirmSubmit = async () => {
    const formData = watch()

    try {
      if (
        request &&
        (request.status === FranchisorRequestStatus.PENDING ||
          request.status === FranchisorRequestStatus.REJECTED)
      ) {
        // Update existing request
        const updateData: UpdateFranchisorRequestDto = {
          streamName: formData.streamName,
          cnpj: stripNonDigits(formData.cnpj),
          responsable: formData.responsable,
          responsableRole: formData.responsableRole,
          commercialEmail: formData.commercialEmail,
          commercialPhone: formData.commercialPhone.replace(/\D/g, ''), // Ensure raw digits only (safety check)
        }

        if (formData.cnpjCard) updateData.cnpjCard = formData.cnpjCard
        if (formData.socialContract)
          updateData.socialContract = formData.socialContract

        await updateMutation.mutateAsync(updateData)
        toast.success('Solicitação atualizada com sucesso!')
      } else {
        // Create new request
        await createMutation.mutateAsync({
          streamName: formData.streamName,
          cnpj: stripNonDigits(formData.cnpj),
          responsable: formData.responsable,
          responsableRole: formData.responsableRole,
          commercialEmail: formData.commercialEmail,
          commercialPhone: formData.commercialPhone.replace(/\D/g, ''), // Ensure raw digits only (safety check)
          cnpjCard: formData.cnpjCard!,
          socialContract: formData.socialContract!,
        })
        toast.success('Solicitação enviada com sucesso!')
      }
      setShowSubmitModal(false)
      refetch()
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao processar solicitação',
      )
    }
  }

  const handleDelete = () => {
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync()
      toast.success('Solicitação excluída com sucesso!')
      reset({
        streamName: '',
        cnpj: '',
        responsable: '',
        responsableRole: '',
        commercialEmail: '',
        commercialPhone: '',
        cnpjCard: null,
        socialContract: null,
      })
      setShowDeleteModal(false)
      refetch()
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao excluir solicitação',
      )
    }
  }

  const getTitle = () => {
    if (isLoading) return 'Carregando...'
    if (!request) return 'Solicitação de Franqueador'

    const status = statusLabels[request.status]
    return `Solicitação de Franqueador - ${status}`
  }

  const canEdit =
    !request ||
    request.status === FranchisorRequestStatus.PENDING ||
    request.status === FranchisorRequestStatus.REJECTED

  if (isLoading) {
    return (
      <div className="w-full p-4 bg-gray-50 rounded-lg">
        <p className="text-center text-gray-500">Carregando solicitação...</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <Accordion title={getTitle()} defaultOpen={false}>
        <div className="space-y-6">
          {/* Status Badge */}
          {request && (
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <p className="text-sm text-gray-600">Status da Solicitação</p>
                <p
                  className={`text-lg font-semibold ${statusColors[request.status]}`}
                >
                  {statusLabels[request.status]}
                </p>
              </div>
              {request.status === FranchisorRequestStatus.REJECTED &&
                request.rejectionReason && (
                  <div className="flex-1 ml-6">
                    <p className="text-sm text-gray-600 mb-1">
                      Motivo da Rejeição:
                    </p>
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded">
                      {request.rejectionReason}
                    </p>
                  </div>
                )}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormInput
                  label="Nome da Marca / Empresa *"
                  type="text"
                  placeholder="Nome da sua franquia"
                  error={errors.streamName?.message}
                  register={register('streamName')}
                  disabled={!canEdit}
                  paddingVariant="without-icon"
                  className="disabled:bg-gray-100"
                  labelClassName="text-sm font-medium text-gray-700 mb-1"
                  errorClassName="text-xs"
                />
              </div>

              <div>
                <CNPJInput
                  label="CNPJ *"
                  placeholder="00.000.000/0000-00"
                  error={errors.cnpj?.message}
                  disabled={!canEdit}
                  className="disabled:bg-gray-100"
                  value={formatCNPJ(watch('cnpj'))}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const formatted = formatCNPJ(e.target.value)
                    setValue('cnpj', stripNonDigits(formatted))
                  }}
                />
              </div>

              <div>
                <FormInput
                  label="Nome do Responsável *"
                  type="text"
                  placeholder="Nome completo"
                  error={errors.responsable?.message}
                  register={register('responsable')}
                  disabled={!canEdit}
                  className="disabled:bg-gray-100"
                />
              </div>

              <div>
                <FormInput
                  label="Cargo do Responsável *"
                  type="text"
                  placeholder="Ex: CEO, Diretor"
                  error={errors.responsableRole?.message}
                  register={register('responsableRole')}
                  disabled={!canEdit}
                  paddingVariant="without-icon"
                  className="disabled:bg-gray-100"
                  labelClassName="text-sm font-medium text-gray-700 mb-1"
                  errorClassName="text-xs"
                />
              </div>

              <div>
                <FormInput
                  label="Email Comercial *"
                  type="email"
                  placeholder="comercial@empresa.com"
                  error={errors.commercialEmail?.message}
                  register={register('commercialEmail')}
                  disabled={!canEdit}
                  className="disabled:bg-gray-100"
                />
              </div>

              <div>
                <PhoneInput
                  label="Telefone Comercial *"
                  placeholder="(11) 99999-9999"
                  error={errors.commercialPhone?.message}
                  disabled={!canEdit}
                  className="disabled:bg-gray-100"
                  register={register('commercialPhone')}
                  defaultValue={commercialPhoneValue || ''}
                />
              </div>
            </div>

            {/* File Uploads */}
            {canEdit && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {/* CNPJ Card */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cartão CNPJ{' '}
                    {!request && <span className="text-red-500">*</span>}
                  </label>
                  <PhotoUploader
                    onChange={(files) => {
                      setValue('cnpjCard', files[0] || null)
                      if (files[0]) clearErrors('cnpjCard')
                    }}
                    defaultValue={
                      request?.cnpjCardPath
                        ? `${process.env.NEXT_PUBLIC_API_URL}/${request.cnpjCardPath}`
                        : null
                    }
                    module="franchisor-documents"
                    allowPdf={true}
                  />
                  {errors.cnpjCard && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.cnpjCard.message}
                    </p>
                  )}
                </div>

                {/* Social Contract */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contrato Social{' '}
                    {!request && <span className="text-red-500">*</span>}
                  </label>
                  <PhotoUploader
                    onChange={(files) => {
                      setValue('socialContract', files[0] || null)
                      if (files[0]) clearErrors('socialContract')
                    }}
                    defaultValue={
                      request?.socialContractPath
                        ? `${process.env.NEXT_PUBLIC_API_URL}/${request.socialContractPath}`
                        : null
                    }
                    module="franchisor-documents"
                    allowPdf={true}
                  />
                  {errors.socialContract && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.socialContract.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Buttons */}
            {canEdit && (
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="flex-1 bg-[#E25E3E] text-white py-2 px-4 rounded-md hover:bg-[#c04e2e] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Processando...'
                    : request
                      ? 'Atualizar Solicitação'
                      : 'Enviar Solicitação'}
                </button>

                {request &&
                  (request.status === FranchisorRequestStatus.PENDING ||
                    request.status === FranchisorRequestStatus.REJECTED) && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                      className="px-6 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
                    </button>
                  )}
              </div>
            )}

            {request && request.status === FranchisorRequestStatus.APPROVED && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-green-800 text-sm">
                  ✓ Sua solicitação foi aprovada! Agora você pode gerenciar suas
                  franquias.
                </p>
              </div>
            )}

            {request && request.status === FranchisorRequestStatus.REJECTED && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Sua solicitação foi rejeitada. Você pode fazer as correções
                  necessárias e reenviar para análise.
                </p>
              </div>
            )}
          </form>
        </div>
      </Accordion>

      {/* Submit Confirmation Modal */}
      <ModalConfirmation
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={confirmSubmit}
        buttonText={request ? 'Atualizar' : 'Enviar'}
        action={
          request ? 'atualizar esta solicitação' : 'enviar esta solicitação'
        }
        text={
          request
            ? 'As informações da solicitação serão atualizadas e enviadas novamente para análise.'
            : 'Sua solicitação será enviada para análise do administrador. Certifique-se de que todos os dados e documentos estão corretos.'
        }
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      <ModalConfirmation
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        buttonText="Excluir"
        action="excluir esta solicitação"
        text="Esta ação não pode ser desfeita. Você precisará criar uma nova solicitação caso queira enviar novamente."
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
