'use client'

import { useUpdatePassword } from '@/src/hooks/users/useUserMutations'
import {
  UpdatePasswordInput,
  UpdatePasswordSchema,
} from '@/src/schemas/users/profile'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import PasswordInput from '../ui/PasswordInput'
import RoundedButton from '../ui/RoundedButton'

export default function PasswordUpdateForm() {
  const [showPassword, setShowPassword] = useState(false)

  const updatePassword = useUpdatePassword()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(UpdatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const handleUpdatePassword = async (data: UpdatePasswordInput) => {
    updatePassword.mutate(
      {
        password: data.password,
        confirmPassword: data.confirmPassword,
      },
      {
        onSuccess: () => {
          reset({
            password: '',
            confirmPassword: '',
          })
        },
      },
    )
  }

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(handleUpdatePassword)}
      noValidate
    >
      <PasswordInput
        label="Nova Senha"
        id="password"
        error={errors.password?.message}
        register={register('password')}
        disabled={updatePassword.isPending}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
      />

      <PasswordInput
        label="Confirme a Nova Senha"
        id="confirmPassword"
        error={errors.confirmPassword?.message}
        register={register('confirmPassword')}
        disabled={updatePassword.isPending}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
      />

      <div className="text-left mt-2">
        <p className="text-xs text-gray-500 mb-1">A senha deve conter:</p>
        <ul className="text-xs text-gray-500 list-disc list-inside space-y-0.5">
          <li>Mínimo de 6 caracteres</li>
          <li>Pelo menos uma letra maiúscula</li>
          <li>Pelo menos um número</li>
        </ul>
      </div>

      <div className="grid w-full mt-6">
        <RoundedButton
          color="#E25E3E"
          text={updatePassword.isPending ? 'Salvando...' : 'Salvar Senha'}
          textColor="white"
          loading={updatePassword.isPending}
          disabled={updatePassword.isPending}
        />
      </div>
    </form>
  )
}
