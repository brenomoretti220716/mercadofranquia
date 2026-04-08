import MailIcon from '@/src/components/icons/emailIcon'
import ProfileIcon from '@/src/components/icons/profileIcon'
import CPFInput from '@/src/components/ui/CPFInput'
import FormInput from '@/src/components/ui/FormInput'
import PasswordInput from '@/src/components/ui/PasswordInput'
import PhoneInput from '@/src/components/ui/PhoneInput'
import RoundedButton from '@/src/components/ui/RoundedButton'
import { useAdminRegister } from '@/src/hooks/users/useUserMutations'
import {
  AdminRegisterInput,
  AdminRegisterSchema,
} from '@/src/schemas/users/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface AdminRegisterProps {
  onClose?: () => void
  onSuccess?: () => void
}

export default function AdminRegister({
  onClose,
  onSuccess,
}: AdminRegisterProps) {
  const [showPassword, setShowPassword] = useState(false)
  const registerMutation = useAdminRegister()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AdminRegisterInput>({
    resolver: zodResolver(AdminRegisterSchema),
  })

  async function handleAdmin(data: AdminRegisterInput) {
    // PhoneInput and CPFInput already store raw digits in form state, so we can use data directly
    registerMutation.mutate(data, {
      onSuccess: () => {
        reset()
        onSuccess?.()
        onClose?.()
      },
    })
  }

  return (
    <form
      className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 rounded-md w-full"
      onSubmit={handleSubmit(handleAdmin)}
      noValidate
    >
      <FormInput
        label="Nome"
        id="name"
        type="text"
        placeholder="Preencha o seu nome completo"
        leftIcon={<ProfileIcon width={20} height={20} color="#747473" />}
        error={errors.name?.message}
        register={register('name')}
        disabled={registerMutation.isPending}
        errorClassName="text-red-500"
      />

      <FormInput
        label="E-mail"
        id="email"
        type="email"
        placeholder="seu@email.com"
        leftIcon={<MailIcon width={20} height={20} color="#747473" />}
        error={errors.email?.message}
        register={register('email')}
        disabled={registerMutation.isPending}
        errorClassName="text-red-500"
      />

      <PhoneInput
        label="Telefone"
        id="phone"
        placeholder="(11) 99999-9999"
        error={errors.phone?.message}
        register={register('phone')}
        disabled={registerMutation.isPending}
      />

      <CPFInput
        label="CPF"
        id="cpf"
        placeholder="000.000.000-00"
        error={errors.cpf?.message}
        register={register('cpf')}
        disabled={registerMutation.isPending}
      />

      <PasswordInput
        label="Senha"
        id="password"
        error={errors.password?.message}
        register={register('password')}
        disabled={registerMutation.isPending}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
      />

      <PasswordInput
        label="Confirme sua senha"
        id="confirmPassword"
        error={errors.confirmPassword?.message}
        register={register('confirmPassword')}
        disabled={registerMutation.isPending}
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

      <div className="grid w-full mt-8">
        <RoundedButton
          color="#000000"
          hoverColor="#E25E3E"
          text={registerMutation.isPending ? 'Cadastrando...' : 'Cadastrar'}
          textColor="white"
          disabled={registerMutation.isPending}
        />
      </div>
      <div className="flex justify-center text-sm">
        <a
          onClick={onClose}
          className="text-[#E25E3E] underline ml-1 hover:text-[#E20E3E] cursor-pointer"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}
