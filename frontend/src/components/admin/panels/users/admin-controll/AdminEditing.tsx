'use client'

import MailIcon from '@/src/components/icons/emailIcon'
import ProfileIcon from '@/src/components/icons/profileIcon'
import Accordion from '@/src/components/ui/Accordion'
import FormInput from '@/src/components/ui/FormInput'
import ModalConfirmation from '@/src/components/ui/ModalConfirmation'
import PasswordInput from '@/src/components/ui/PasswordInput'
import PhoneInput from '@/src/components/ui/PhoneInput'
import RoundedButton from '@/src/components/ui/RoundedButton'
import ToogleButton from '@/src/components/ui/ToogleButton'
import { useAdminUpdateBasicInfo } from '@/src/hooks/users/useUserMutations'
import { User } from '@/src/schemas/users/User'
import { UpdateUserBasicInfoDto } from '@/src/services/users'
import { stripNonDigits } from '@/src/utils/formaters'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

interface AdminEditingProps {
  onClose?: () => void
  onSuccess?: () => void
  user?: User | null
}

// Admin Info Schema
const AdminInfoSchema = z
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

type AdminInfoInput = z.infer<typeof AdminInfoSchema>

export default function AdminEditing({
  onSuccess,
  onClose,
  user,
}: AdminEditingProps) {
  const [currentStatus, setCurrentStatus] = useState(user?.isActive ?? true)
  const [showToggleModal, setShowToggleModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const updateMutation = useAdminUpdateBasicInfo({
    onSuccess: () => {
      onSuccess?.()
    },
  })

  // Admin Info Form
  const adminInfoForm = useForm<AdminInfoInput>({
    resolver: zodResolver(AdminInfoSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (user) {
      adminInfoForm.reset({
        name: user.name || '',
        email: user.email || '',
        phone: stripNonDigits(user.phone), // Strip any formatting to ensure raw digits
        password: '',
        confirmPassword: '',
      })

      setCurrentStatus(user.isActive ?? true)
    }
  }, [user, adminInfoForm])

  // Watch form values to pass as defaultValue to PhoneInput
  const phoneValue = adminInfoForm.watch('phone')

  async function handleAdminInfoSubmit(data: AdminInfoInput) {
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

  return (
    <div className="space-y-6 py-4">
      {/* Status Toggle Section */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">
            Status do Administrador
          </span>
          <span className="text-sm text-gray-600">
            {currentStatus
              ? 'Administrador ativo no sistema'
              : 'Administrador inativo no sistema'}
          </span>
        </div>
        <ToogleButton
          isActive={currentStatus}
          isUpdating={updateMutation.isPending}
          isTogglingStatus={updateMutation.isPending}
          handleOpenToggleModal={handleToggleStatus}
        />
      </div>

      {/* Accordion: Admin Information */}
      <Accordion title="Informações do Administrador" defaultOpen={true}>
        <form
          className="space-y-4"
          onSubmit={adminInfoForm.handleSubmit(handleAdminInfoSubmit)}
          noValidate
        >
          <FormInput
            label="Nome Completo"
            id="name"
            type="text"
            placeholder="Nome completo"
            leftIcon={<ProfileIcon width={20} height={20} color="#747473" />}
            error={adminInfoForm.formState.errors.name?.message}
            register={adminInfoForm.register('name')}
            disabled={updateMutation.isPending}
          />

          <FormInput
            label="E-mail"
            id="email"
            type="email"
            placeholder="seu@email.com"
            leftIcon={<MailIcon width={20} height={20} color="#747473" />}
            error={adminInfoForm.formState.errors.email?.message}
            register={adminInfoForm.register('email')}
            disabled={updateMutation.isPending}
          />

          <PhoneInput
            label="Telefone (opcional)"
            id="phone"
            placeholder="(11) 99999-9999"
            error={adminInfoForm.formState.errors.phone?.message}
            register={adminInfoForm.register('phone')}
            defaultValue={phoneValue || ''}
            disabled={updateMutation.isPending}
          />

          <PasswordInput
            label="Nova Senha (opcional)"
            id="password"
            error={adminInfoForm.formState.errors.password?.message}
            register={adminInfoForm.register('password')}
            disabled={updateMutation.isPending}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />

          <PasswordInput
            label="Confirme a nova senha"
            id="confirmPassword"
            error={adminInfoForm.formState.errors.confirmPassword?.message}
            register={adminInfoForm.register('confirmPassword')}
            disabled={updateMutation.isPending}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />

          <div className="grid w-full mt-6">
            <RoundedButton
              color="#000000"
              hoverColor="#E25E3E"
              text={
                updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'
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
            ? 'desativar este administrador'
            : 'ativar este administrador'
        }
        text={
          currentStatus
            ? 'O administrador perderá acesso ao painel administrativo imediatamente.'
            : 'O administrador recuperará acesso ao painel administrativo imediatamente.'
        }
        buttonText={currentStatus ? 'Desativar' : 'Ativar'}
      />
    </div>
  )
}
