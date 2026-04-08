'use client'

import { useFranchises } from '@/src/hooks/franchises/useFranchises'
import { isFranchisor, useAuthContext } from '@/src/hooks/users/useAuth'
import {
  useStepTwoRegister,
  useUpdateProfile,
} from '@/src/hooks/users/useUserMutations'
import {
  StepTwoRegistrationInput,
  StepTwoRegistrationSchema,
} from '@/src/schemas/users/auth'
import {
  InvestmentRangeOptions,
  RegionOptions,
  RoleEnum,
  SectorOptions,
} from '@/src/schemas/users/constants'
import {
  UpdateProfileInput,
  UpdateProfileSchema,
} from '@/src/schemas/users/profile'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import ArrowDownIcon from '../icons/arrowDownIcon'
import MarkerIcon from '../icons/marker'
import CitySelect from '../ui/CitySelect'
import FormSelect from '../ui/FormSelect'
import MultiSelect from '../ui/MultiSelect'
import RoundedButton from '../ui/RoundedButton'

interface ProfileCompletionFormProps {
  mode?: 'register' | 'update'
  initialData?: {
    role?: 'FRANCHISEE' | 'CANDIDATE' | 'ENTHUSIAST' | 'FRANCHISOR'
    city?: string
    interestSectors?: string
    interestRegion?: string
    investmentRange?: string
    franchiseeOf?: string[]
  }
  onSuccess?: () => void
}

export default function ProfileCompletionForm({
  mode = 'register',
  initialData,
  onSuccess,
}: ProfileCompletionFormProps) {
  const [isEditing, setIsEditing] = useState(mode === 'register')
  const { payload, revalidate } = useAuthContext()

  const stepTwoMutation = useStepTwoRegister({
    onSuccess: () => {
      // Trigger auth context revalidation to update role information
      revalidate()
      if (onSuccess) {
        onSuccess()
      }
    },
  })

  const canChangeRole = isFranchisor(payload)

  const updateProfileMutation = useUpdateProfile({
    onSuccess: () => {
      // Trigger auth context revalidation to update role information
      revalidate()
      setIsEditing(false)
      if (onSuccess) {
        onSuccess()
      }
    },
  })

  const mutation = mode === 'register' ? stepTwoMutation : updateProfileMutation

  const handleEdit = () => {
    setIsEditing(true)
    if (initialData) {
      reset({
        role: initialData.role,
        city: initialData.city || '',
        interestSectors: initialData.interestSectors || '',
        interestRegion: initialData.interestRegion || '',
        investmentRange: initialData.investmentRange || '',
        franchiseeOf: initialData.franchiseeOf || [],
      })
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (initialData) {
      reset({
        role: initialData.role,
        city: initialData.city || '',
        interestSectors: initialData.interestSectors || '',
        interestRegion: initialData.interestRegion || '',
        investmentRange: initialData.investmentRange || '',
        franchiseeOf: initialData.franchiseeOf || [],
      })
    }
  }

  const schema =
    mode === 'register' ? StepTwoRegistrationSchema : UpdateProfileSchema

  const { franchiseOptions } = useFranchises()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<StepTwoRegistrationInput | UpdateProfileInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: undefined,
      city: '',
      interestSectors: '',
      interestRegion: '',
      investmentRange: '',
      franchiseeOf: [],
    },
  })

  useEffect(() => {
    if (initialData) {
      reset({
        role: initialData.role,
        city: initialData.city || '',
        interestSectors: initialData.interestSectors || '',
        interestRegion: initialData.interestRegion || '',
        investmentRange: initialData.investmentRange || '',
        franchiseeOf: initialData.franchiseeOf || [],
      })
    }
  }, [initialData, reset])

  const selectedRole = watch('role')
  const isFranchisee = selectedRole === 'FRANCHISEE'
  const selectedFranchises = watch('franchiseeOf') || []

  async function handleProfileCompletion(
    data: StepTwoRegistrationInput | UpdateProfileInput,
  ) {
    if (mode === 'register') {
      stepTwoMutation.mutate(data as StepTwoRegistrationInput)
    } else {
      updateProfileMutation.mutate(data as UpdateProfileInput)
    }
  }

  // Helper function to get label from value
  const getRoleLabel = (role?: string) => {
    if (!role) return '-'
    return RoleEnum[role as keyof typeof RoleEnum] || role
  }

  const getSectorLabel = (value?: string) => {
    if (!value) return '-'
    const option = SectorOptions.find((opt) => opt.value === value)
    return option?.label || value
  }

  const getRegionLabel = (value?: string) => {
    if (!value) return '-'
    const option = RegionOptions.find((opt) => opt.value === value)
    return option?.label || value
  }

  const getInvestmentLabel = (value?: string) => {
    if (!value) return '-'
    const option = InvestmentRangeOptions.find((opt) => opt.value === value)
    return option?.label || value
  }

  const getFranchiseNames = (franchiseIds?: string[]) => {
    if (!franchiseIds || franchiseIds.length === 0) return '-'
    return franchiseIds
      .map((id) => {
        const franchise = franchiseOptions.find((opt) => opt.value === id)
        return franchise?.label || id
      })
      .join(', ')
  }

  if (!isEditing && mode === 'update') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 py-2">
          <MarkerIcon width={20} height={20} color="#747473" />
          <div>
            <p className="text-sm text-gray-600">Perfil</p>
            <p className="text-base font-medium text-gray-900">
              {getRoleLabel(initialData?.role)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 py-2">
          <MarkerIcon width={20} height={20} color="#747473" />
          <div>
            <p className="text-sm text-gray-600">Cidade</p>
            <p className="text-base font-medium text-gray-900">
              {initialData?.city || '-'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 py-2">
          <MarkerIcon width={20} height={20} color="#747473" />
          <div>
            <p className="text-sm text-gray-600">Setores de Interesse</p>
            <p className="text-base font-medium text-gray-900">
              {getSectorLabel(initialData?.interestSectors)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 py-2">
          <MarkerIcon width={20} height={20} color="#747473" />
          <div>
            <p className="text-sm text-gray-600">Região de Interesse</p>
            <p className="text-base font-medium text-gray-900">
              {getRegionLabel(initialData?.interestRegion)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 py-2">
          <MarkerIcon width={20} height={20} color="#747473" />
          <div>
            <p className="text-sm text-gray-600">Faixa de Investimento</p>
            <p className="text-base font-medium text-gray-900">
              {getInvestmentLabel(initialData?.investmentRange)}
            </p>
          </div>
        </div>

        {initialData?.role === 'FRANCHISEE' && (
          <div className="flex items-center gap-3 py-2">
            <MarkerIcon width={20} height={20} color="#747473" />
            <div>
              <p className="text-sm text-gray-600">Franquias que Possui</p>
              <p className="text-base font-medium text-gray-900">
                {getFranchiseNames(initialData?.franchiseeOf)}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <RoundedButton
            color="#E25E3E"
            text="Editar"
            textColor="white"
            onClick={handleEdit}
          />
        </div>
      </div>
    )
  }

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(handleProfileCompletion)}
      noValidate
    >
      <FormSelect
        label="Qual é o seu perfil?"
        id="role"
        leftIcon={<MarkerIcon width={20} height={20} color="#747473" />}
        rightIcon={<ArrowDownIcon width={20} height={20} />}
        error={errors.role?.message}
        register={register('role')}
        value={watch('role')}
        disabled={mutation.isPending || canChangeRole}
        placeholder="Selecione seu perfil"
        options={Object.entries(RoleEnum).map(([key, value]) => ({
          value: key,
          label: value,
        }))}
      />

      <div className="flex flex-col">
        <label htmlFor="city" className="mb-1 font-medium">
          Cidade
        </label>
        <CitySelect
          value={watch('city')}
          onChange={(value) => setValue('city', value)}
          error={errors.city?.message}
          placeholder="Pesquise e selecione sua cidade"
        />
      </div>

      <FormSelect
        label="Setores de Interesse"
        id="interestSectors"
        leftIcon={<MarkerIcon width={20} height={20} color="#747473" />}
        rightIcon={<ArrowDownIcon width={20} height={20} />}
        error={errors.interestSectors?.message}
        register={register('interestSectors')}
        value={watch('interestSectors')}
        disabled={mutation.isPending}
        placeholder="Selecione o setor de interesse"
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
        error={errors.interestRegion?.message}
        register={register('interestRegion')}
        value={watch('interestRegion')}
        disabled={mutation.isPending}
        placeholder="Selecione a região de interesse"
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
        error={errors.investmentRange?.message}
        register={register('investmentRange')}
        value={watch('investmentRange')}
        disabled={mutation.isPending}
        placeholder="Selecione a faixa de investimento"
        options={InvestmentRangeOptions.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
      />

      {/* Campo condicional para FRANCHISEE */}
      {isFranchisee && (
        <div className="flex flex-col">
          <label htmlFor="franchiseeOf" className="mb-1 font-medium">
            Selecione a(s) franquia(s) que você possui
          </label>

          {franchiseOptions.length > 0 ? (
            <MultiSelect
              options={franchiseOptions}
              value={selectedFranchises}
              onChange={(value) => setValue('franchiseeOf', value)}
              placeholder="Selecione as franquias"
              error={errors.franchiseeOf?.message}
            />
          ) : (
            <div className="p-3 border border-gray-300 rounded-md bg-gray-50">
              <span className="text-gray-500 text-sm">
                Nenhuma franquia disponível no momento
              </span>
            </div>
          )}

          {errors.franchiseeOf && (
            <div className="text-red-500 text-sm mt-1">
              {errors.franchiseeOf.message}
            </div>
          )}
        </div>
      )}

      {mode === 'register' ? (
        <div className="grid w-full mt-6">
          <RoundedButton
            color="#E25E3E"
            text={mutation.isPending ? 'Salvando...' : 'Completar Perfil'}
            textColor="white"
            loading={mutation.isPending}
            disabled={mutation.isPending}
          />
        </div>
      ) : (
        <div className="flex gap-2 mt-6">
          <RoundedButton
            color="#6B7280"
            text="Cancelar"
            textColor="white"
            type="button"
            onClick={handleCancel}
            disabled={mutation.isPending}
          />
          <RoundedButton
            color="#E25E3E"
            text={mutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            textColor="white"
            loading={mutation.isPending}
            disabled={mutation.isPending}
          />
        </div>
      )}
    </form>
  )
}
