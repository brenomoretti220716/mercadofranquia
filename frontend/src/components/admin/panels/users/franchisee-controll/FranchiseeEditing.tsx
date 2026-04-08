'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { User } from '@/src/schemas/users/User'
import { useFranchises } from '@/src/hooks/franchises/useFranchises'
import {
  useAdminUpdateBasicInfo,
  useAdminUpdateProfile,
} from '@/src/hooks/users/useUserMutations'
import Accordion from '@/src/components/ui/Accordion'
import RoundedButton from '@/src/components/ui/RoundedButton'
import ModalConfirmation from '@/src/components/ui/ModalConfirmation'
import ToogleButton from '@/src/components/ui/ToogleButton'
import CitySelect from '@/src/components/ui/CitySelect'
import MultiSelect from '@/src/components/ui/MultiSelect'
import ProfileIcon from '@/src/components/icons/profileIcon'
import MailIcon from '@/src/components/icons/emailIcon'
import MarkerIcon from '@/src/components/icons/marker'
import ArrowDownIcon from '@/src/components/icons/arrowDownIcon'
import FormInput from '@/src/components/ui/FormInput'
import PhoneInput from '@/src/components/ui/PhoneInput'
import PasswordInput from '@/src/components/ui/PasswordInput'
import FormSelect from '@/src/components/ui/FormSelect'
import {
  RoleEnum,
  InvestmentRangeOptions,
  RegionOptions,
  SectorOptions,
} from '@/src/schemas/users/constants'
import {
  AdminUpdateBasicInfoSchema,
  AdminUpdateProfileSchema,
  type AdminUpdateBasicInfoInput,
  type AdminUpdateProfileInput,
} from '@/src/schemas/users/profile'
import {
  UpdateUserBasicInfoDto,
  UpdateUserProfileDto,
} from '@/src/services/users'
import { stripNonDigits } from '@/src/utils/formaters'

interface FranchiseeEditingProps {
  onClose?: () => void
  onSuccess?: () => void
  user?: User | null
}

// Helper function to convert User role to form role type
const convertRoleToFormRole = (
  role?: string,
): 'FRANCHISEE' | 'CANDIDATE' | 'ENTHUSIAST' | 'FRANCHISOR' | undefined => {
  if (
    role === 'FRANCHISEE' ||
    role === 'CANDIDATE' ||
    role === 'ENTHUSIAST' ||
    role === 'FRANCHISOR'
  ) {
    return role
  }
  return undefined
}

export default function FranchiseeEditing({
  onSuccess,
  onClose,
  user,
}: FranchiseeEditingProps) {
  const [currentStatus, setCurrentStatus] = useState(user?.isActive ?? true)
  const [showToggleModal, setShowToggleModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { franchiseOptions, isLoading: isLoadingFranchises } = useFranchises()

  const basicInfoMutation = useAdminUpdateBasicInfo({
    onSuccess: () => {
      onSuccess?.()
    },
  })

  const profileMutation = useAdminUpdateProfile({
    onSuccess: () => {
      onSuccess?.()
    },
  })

  const userFranchiseeOfIds = useMemo(
    () =>
      user?.franchiseeOf?.map((f) => (typeof f === 'string' ? f : f.id)) || [],
    [user],
  )

  // Basic Info Form
  const basicInfoForm = useForm<AdminUpdateBasicInfoInput>({
    resolver: zodResolver(AdminUpdateBasicInfoSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      password: '',
      confirmPassword: '',
    },
  })

  // Profile Form
  const profileForm = useForm<AdminUpdateProfileInput>({
    resolver: zodResolver(AdminUpdateProfileSchema),
    defaultValues: {
      city: user?.profile?.city || '',
      interestSectors: user?.profile?.interestSectors || '',
      interestRegion: user?.profile?.interestRegion || '',
      investmentRange: user?.profile?.investmentRange || '',
      role: convertRoleToFormRole(user?.role),
      franchiseeOf: userFranchiseeOfIds,
    },
  })

  useEffect(() => {
    if (user) {
      basicInfoForm.reset({
        name: user.name || '',
        email: user.email || '',
        phone: stripNonDigits(user.phone),
        password: '',
        confirmPassword: '',
      })

      profileForm.reset({
        city: user.profile?.city || '',
        interestSectors: user.profile?.interestSectors || '',
        interestRegion: user.profile?.interestRegion || '',
        investmentRange: user.profile?.investmentRange || '',
        role: convertRoleToFormRole(user.role),
        franchiseeOf: userFranchiseeOfIds,
      })

      setCurrentStatus(user.isActive ?? true)
    }
  }, [user, basicInfoForm, profileForm, userFranchiseeOfIds])

  const selectedRole = profileForm.watch('role')
  const isFranchisee = selectedRole === 'FRANCHISEE'
  const selectedFranchises = profileForm.watch('franchiseeOf') || []

  // Watch form values to pass as defaultValue to PhoneInput
  const phoneValue = basicInfoForm.watch('phone')

  async function handleBasicInfoSubmit(data: AdminUpdateBasicInfoInput) {
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

    basicInfoMutation.mutate({ userId: user.id, data: submitData })
  }

  async function handleProfileSubmit(data: AdminUpdateProfileInput) {
    if (!user?.id) return

    const submitData: UpdateUserProfileDto = {}

    if (data.city) submitData.city = data.city
    if (data.interestSectors) submitData.interestSectors = data.interestSectors
    if (data.interestRegion) submitData.interestRegion = data.interestRegion
    if (data.investmentRange) submitData.investmentRange = data.investmentRange
    if (data.role) submitData.role = data.role
    if (data.franchiseeOf) submitData.franchiseeOf = data.franchiseeOf

    profileMutation.mutate({ userId: user.id, data: submitData })
  }

  const handleToggleStatus = () => {
    setShowToggleModal(true)
  }

  const handleConfirmToggle = async () => {
    if (!user?.id) return

    const newStatus = !currentStatus

    basicInfoMutation.mutate(
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
          <span className="font-medium text-gray-900">Status do Usuário</span>
          <span className="text-sm text-gray-600">
            {currentStatus
              ? 'Usuário ativo no sistema'
              : 'Usuário inativo no sistema'}
          </span>
        </div>
        <ToogleButton
          isActive={currentStatus}
          isUpdating={basicInfoMutation.isPending}
          isTogglingStatus={basicInfoMutation.isPending}
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
            disabled={basicInfoMutation.isPending}
          />

          <FormInput
            label="E-mail"
            id="email"
            type="email"
            placeholder="seu@email.com"
            leftIcon={<MailIcon width={20} height={20} color="#747473" />}
            error={basicInfoForm.formState.errors.email?.message}
            register={basicInfoForm.register('email')}
            disabled={basicInfoMutation.isPending}
          />

          <PhoneInput
            label="Telefone (opcional)"
            id="phone"
            placeholder="(11) 99999-9999"
            error={basicInfoForm.formState.errors.phone?.message}
            register={basicInfoForm.register('phone')}
            defaultValue={phoneValue || ''}
            disabled={basicInfoMutation.isPending}
          />

          <PasswordInput
            label="Nova Senha (opcional)"
            id="password"
            error={basicInfoForm.formState.errors.password?.message}
            register={basicInfoForm.register('password')}
            disabled={basicInfoMutation.isPending}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />

          <PasswordInput
            label="Confirme a nova senha"
            id="confirmPassword"
            error={basicInfoForm.formState.errors.confirmPassword?.message}
            register={basicInfoForm.register('confirmPassword')}
            disabled={basicInfoMutation.isPending}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />

          <div className="grid w-full mt-6">
            <RoundedButton
              color="#000000"
              hoverColor="#E25E3E"
              text={
                basicInfoMutation.isPending
                  ? 'Salvando...'
                  : 'Salvar Informações Básicas'
              }
              textColor="white"
              disabled={basicInfoMutation.isPending}
            />
          </div>
        </form>
      </Accordion>

      {/* Accordion 2: Profile Information */}
      <Accordion title="Informações de Perfil" defaultOpen={false}>
        <form
          className="space-y-4"
          onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
          noValidate
        >
          <FormSelect
            label="Perfil do Usuário"
            id="role"
            leftIcon={<MarkerIcon width={20} height={20} color="#747473" />}
            rightIcon={<ArrowDownIcon width={20} height={20} />}
            error={profileForm.formState.errors.role?.message}
            register={profileForm.register('role')}
            value={profileForm.watch('role')}
            disabled={profileMutation.isPending}
            placeholder="Selecione o perfil"
            options={Object.entries(RoleEnum).map(([key, value]) => ({
              value: key,
              label: value,
            }))}
          />

          {/* City */}
          <div className="flex flex-col">
            <label htmlFor="city" className="mb-1 font-medium">
              Cidade
            </label>
            <CitySelect
              value={profileForm.watch('city')}
              onChange={(value) => profileForm.setValue('city', value)}
              error={profileForm.formState.errors.city?.message}
              placeholder="Pesquise e selecione sua cidade"
            />
          </div>

          <FormSelect
            label="Setores de Interesse"
            id="interestSectors"
            leftIcon={<MarkerIcon width={20} height={20} color="#747473" />}
            rightIcon={<ArrowDownIcon width={20} height={20} />}
            error={profileForm.formState.errors.interestSectors?.message}
            register={profileForm.register('interestSectors')}
            value={profileForm.watch('interestSectors')}
            disabled={profileMutation.isPending}
            placeholder="Selecione o setor"
            options={SectorOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />

          <FormSelect
            label="Região de Interesse"
            id="interestRegion"
            leftIcon={<MarkerIcon width={20} height={20} color="#747473" />}
            rightIcon={<ArrowDownIcon width={20} height={20} />}
            error={profileForm.formState.errors.interestRegion?.message}
            register={profileForm.register('interestRegion')}
            value={profileForm.watch('interestRegion')}
            disabled={profileMutation.isPending}
            placeholder="Selecione a região"
            options={RegionOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />

          <FormSelect
            label="Faixa de Investimento"
            id="investmentRange"
            leftIcon={<MarkerIcon width={20} height={20} color="#747473" />}
            rightIcon={<ArrowDownIcon width={20} height={20} />}
            error={profileForm.formState.errors.investmentRange?.message}
            register={profileForm.register('investmentRange')}
            value={profileForm.watch('investmentRange')}
            disabled={profileMutation.isPending}
            placeholder="Selecione a faixa"
            options={InvestmentRangeOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />

          {/* Franchises (Conditional) */}
          {isFranchisee && (
            <div className="flex flex-col">
              <label htmlFor="franchiseeOf" className="mb-1 font-medium">
                Franquias do Franqueado
              </label>
              {franchiseOptions.length > 0 ? (
                <MultiSelect
                  options={franchiseOptions}
                  value={selectedFranchises}
                  onChange={(value) =>
                    profileForm.setValue('franchiseeOf', value)
                  }
                  placeholder="Selecione as franquias"
                  error={profileForm.formState.errors.franchiseeOf?.message}
                />
              ) : (
                <div className="p-3 border border-gray-300 rounded-md bg-gray-50">
                  <span className="text-gray-500 text-sm">
                    Nenhuma franquia disponível
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="grid w-full mt-6">
            <RoundedButton
              color="#000000"
              hoverColor="#E25E3E"
              text={profileMutation.isPending ? 'Salvando...' : 'Salvar Perfil'}
              textColor="white"
              disabled={profileMutation.isPending}
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
        isLoading={basicInfoMutation.isPending}
        action={
          currentStatus ? 'desativar este usuário' : 'ativar este usuário'
        }
        text={
          currentStatus
            ? 'O usuário perderá acesso ao sistema imediatamente.'
            : 'O usuário recuperará acesso ao sistema imediatamente.'
        }
        buttonText={currentStatus ? 'Desativar' : 'Ativar'}
      />
    </div>
  )
}
