'use client'

import {
  CombinedRegistrationInputType,
  StepOneRegistrationInput,
  StepOneRegistrationSchema,
  StepTwoRegistrationBasicInput,
  StepTwoRegistrationBasicSchema,
} from '@/src/schemas/users/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useQueryState } from 'nuqs'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useStepOneRegister } from '../../hooks/users/useUserMutations'
import MailIcon from '../icons/emailIcon'
import PhoneIcon from '../icons/phoneIcon'
import ProfileIcon from '../icons/profileIcon'
import FormInput from '../ui/FormInput'
import PasswordInput from '../ui/PasswordInput'
import PhoneInput from '../ui/PhoneInput'
import RoundedButton from '../ui/RoundedButton'
import MemberVerificationCode from './MemberVerificationCode'

type Step = 'step1' | 'step2' | 'verification'

const PENDING_VERIFICATION_KEY = 'pendingVerification'

export default function RegisterFlow() {
  const [currentStep, setCurrentStep] = useState<Step>('step1')
  const [userEmail, setUserEmail] = useQueryState('email', {
    defaultValue: '',
  })
  const [initialExpiresIn, setInitialExpiresIn] = useState<number | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [hasPendingVerification, setHasPendingVerification] = useState(false)
  const [step1Data, setStep1Data] = useState<StepOneRegistrationInput | null>(
    null,
  )
  const registerMutation = useStepOneRegister()

  // Form for Step 1: Email, Password, Confirm Password
  const step1Form = useForm<StepOneRegistrationInput>({
    resolver: zodResolver(StepOneRegistrationSchema),
    defaultValues: {
      email: userEmail || '',
      password: '',
      confirmPassword: '',
    },
  })

  // Form for Step 2: Name, Phone
  const step2Form = useForm<StepTwoRegistrationBasicInput>({
    resolver: zodResolver(StepTwoRegistrationBasicSchema),
    defaultValues: {
      name: '',
      phone: '',
    },
  })

  // Pre-fill email from URL param if available
  useEffect(() => {
    if (userEmail) {
      step1Form.setValue('email', userEmail)
    }
  }, [userEmail, step1Form])

  // Check for pending verification on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pending = localStorage.getItem(PENDING_VERIFICATION_KEY)
      if (pending) {
        try {
          const data = JSON.parse(pending)
          setUserEmail(data.email)
          setHasPendingVerification(true)
        } catch (error) {
          console.error('Error parsing pending verification:', error)
          localStorage.removeItem(PENDING_VERIFICATION_KEY)
        }
      }
    }
  }, [setUserEmail])

  // Handle Step 1 submission - move to Step 2
  const handleStep1Submit = useCallback((data: StepOneRegistrationInput) => {
    setStep1Data(data)
    setCurrentStep('step2')
  }, [])

  // Handle Step 2 submission - combine data and submit
  const handleStep2Submit = useCallback(
    (data: StepTwoRegistrationBasicInput) => {
      if (!step1Data) return

      const combinedData: CombinedRegistrationInputType = {
        ...step1Data,
        ...data,
      }

      setUserEmail(combinedData.email)
      registerMutation.mutate(combinedData, {
        onSuccess: (result) => {
          if (result.success || result.rateLimited) {
            if (result.rateLimited && result.expiresIn) {
              setInitialExpiresIn(result.expiresIn)
            }
            // Save to localStorage for recovery
            if (typeof window !== 'undefined') {
              localStorage.setItem(
                PENDING_VERIFICATION_KEY,
                JSON.stringify({ email: combinedData.email }),
              )
            }
            setCurrentStep('verification')
          }
        },
      })
    },
    [step1Data, registerMutation, setUserEmail],
  )

  // Handle back to Step 1
  const handleBackToStep1 = useCallback(() => {
    setCurrentStep('step1')
  }, [])

  const handleVerificationSuccess = useCallback(() => {
    // Clear pending verification from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PENDING_VERIFICATION_KEY)
    }
    setHasPendingVerification(false)
    // Redirect will happen automatically from the mutation
  }, [])

  const handleBackToForm = useCallback(() => {
    setCurrentStep('step1')
    setStep1Data(null)
    setUserEmail('')
    setInitialExpiresIn(null)
    setHasPendingVerification(false)
    step1Form.reset()
    step2Form.reset()
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PENDING_VERIFICATION_KEY)
    }
  }, [setUserEmail, step1Form, step2Form])

  const handleContinueVerification = useCallback(() => {
    setCurrentStep('verification')
    setHasPendingVerification(false)
  }, [])

  const renderStepIndicator = () => {
    const steps = [
      { id: 'step1', label: '1. Credenciais', stepNumber: 1 },
      { id: 'step2', label: '2. Dados', stepNumber: 2 },
      { id: 'verification', label: '3. Verificação', stepNumber: 3 },
    ]

    const stepOrder: Step[] = ['step1', 'step2', 'verification']
    const currentIndex = stepOrder.indexOf(currentStep)

    return (
      <div className="flex justify-center items-center gap-2 mb-4 sm:mb-6">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
                index <= currentIndex
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step.stepNumber}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-8 sm:w-12 h-0.5 mx-1 transition-colors ${
                  index < currentIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderTitle = () => {
    switch (currentStep) {
      case 'step1':
        return 'Crie sua conta'
      case 'step2':
        return 'Complete seu cadastro'
      case 'verification':
        return 'Verificação de Código'
      default:
        return 'Crie sua conta'
    }
  }

  const renderSubtitle = () => {
    switch (currentStep) {
      case 'step1':
        return 'Comece criando suas credenciais de acesso'
      case 'step2':
        return 'Agora precisamos de algumas informações pessoais'
      case 'verification':
        return 'Estamos quase lá! Digite o código enviado para seu e-mail'
      default:
        return ''
    }
  }

  return (
    <div className="w-full">
      {renderStepIndicator()}

      <div className="mb-4 sm:mb-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          {renderTitle()}
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          {renderSubtitle()}
        </p>
      </div>

      {currentStep === 'step1' && (
        <form
          className="space-y-4 w-full px-0.5"
          onSubmit={step1Form.handleSubmit(handleStep1Submit)}
          noValidate
        >
          <FormInput
            label="E-mail"
            id="email"
            type="email"
            placeholder="seu@email.com"
            leftIcon={<MailIcon width={20} height={20} color="#747473" />}
            error={step1Form.formState.errors.email?.message}
            register={step1Form.register('email')}
            disabled={registerMutation.isPending}
          />

          <PasswordInput
            label="Senha"
            id="password"
            error={step1Form.formState.errors.password?.message}
            register={step1Form.register('password')}
            disabled={registerMutation.isPending}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />

          <PasswordInput
            label="Confirme sua senha"
            id="confirmPassword"
            error={step1Form.formState.errors.confirmPassword?.message}
            register={step1Form.register('confirmPassword')}
            disabled={registerMutation.isPending}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />

          <div className="text-left mt-2">
            <p className="text-xs text-muted-foreground mb-1">
              A senha deve conter:
            </p>
            <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
              <li>Mínimo de 6 caracteres</li>
              <li>Pelo menos uma letra maiúscula</li>
              <li>Pelo menos um número</li>
            </ul>
          </div>

          <div className="grid w-full mt-6">
            <RoundedButton
              color="hsl(240 24% 12%)"
              hoverColor="hsl(10 79% 57%)"
              text="Continuar"
              textColor="white"
              hoverTextColor="white"
              disabled={registerMutation.isPending}
            />
          </div>

          <div className="flex flex-col lg:flex-row justify-center items-center gap-1 text-sm mt-4">
            <span className="text-muted-foreground">Já é membro?</span>
            <Link
              href="/login"
              className="text-primary underline hover:text-primary/80 transition-colors"
            >
              Faça login!
            </Link>
          </div>

          {hasPendingVerification && (
            <div className="mt-4 p-4 bg-accent border border-primary/20 rounded-md">
              <div className="flex flex-col items-center justify-between gap-2">
                <p className="text-sm text-center text-foreground">
                  Verificação pendente para <strong>{userEmail}</strong>
                </p>
                <button
                  type="button"
                  onClick={handleContinueVerification}
                  className="text-sm text-primary underline hover:text-primary/80 font-medium whitespace-nowrap transition-colors"
                >
                  Inserir código de verificação
                </button>
              </div>
            </div>
          )}
        </form>
      )}

      {currentStep === 'step2' && (
        <form
          className="space-y-4 w-full px-0.5"
          onSubmit={step2Form.handleSubmit(handleStep2Submit)}
          noValidate
        >
          <FormInput
            label="Nome Completo"
            id="name"
            type="text"
            placeholder="Seu nome completo"
            leftIcon={<ProfileIcon width={20} height={20} color="#747473" />}
            error={step2Form.formState.errors.name?.message}
            register={step2Form.register('name')}
            disabled={registerMutation.isPending}
          />

          <PhoneInput
            label="Número de celular"
            id="phone"
            placeholder="(11) 99999-9999"
            leftIcon={<PhoneIcon width={20} height={20} color="#747473" />}
            error={step2Form.formState.errors.phone?.message}
            register={step2Form.register('phone')}
            disabled={registerMutation.isPending}
          />

          <div className="grid grid-cols-2 gap-3 mt-6">
            <RoundedButton
              color="#000000"
              hoverColor="hsl(10 79% 57%)"
              text="Voltar"
              textColor="white"
              hoverTextColor="white"
              onClick={handleBackToStep1}
              type="button"
            />
            <RoundedButton
              color="#000000"
              hoverColor="hsl(10 79% 57%)"
              text={registerMutation.isPending ? 'Cadastrando...' : 'Cadastrar'}
              textColor="white"
              hoverTextColor="white"
              disabled={registerMutation.isPending}
            />
          </div>
        </form>
      )}

      {currentStep === 'verification' && (
        <MemberVerificationCode
          email={userEmail}
          initialExpiresIn={initialExpiresIn}
          onSuccess={handleVerificationSuccess}
          onBack={handleBackToForm}
        />
      )}
    </div>
  )
}
