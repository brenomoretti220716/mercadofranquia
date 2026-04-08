import { LoginInput, LoginSchema } from '@/src/schemas/users/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLogin } from '../../hooks/users/useUserMutations'
import MailIcon from '../icons/emailIcon'
import BaseModal from '../ui/BaseModal'
import FormInput from '../ui/FormInput'
import PasswordInput from '../ui/PasswordInput'
import RoundedButton from '../ui/RoundedButton'
import ForgotPasswordFlow from './ForgotPasswordFlow'

export default function UserLogin() {
  const loginMutation = useLogin()
  const [showPassword, setShowPassword] = useState(false)
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] =
    useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  })

  async function handleLogin(data: LoginInput) {
    loginMutation.mutate(data)
  }

  const handleOpenForgotPassword = useCallback(() => {
    setIsForgotPasswordModalOpen(true)
  }, [])

  const handleCloseForgotPassword = useCallback(() => {
    setIsForgotPasswordModalOpen(false)
  }, [])

  return (
    <>
      <form
        className="space-y-4 w-full px-0.5"
        onSubmit={handleSubmit(handleLogin)}
        noValidate
      >
        <FormInput
          label="E-mail"
          id="email"
          type="email"
          placeholder="seu@email.com"
          leftIcon={<MailIcon width={20} height={20} color="#747473" />}
          error={errors.email?.message}
          register={register('email')}
          disabled={loginMutation.isPending}
        />

        <PasswordInput
          label="Senha"
          id="password"
          error={errors.password?.message}
          register={register('password')}
          disabled={loginMutation.isPending}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleOpenForgotPassword}
            className="text-sm text-primary underline hover:text-primary/80 transition-colors"
          >
            Esqueceu sua senha?
          </button>
        </div>

        <div className="grid w-full mt-6">
          <RoundedButton
            color="hsl(240 24% 12%)"
            hoverColor="hsl(10 79% 57%)"
            text={loginMutation.isPending ? 'Entrando...' : 'Entrar'}
            textColor="white"
            hoverTextColor="white"
            disabled={loginMutation.isPending}
          />
        </div>
        <div className="flex flex-col lg:flex-row justify-center items-center gap-1 text-sm mt-4">
          <span className="text-muted-foreground">Ainda não é membro?</span>
          <Link
            href="/cadastro"
            className="text-primary underline hover:text-primary/80 transition-colors"
          >
            Cadastre-se agora!
          </Link>
        </div>
      </form>

      {/* Modal de Recuperação de Senha - Outside the form */}
      <BaseModal
        tittleText="Recuperação de Senha"
        subtittleText="Siga os passos para redefinir sua senha"
        isOpen={isForgotPasswordModalOpen}
        onClose={handleCloseForgotPassword}
      >
        <ForgotPasswordFlow onClose={handleCloseForgotPassword} />
      </BaseModal>
    </>
  )
}
