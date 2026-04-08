'use client'

import MailIcon from '@/src/components/icons/emailIcon'
import IdIcon from '@/src/components/icons/idIcon'
import ProfileIcon from '@/src/components/icons/profileIcon'
import Accordion from '@/src/components/ui/Accordion'
import FormInput from '@/src/components/ui/FormInput'
import ModalConfirmation from '@/src/components/ui/ModalConfirmation'
import MultiSelect from '@/src/components/ui/MultiSelect'
import PasswordInput from '@/src/components/ui/PasswordInput'
import PhoneInput from '@/src/components/ui/PhoneInput'
import RoundedButton from '@/src/components/ui/RoundedButton'
import ToogleButton from '@/src/components/ui/ToogleButton'
import { useAdminUpdateFranchisor } from '@/src/hooks/users/useUserMutations'
import { franchiseQueries } from '@/src/queries/franchises'
import { FranchisorRequestStatus } from '@/src/schemas/users/constants'
import { FranchisorRequestData, User } from '@/src/schemas/users/User'
import { UpdateUserBasicInfoDto } from '@/src/services/users'
import { formatDateTimeToBrazilian } from '@/src/utils/dateFormatters'
import { formatCPF, stripNonDigits } from '@/src/utils/formaters'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

interface FranchisorEditingProps {
  onClose?: () => void
  onSuccess?: () => void
  user?: User | null
}

// Basic Info Schema
const BasicInfoSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    phone: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === '') return true // Optional field
          const digits = stripNonDigits(val)
          return digits.length === 10 || digits.length === 11 // 10 or 11 digits for Brazilian phone
        },
        { message: 'Telefone deve ter 10 ou 11 dígitos' },
      ),
    password: z
      .string()
      .min(6, 'Mínimo de 6 caracteres')
      .optional()
      .or(z.literal('')),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.password && data.password.trim() !== '') {
        return data.password === data.confirmPassword
      }
      return true
    },
    {
      message: 'As senhas não coincidem',
      path: ['confirmPassword'],
    },
  )

type BasicInfoInput = z.infer<typeof BasicInfoSchema>

// Franchises Schema
const FranchisesSchema = z.object({
  ownedFranchises: z
    .array(z.string())
    .min(1, 'Selecione pelo menos uma franquia'),
})

type FranchisesInput = z.infer<typeof FranchisesSchema>

export default function FranchisorEditing({
  onSuccess,
  onClose,
  user,
}: FranchisorEditingProps) {
  const [currentStatus, setCurrentStatus] = useState(user?.isActive ?? true)
  const [showToggleModal, setShowToggleModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Fetch available franchises + franchises owned by this user
  const { data: franchiseOptions = [], isLoading: isLoadingFranchises } =
    useSuspenseQuery(franchiseQueries.availableOptionsForUser(user?.id || ''))

  const updateMutation = useAdminUpdateFranchisor({
    onSuccess: () => {
      onSuccess?.()
    },
  })

  const userOwnedFranchisesIds = useMemo(
    () =>
      user?.ownedFranchises?.map((f) => (typeof f === 'string' ? f : f.id)) ||
      [],
    [user],
  )

  // Basic Info Form
  const basicInfoForm = useForm<BasicInfoInput>({
    resolver: zodResolver(BasicInfoSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      password: '',
      confirmPassword: '',
    },
  })

  // Franchises Form
  const franchisesForm = useForm<FranchisesInput>({
    resolver: zodResolver(FranchisesSchema),
    defaultValues: {
      ownedFranchises: userOwnedFranchisesIds,
    },
  })

  useEffect(() => {
    if (user) {
      basicInfoForm.reset({
        name: user.name || '',
        email: user.email || '',
        phone: stripNonDigits(user.phone), // Strip any formatting to ensure raw digits
        password: '',
        confirmPassword: '',
      })

      franchisesForm.reset({
        ownedFranchises: userOwnedFranchisesIds,
      })

      setCurrentStatus(user.isActive ?? true)
    }
  }, [user, basicInfoForm, franchisesForm, userOwnedFranchisesIds])

  const selectedFranchises = franchisesForm.watch('ownedFranchises') || []

  // Watch form values to pass as defaultValue to PhoneInput
  const phoneValue = basicInfoForm.watch('phone')

  async function handleBasicInfoSubmit(data: BasicInfoInput) {
    if (!user?.id) return

    const submitData: UpdateUserBasicInfoDto = {
      name: data.name,
      email: data.email,
    }

    // Ensure raw digits only (safety check)
    if (data.phone) {
      submitData.phone = stripNonDigits(data.phone)
    }

    if (data.password && data.password.trim() !== '') {
      submitData.password = data.password
    }

    updateMutation.mutate({ userId: user.id, data: submitData })
  }

  async function handleFranchisesSubmit(data: FranchisesInput) {
    if (!user?.id) return

    updateMutation.mutate({
      userId: user.id,
      data: { ownedFranchises: data.ownedFranchises },
    })
  }

  const handleToggleStatus = () => {
    setShowToggleModal(true)
  }

  const handleConfirmToggle = async () => {
    if (!user?.id) return

    const newStatus = !currentStatus

    updateMutation.mutate(
      { userId: user.id, data: { isActive: newStatus } },
      {
        onSuccess: () => {
          setCurrentStatus(newStatus)
          setShowToggleModal(false)
        },
      },
    )
  }

  if (isLoadingFranchises) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E25E3E] mr-3"></div>
        <span className="text-gray-600">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-4">
      {/* Status Toggle Section */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">
            Status do Franqueador
          </span>
          <span className="text-sm text-gray-600">
            {currentStatus
              ? 'Franqueador ativo no sistema'
              : 'Franqueador inativo no sistema'}
          </span>
        </div>
        <ToogleButton
          isActive={currentStatus}
          isUpdating={updateMutation.isPending}
          isTogglingStatus={updateMutation.isPending}
          handleOpenToggleModal={handleToggleStatus}
        />
      </div>

      {/* Accordion 1: Basic Information */}
      <Accordion title="Informações Básicas" defaultOpen={true}>
        <form
          className="space-y-4"
          onSubmit={basicInfoForm.handleSubmit(handleBasicInfoSubmit)}
          noValidate
        >
          <FormInput
            label="Nome Completo"
            id="name"
            type="text"
            placeholder="Nome completo"
            leftIcon={<ProfileIcon width={20} height={20} color="#747473" />}
            error={basicInfoForm.formState.errors.name?.message}
            register={basicInfoForm.register('name')}
            disabled={updateMutation.isPending}
          />

          <FormInput
            label="E-mail"
            id="email"
            type="email"
            placeholder="seu@email.com"
            leftIcon={<MailIcon width={20} height={20} color="#747473" />}
            error={basicInfoForm.formState.errors.email?.message}
            register={basicInfoForm.register('email')}
            disabled={updateMutation.isPending}
          />

          <PhoneInput
            label="Telefone (opcional)"
            id="phone"
            placeholder="(11) 99999-9999"
            error={basicInfoForm.formState.errors.phone?.message}
            register={basicInfoForm.register('phone')}
            defaultValue={phoneValue || ''}
            disabled={updateMutation.isPending}
          />

          {/* CPF - Read Only */}
          <FormInput
            label="CPF"
            id="cpf"
            type="text"
            value={formatCPF(user?.cpf || '')}
            leftIcon={<IdIcon width={20} height={20} color="#747473" />}
            readOnly
            disabled={updateMutation.isPending}
            className="bg-gray-100 cursor-not-allowed"
          />
          <div className="text-xs text-gray-500 -mt-3">
            CPF não pode ser editado
          </div>

          <PasswordInput
            label="Nova Senha (opcional)"
            id="password"
            error={basicInfoForm.formState.errors.password?.message}
            register={basicInfoForm.register('password')}
            disabled={updateMutation.isPending}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />

          <PasswordInput
            label="Confirme a nova senha"
            id="confirmPassword"
            error={basicInfoForm.formState.errors.confirmPassword?.message}
            register={basicInfoForm.register('confirmPassword')}
            disabled={updateMutation.isPending}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />

          <div className="grid w-full mt-6">
            <RoundedButton
              color="#000000"
              hoverColor="#E25E3E"
              text={
                updateMutation.isPending
                  ? 'Salvando...'
                  : 'Salvar Informações Básicas'
              }
              textColor="white"
              disabled={updateMutation.isPending}
            />
          </div>
        </form>
      </Accordion>

      {/* Accordion 2: Franchisor Request Information (if available) */}
      {user?.franchisorRequest && (
        <Accordion
          title="Informações da Solicitação de Franqueador"
          defaultOpen={false}
        >
          <div className="space-y-4">
            {(() => {
              const request = user.franchisorRequest as FranchisorRequestData
              const formatCNPJ = (cnpj: string) => {
                return cnpj.replace(
                  /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
                  '$1.$2.$3/$4-$5',
                )
              }

              const formatPhoneRequest = (phone: string) => {
                const numbers = stripNonDigits(phone)
                if (numbers.length <= 10) {
                  return numbers.replace(
                    /^(\d{2})(\d{4})(\d{0,4})/,
                    '($1) $2-$3',
                  )
                }
                return numbers.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
              }

              const statusColors = {
                [FranchisorRequestStatus.PENDING]:
                  'text-yellow-600 bg-yellow-50',
                [FranchisorRequestStatus.UNDER_REVIEW]:
                  'text-blue-600 bg-blue-50',
                [FranchisorRequestStatus.APPROVED]:
                  'text-green-600 bg-green-50',
                [FranchisorRequestStatus.REJECTED]: 'text-red-600 bg-red-50',
              }

              const statusLabels = {
                [FranchisorRequestStatus.PENDING]: 'Pendente',
                [FranchisorRequestStatus.UNDER_REVIEW]: 'Em Análise',
                [FranchisorRequestStatus.APPROVED]: 'Aprovado',
                [FranchisorRequestStatus.REJECTED]: 'Rejeitado',
              }

              return (
                <>
                  {/* Status Badge */}
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-gray-50">
                    <div>
                      <p className="text-sm text-gray-600">
                        Status da Solicitação
                      </p>
                      <span
                        className={`inline-block mt-1 px-3 py-1 text-sm font-semibold rounded-full ${statusColors[request.status]}`}
                      >
                        {statusLabels[request.status]}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Data de Criação</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {formatDateTimeToBrazilian(request.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Request Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Nome da Marca/Empresa
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {request.streamName}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        CNPJ
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {formatCNPJ(request.cnpj)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Email Comercial
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {request.commercialEmail}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Telefone Comercial
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {formatPhoneRequest(request.commercialPhone)}
                      </p>
                    </div>

                    {request.reviewedAt && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Data de Revisão
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {formatDateTimeToBrazilian(request.reviewedAt)}
                        </p>
                      </div>
                    )}

                    {request.reviewedBy && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Revisado por
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {request.reviewer?.name}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Documents */}
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Documentos
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Cartão CNPJ
                        </label>
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL}/${request.cnpjCardPath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block mt-1 text-sm text-[#E25E3E] hover:text-[#c04e2e] underline"
                        >
                          Visualizar documento
                        </a>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Contrato Social
                        </label>
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL}/${request.socialContractPath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block mt-1 text-sm text-[#E25E3E] hover:text-[#c04e2e] underline"
                        >
                          Visualizar documento
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Rejection Reason (if rejected) */}
                  {request.status === FranchisorRequestStatus.REJECTED &&
                    request.rejectionReason && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="text-sm font-semibold text-red-900 mb-2">
                          Motivo da Rejeição
                        </h4>
                        <p className="text-sm text-red-800">
                          {request.rejectionReason}
                        </p>
                      </div>
                    )}
                </>
              )
            })()}
          </div>
        </Accordion>
      )}

      {/* Accordion 3: Franchises */}
      <Accordion title="Franquias do Franqueador" defaultOpen={false}>
        <form
          className="space-y-4"
          onSubmit={franchisesForm.handleSubmit(handleFranchisesSubmit)}
          noValidate
        >
          <div className="flex flex-col">
            <label htmlFor="ownedFranchises" className="mb-1 font-medium">
              Franquias Vinculadas
            </label>
            <p className="text-sm text-gray-600 mb-2">
              Selecione as franquias que este franqueador possui/gerencia
            </p>
            {franchiseOptions.length > 0 ? (
              <MultiSelect
                options={franchiseOptions}
                value={selectedFranchises}
                onChange={(value) =>
                  franchisesForm.setValue('ownedFranchises', value)
                }
                placeholder="Selecione as franquias"
                error={franchisesForm.formState.errors.ownedFranchises?.message}
              />
            ) : (
              <div className="p-3 border border-gray-300 rounded-md bg-gray-50">
                <span className="text-gray-500 text-sm">
                  Nenhuma franquia disponível
                </span>
              </div>
            )}
          </div>

          <div className="grid w-full mt-6">
            <RoundedButton
              color="#000000"
              hoverColor="#E25E3E"
              text={
                updateMutation.isPending ? 'Salvando...' : 'Salvar Franquias'
              }
              textColor="white"
              disabled={updateMutation.isPending}
            />
          </div>
        </form>
      </Accordion>

      {/* Close button */}
      <div className="flex justify-center text-sm">
        <a
          onClick={onClose}
          className="text-[#E25E3E] underline hover:text-[#E20E3E] cursor-pointer"
        >
          Fechar
        </a>
      </div>

      {/* Status Toggle Confirmation Modal */}
      <ModalConfirmation
        isOpen={showToggleModal}
        onClose={() => setShowToggleModal(false)}
        onConfirm={handleConfirmToggle}
        isLoading={updateMutation.isPending}
        action={
          currentStatus
            ? 'desativar este franqueador'
            : 'ativar este franqueador'
        }
        text={
          currentStatus
            ? 'O franqueador perderá acesso ao sistema imediatamente e não poderá gerenciar suas franquias.'
            : 'O franqueador recuperará acesso ao sistema imediatamente e poderá gerenciar suas franquias.'
        }
        buttonText={currentStatus ? 'Desativar' : 'Ativar'}
      />
    </div>
  )
}
