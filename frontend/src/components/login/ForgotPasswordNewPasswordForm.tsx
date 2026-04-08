'use client'

import {
  ResetPasswordInput,
  ResetPasswordSchema,
} from '@/src/schemas/users/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useResetPassword } from '../../hooks/users/useUserMutations'
import PasswordInput from '../ui/PasswordInput'
import RoundedButton from '../ui/RoundedButton'

interface ForgotPasswordNewPasswordFormProps {
  email: string
  code: string
  onSuccess?: () => void
}

export default function ForgotPasswordNewPasswordForm({
  email,
  code,
  onSuccess,
}: ForgotPasswordNewPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const resetPasswordMutation = useResetPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const handleResetPassword = async (data: ResetPasswordInput) => {
    resetPasswordMutation.mutate(
      {
        email,
        code,
        password: data.password,
        confirmPassword: data.confirmPassword,
      },
      {
        onSuccess: () => {
          if (onSuccess) {
            onSuccess()
          }
        },
      },
    )
  }

  return (
    <form
      className="space-y-4 w-full"
      onSubmit={handleSubmit(handleResetPassword)}
      noValidate
    >
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600">
          Digite sua nova senha. Após confirmar, você será automaticamente
          conectado à sua conta.
        </p>
      </div>

      <PasswordInput
        label="Nova Senha"
        id="password"
        error={errors.password?.message}
        register={register('password')}
        disabled={resetPasswordMutation.isPending}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        className="ring-1 rounded-sm"
      />

      <PasswordInput
        label="Confirme a Nova Senha"
        id="confirmPassword"
        error={errors.confirmPassword?.message}
        register={register('confirmPassword')}
        disabled={resetPasswordMutation.isPending}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        className="ring-1 rounded-sm"
      />

      <div className="grid w-full mt-6">
        <RoundedButton
          color="#E25E3E"
          hoverColor="#000000"
          text={
            resetPasswordMutation.isPending
              ? 'Salvando...'
              : 'Salvar nova senha'
          }
          textColor="white"
          loading={resetPasswordMutation.isPending}
          disabled={resetPasswordMutation.isPending}
        />
      </div>

      <div className="text-left mt-4">
        <p className="text-xs text-gray-500 mb-1">A senha deve conter:</p>
        <ul className="text-xs text-gray-500 list-disc list-inside space-y-0.5">
          <li>Mínimo de 6 caracteres</li>
          <li>Pelo menos uma letra maiúscula</li>
          <li>Pelo menos um número</li>
        </ul>
      </div>
    </form>
  )
}
