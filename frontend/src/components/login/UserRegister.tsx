import {
  CombinedRegistrationInput,
  CombinedRegistrationInputType,
} from '@/src/schemas/users/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useStepOneRegister } from '../../hooks/users/useUserMutations'
import MailIcon from '../icons/emailIcon'
import ProfileIcon from '../icons/profileIcon'
import BaseModal from '../ui/BaseModal'
import FormInput from '../ui/FormInput'
import PasswordInput from '../ui/PasswordInput'
import PhoneInput from '../ui/PhoneInput'
import RoundedButton from '../ui/RoundedButton'
import MemberVerificationCode from './MemberVerificationCode'

export default function UserRegister() {
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [pendingVerification, setPendingVerification] = useState(false)
  const [initialExpiresIn, setInitialExpiresIn] = useState<number | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const registerMutation = useStepOneRegister()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CombinedRegistrationInputType>({
    resolver: zodResolver(CombinedRegistrationInput),
  })

  async function handleRegister(data: CombinedRegistrationInputType) {
    setUserEmail(data.email)
    registerMutation.mutate(data, {
      onSuccess: (result) => {
        // Open modal on success or rate limiter (already sent code)
        if (result.success || result.rateLimited) {
          setPendingVerification(true)
          if (result.rateLimited && result.expiresIn) {
            setInitialExpiresIn(result.expiresIn)
          }
          setIsCodeModalOpen(true)
        }
      },
    })
  }

  const handleCloseCodeModal = useCallback(() => {
    setIsCodeModalOpen(false)
    // Keep pendingVerification true so user can reopen
  }, [])

  const handleVerificationSuccess = useCallback(() => {
    setIsCodeModalOpen(false)
    setPendingVerification(false)
    setUserEmail('')
    setInitialExpiresIn(null)
  }, [])

  const handleBackToForm = useCallback(() => {
    setIsCodeModalOpen(false)
    setPendingVerification(false)
    setUserEmail('')
    setInitialExpiresIn(null)
  }, [])

  const handleReopenModal = useCallback(() => {
    setIsCodeModalOpen(true)
  }, [])

  const renderStepIndicator = (currentStep: 1 | 2) => {
    const steps = [
      { id: 1, label: '1. Dados' },
      { id: 2, label: '2. Verificação' },
    ]

    return (
      <div className="flex justify-center items-center gap-2 mb-6">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
                step.id <= currentStep
                  ? 'bg-[#E25E3E] text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step.id}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-1 transition-colors ${
                  step.id < currentStep ? 'bg-[#E25E3E]' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <form
        className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 rounded-md w-full"
        onSubmit={handleSubmit(handleRegister)}
        noValidate
      >
        {renderStepIndicator(1)}

        <FormInput
          label="Nome Completo"
          id="name"
          type="text"
          placeholder="Seu nome completo"
          leftIcon={<ProfileIcon width={20} height={20} color="#747473" />}
          error={errors.name?.message}
          register={register('name')}
          disabled={registerMutation.isPending}
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
        />

        <PhoneInput
          label="Número de celular"
          id="phone"
          placeholder="(11) 99999-9999"
          error={errors.phone?.message}
          register={register('phone')}
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
            text={registerMutation.isPending ? 'Cadastrando...' : 'Cadastrar'}
            textColor="white"
            hoverColor="#E25E3E"
            disabled={registerMutation.isPending}
          />
        </div>
        <div className="flex flex-col lg:flex-row justify-center items-center text-sm">
          <h4>Já é membro?</h4>
          <Link
            href="/login"
            className="text-[#E25E3E] underline ml-1 hover:text-[#E20E3E]"
          >
            Faça login!
          </Link>
        </div>

        {pendingVerification && !isCodeModalOpen && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-md">
            <div className="flex flex-col items-center justify-between gap-2">
              <p className="text-sm text-center">
                Verificação pendente para <strong>{userEmail}</strong>
              </p>
              <button
                type="button"
                onClick={handleReopenModal}
                className="text-sm text-[#E25E3E] underline hover:text-[#E20E3E] font-medium whitespace-nowrap"
              >
                Inserir código de verificação
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Modal do código de verificação */}
      <BaseModal
        tittleText="Verificação de Código"
        subtittleText="Estamos quase lá! Digite o código enviado para seu e-mail"
        isOpen={isCodeModalOpen}
        onClose={handleCloseCodeModal}
      >
        <div className="w-full">
          {renderStepIndicator(2)}
          <MemberVerificationCode
            email={userEmail}
            initialExpiresIn={initialExpiresIn}
            onSuccess={handleVerificationSuccess}
            onBack={handleBackToForm}
          />
        </div>
      </BaseModal>
    </>
  )
}
