import { DigitCodeInput } from '@/src/components/ui/DigitCodeInput'
import {
  useRequestEmailChange,
  useVerifyEmailChange,
} from '@/src/hooks/users/useUserMutations'
import { useEffect, useRef, useState } from 'react'

interface EmailChangeVerificationCodeProps {
  newEmail: string
  initialExpiresIn?: number | null
  onSuccess?: () => void
  onBack?: () => void
}

export default function EmailChangeVerificationCode({
  newEmail,
  initialExpiresIn = null,
  onSuccess,
  onBack,
}: EmailChangeVerificationCodeProps) {
  const [code, setCode] = useState('')
  const [expiresIn, setExpiresIn] = useState<number | null>(initialExpiresIn)

  const {
    mutate: verifyEmailChange,
    isPending: isValidating,
    isSuccess: isValidatedSuccess,
    isError: isValidatedError,
    error: validationError,
  } = useVerifyEmailChange()

  const { mutate: requestEmailChange, isPending: isResendingPending } =
    useRequestEmailChange()

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isValidatedSuccess) {
      onSuccess?.()
    }
  }, [isValidatedSuccess, onSuccess])

  // Initialize timer if initialExpiresIn is provided
  useEffect(() => {
    if (initialExpiresIn !== null && initialExpiresIn > 0) {
      setExpiresIn(initialExpiresIn)

      // Start countdown timer
      timerRef.current = setInterval(() => {
        setExpiresIn((prev) => {
          if (prev !== null && prev > 0) {
            return prev - 1
          }
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          return null
        })
      }, 60000)

      // Clear timer after expiresIn minutes
      const timeout = setTimeout(() => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        setExpiresIn(null)
      }, initialExpiresIn * 60000)

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
        clearTimeout(timeout)
      }
    }
  }, [initialExpiresIn])

  const handleResend = async () => {
    requestEmailChange(
      { newEmail },
      {
        onSuccess: (data) => {
          if (data.rateLimited && data.expiresIn) {
            // Clear existing timer
            if (timerRef.current) {
              clearInterval(timerRef.current)
            }

            setExpiresIn(data.expiresIn)
            timerRef.current = setInterval(() => {
              setExpiresIn((prev) => {
                if (prev !== null && prev > 0) {
                  return prev - 1
                }
                if (timerRef.current) {
                  clearInterval(timerRef.current)
                  timerRef.current = null
                }
                return null
              })
            }, 60000)

            setTimeout(() => {
              if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
              }
              setExpiresIn(null)
            }, data.expiresIn * 60000)
          } else {
            setExpiresIn(null)
          }
        },
        onSettled: () => {},
      },
    )
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center min-h-[20vh]">
        <DigitCodeInput
          maxLength={6}
          value={code}
          onChange={(value) => setCode(value as string)}
          onComplete={(value) => {
            if (!isValidating) {
              verifyEmailChange({
                newEmail,
                code: value,
              })
            }
          }}
          disabled={isValidating}
        />

        <h3 className="text-sm text-center text-gray-500 mt-2">
          Verifique também seu email na caixa de spam.
        </h3>

        {isValidatedError && (
          <div className="text-red-500 text-sm text-center mt-2">
            {validationError instanceof Error
              ? validationError.message
              : 'Código incorreto'}
          </div>
        )}

        {expiresIn !== null && expiresIn > 0 && (
          <div className="text-sm text-center text-orange-600">
            Aguarde {expiresIn} minuto(s) antes de solicitar um novo código.
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <h4 className="text-sm text-center">Não recebeu o email?</h4>
        <button
          type="button"
          onClick={handleResend}
          disabled={isResendingPending || (expiresIn !== null && expiresIn > 0)}
          className="text-[#E25E3E] underline hover:text-[#E20E3E] cursor-pointer disabled:text-gray-400 disabled:cursor-not-allowed disabled:no-underline"
        >
          {isResendingPending ? 'Reenviando...' : 'Reenviar código'}
        </button>
        {onBack && (
          <>
            <span className="text-sm text-black-500">ou</span>
            <button
              type="button"
              onClick={onBack}
              className="text-[#E25E3E] underline hover:text-[#E20E3E] cursor-pointer"
            >
              Voltar e corrigir email
            </button>
          </>
        )}
      </div>
    </div>
  )
}
