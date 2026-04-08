'use client'

import { useUpdateBasicInfo } from '@/src/hooks/users/useUserMutations'
import {
  UpdateBasicInfoInput,
  UpdateBasicInfoSchema,
} from '@/src/schemas/users/profile'
import { formatCPF, formatPhone, stripNonDigits } from '@/src/utils/formaters'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import IdIcon from '../icons/idIcon'
import PhoneIcon from '../icons/phoneIcon'
import ProfileIcon from '../icons/profileIcon'
import CPFInput from '../ui/CPFInput'
import FormInput from '../ui/FormInput'
import PhoneInput from '../ui/PhoneInput'
import RoundedButton from '../ui/RoundedButton'

interface BasicInfoFormProps {
  initialData?: {
    name: string
    phone: string
    cpf?: string
  }
}

export default function BasicInfoForm({ initialData }: BasicInfoFormProps) {
  const [isEditing, setIsEditing] = useState(false)

  const updateBasicInfo = useUpdateBasicInfo()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UpdateBasicInfoInput>({
    resolver: zodResolver(UpdateBasicInfoSchema),
    defaultValues: {
      name: initialData?.name || '',
      phone: initialData?.phone || '',
      cpf: initialData?.cpf || '',
    },
  })

  const phoneValue = watch('phone')
  const cpfValue = watch('cpf')

  const handleEdit = () => {
    setIsEditing(true)
    reset({
      name: initialData?.name || '',
      phone: initialData?.phone || '',
      cpf: initialData?.cpf || '',
    })
  }

  const handleCancel = () => {
    setIsEditing(false)
    reset({
      name: initialData?.name || '',
      phone: initialData?.phone || '',
      cpf: initialData?.cpf || '',
    })
  }

  const handleUpdateBasicInfo = async (data: UpdateBasicInfoInput) => {
    updateBasicInfo.mutate(
      {
        name: data.name,
        phone: stripNonDigits(data.phone),
        cpf: data.cpf ? stripNonDigits(data.cpf) : undefined,
      },
      {
        onSuccess: () => {
          setIsEditing(false)
        },
      },
    )
  }

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 py-2">
          <ProfileIcon width={20} height={20} color="#747473" />
          <div>
            <p className="text-sm text-gray-600">Nome Completo</p>
            <p className="text-base font-medium text-gray-900">
              {initialData?.name || '-'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 py-2">
          <PhoneIcon width={20} height={20} color="#747473" />
          <div>
            <p className="text-sm text-gray-600">Telefone</p>
            <p className="text-base font-medium text-gray-900">
              {formatPhone(initialData?.phone || '')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 py-2">
          <IdIcon width={20} height={20} color="#747473" />
          <div>
            <p className="text-sm text-gray-600">CPF</p>
            <p className="text-base font-medium text-gray-900">
              {initialData?.cpf ? formatCPF(initialData.cpf) : '-'}
            </p>
          </div>
        </div>

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
      onSubmit={handleSubmit(handleUpdateBasicInfo)}
      noValidate
    >
      <FormInput
        label="Nome Completo"
        id="name"
        type="text"
        placeholder="Seu nome completo"
        leftIcon={<ProfileIcon width={20} height={20} color="#747473" />}
        error={errors.name?.message}
        register={register('name')}
        disabled={updateBasicInfo.isPending}
      />

      <PhoneInput
        label="Número de celular"
        id="phone"
        placeholder="(11) 99999-9999"
        error={errors.phone?.message}
        register={register('phone')}
        defaultValue={phoneValue || ''}
        disabled={updateBasicInfo.isPending}
      />

      <CPFInput
        label="CPF"
        id="cpf"
        placeholder="000.000.000-00"
        error={errors.cpf?.message}
        register={register('cpf')}
        defaultValue={cpfValue || ''}
        disabled={updateBasicInfo.isPending}
      />

      <div className="flex gap-2 mt-6">
        <RoundedButton
          color="#6B7280"
          text="Cancelar"
          textColor="white"
          type="button"
          onClick={handleCancel}
          disabled={updateBasicInfo.isPending}
        />
        <RoundedButton
          color="#E25E3E"
          text={updateBasicInfo.isPending ? 'Salvando...' : 'Salvar Alterações'}
          textColor="white"
          loading={updateBasicInfo.isPending}
          disabled={updateBasicInfo.isPending}
        />
      </div>
    </form>
  )
}
