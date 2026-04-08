import { DigitCodeInput } from '@/src/components/ui/DigitCodeInput'
import {
  useResendMemberVerification,
  useVerifyAndCreateMember,
} from '@/src/hooks/users/useUserMutations'
import { useEffect, useRef, useState } from 'react'

interface MemberVerificationCodeProps {
  email: string
  initialExpiresIn?: number | null
  onSuccess?: () => void
  onBack?: () => void
}

export default function MemberVerificationCode({
  email,
  initialExpiresIn = null,
  onSuccess,
  onBack,
}: MemberVerificationCodeProps) {
  const [code, setCode] = useState('')
  const [expiresIn, setExpiresIn] = useState<number | null>(initialExpiresIn)

  const {
    mutate: verifyAndCreate,
    isPending: isValidating,
    isSuccess: isValidatedSuccess,
    isError: isValidatedError,
    error: validationError,
  } = useVerifyAndCreateMember()

  const { mutate: resendVerification, isPending: isResendingPending } =
    useResendMemberVerification()

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
    resendVerification(
      { email },
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
    <div className="flex flex-col items-center justify-center w-full space-y-6 px-1">
      {/* Input de código */}
      <div className="flex flex-col items-center justify-center w-full">
        <div className="flex justify-center w-full">
          <DigitCodeInput
            maxLength={6}
            value={code}
            onChange={(value) => setCode(value as string)}
            onComplete={(value) => {
              if (!isValidating) {
                verifyAndCreate({
                  email,
                  code: value,
                })
              }
            }}
            disabled={isValidating}
          />
        </div>

        <p className="text-sm text-center text-muted-foreground mt-4 max-w-md px-4">
          Verifique também seu email na caixa de spam.
        </p>

        {isValidatedError && (
          <div className="text-destructive text-sm text-center mt-3 font-medium px-4">
            {validationError instanceof Error
              ? validationError.message
              : 'Código incorreto'}
          </div>
        )}

        {expiresIn !== null && expiresIn > 0 && (
          <div className="text-sm text-center text-warning mt-3 font-medium px-4">
            Aguarde {expiresIn} minuto(s) antes de solicitar um novo código.
          </div>
        )}
      </div>

      {/* Ações de reenvio */}
      <div className="flex flex-col items-center gap-2 text-sm w-full px-4">
        <div className="flex items-center gap-1 flex-wrap justify-center">
          <span className="text-muted-foreground">Não recebeu o email?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={
              isResendingPending || (expiresIn !== null && expiresIn > 0)
            }
            className="text-primary underline hover:text-primary/80 cursor-pointer disabled:text-muted-foreground disabled:cursor-not-allowed disabled:no-underline font-medium transition-colors"
          >
            {isResendingPending ? 'Reenviando...' : 'Reenviar código'}
          </button>
        </div>

        {onBack && (
          <div className="flex items-center gap-1 flex-wrap justify-center">
            <span className="text-muted-foreground">ou</span>
            <button
              type="button"
              onClick={onBack}
              className="text-primary underline hover:text-primary/80 cursor-pointer font-medium transition-colors"
            >
              Voltar e corrigir email
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
