'use client'

import { useCallback, useState } from 'react'
import ForgotPasswordEmailForm from './ForgotPasswordEmailForm'
import ForgotPasswordNewPasswordForm from './ForgotPasswordNewPasswordForm'
import ForgotPasswordVerificationCode from './ForgotPasswordVerificationCode'

interface ForgotPasswordFlowProps {
  onClose?: () => void
}

type Step = 'email' | 'verification' | 'newPassword'

export default function ForgotPasswordFlow({
  onClose,
}: ForgotPasswordFlowProps) {
  const [currentStep, setCurrentStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [initialExpiresIn, setInitialExpiresIn] = useState<number | null>(null)

  const handleEmailSuccess = useCallback(
    (userEmail: string, expiresIn?: number) => {
      setEmail(userEmail)
      if (expiresIn) {
        setInitialExpiresIn(expiresIn)
      }
      setCurrentStep('verification')
    },
    [],
  )

  const handleVerificationSuccess = useCallback((verifiedCode: string) => {
    // Store the verified code to pass to next step
    setCode(verifiedCode)
    setCurrentStep('newPassword')
  }, [])

  const handlePasswordResetSuccess = useCallback(() => {
    // The mutation already handles redirect, so we just close the modal
    if (onClose) {
      onClose()
    }
  }, [onClose])

  const handleBackToEmail = useCallback(() => {
    setCurrentStep('email')
    setEmail('')
    setCode('')
    setInitialExpiresIn(null)
  }, [])

  const handleBackToLogin = useCallback(() => {
    if (onClose) {
      onClose()
    }
  }, [onClose])

  const renderStepIndicator = () => {
    const steps = [
      { id: 'email', label: '1. E-mail' },
      { id: 'verification', label: '2. Código' },
      { id: 'newPassword', label: '3. Nova Senha' },
    ]

    const stepOrder: Step[] = ['email', 'verification', 'newPassword']
    const currentIndex = stepOrder.indexOf(currentStep)

    return (
      <div className="flex justify-center items-center gap-2 mb-6">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
                index <= currentIndex
                  ? 'bg-[#E25E3E] text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-1 transition-colors ${
                  index < currentIndex ? 'bg-[#E25E3E]' : 'bg-gray-200'
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
      case 'email':
        return 'Recuperar Senha'
      case 'verification':
        return 'Verificação de Código'
      case 'newPassword':
        return 'Nova Senha'
      default:
        return 'Recuperar Senha'
    }
  }

  const renderSubtitle = () => {
    switch (currentStep) {
      case 'email':
        return 'Informe seu e-mail para receber o código de verificação'
      case 'verification':
        return 'Digite o código enviado para seu e-mail'
      case 'newPassword':
        return 'Crie uma nova senha para sua conta'
      default:
        return ''
    }
  }

  return (
    <div className="w-full">
      {renderStepIndicator()}

      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold mb-2">{renderTitle()}</h2>
        <p className="text-sm text-gray-600">{renderSubtitle()}</p>
      </div>

      {currentStep === 'email' && (
        <ForgotPasswordEmailForm
          onSuccess={handleEmailSuccess}
          onBack={handleBackToLogin}
        />
      )}

      {currentStep === 'verification' && (
        <ForgotPasswordVerificationCode
          email={email}
          initialExpiresIn={initialExpiresIn}
          onSuccess={handleVerificationSuccess}
          onBack={handleBackToEmail}
        />
      )}

      {currentStep === 'newPassword' && (
        <ForgotPasswordNewPasswordForm
          email={email}
          code={code}
          onSuccess={handlePasswordResetSuccess}
        />
      )}
    </div>
  )
}
