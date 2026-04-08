'use client'

import {
  ForgotPasswordEmailInput,
  ForgotPasswordEmailSchema,
} from '@/src/schemas/users/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useRequestPasswordReset } from '../../hooks/users/useUserMutations'
import MailIcon from '../icons/emailIcon'
import FormInput from '../ui/FormInput'
import RoundedButton from '../ui/RoundedButton'

interface ForgotPasswordEmailFormProps {
  onSuccess: (email: string, expiresIn?: number) => void
  onBack?: () => void
}

export default function ForgotPasswordEmailForm({
  onSuccess,
  onBack,
}: ForgotPasswordEmailFormProps) {
  const requestResetMutation = useRequestPasswordReset()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordEmailInput>({
    resolver: zodResolver(ForgotPasswordEmailSchema),
  })

  async function handleRequestReset(data: ForgotPasswordEmailInput) {
    requestResetMutation.mutate(data, {
      onSuccess: (result) => {
        if (result.success || result.rateLimited) {
          onSuccess(data.email, result.expiresIn)
        }
      },
    })
  }

  return (
    <form
      className="space-y-4 w-full"
      onSubmit={handleSubmit(handleRequestReset)}
      noValidate
    >
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600">
          Digite seu e-mail cadastrado e enviaremos um código de verificação
          para redefinir sua senha.
        </p>
      </div>

      <FormInput
        label="E-mail"
        id="email"
        type="email"
        placeholder="seu@email.com"
        leftIcon={<MailIcon width={20} height={20} color="#747473" />}
        error={errors.email?.message}
        register={register('email')}
        disabled={requestResetMutation.isPending}
        className="ring-1 rounded-sm"
        errorClassName="text-red-500"
      />

      <div className="grid w-full mt-6">
        <RoundedButton
          color="#E25E3E"
          hoverColor="#000000"
          text={
            requestResetMutation.isPending
              ? 'Enviando...'
              : 'Enviar código de verificação'
          }
          textColor="white"
          disabled={requestResetMutation.isPending}
        />
      </div>

      {onBack && (
        <div className="flex justify-center items-center text-sm mt-4">
          <button
            type="button"
            onClick={onBack}
            className="text-[#E25E3E] underline hover:text-[#E20E3E]"
          >
            Voltar para o login
          </button>
        </div>
      )}
    </form>
  )
}
