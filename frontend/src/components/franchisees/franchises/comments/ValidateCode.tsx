import { DigitCodeInput } from '@/src/components/ui/DigitCodeInput'
import { useValidateCode } from '@/src/hooks/reviews/useReviewMutations'
import { useEffect, useState } from 'react'

interface ValidateCodeProps {
  franchiseId: string
  email: string
  onSuccess?: () => void
  onError?: () => void
  onBack?: () => void
}

export default function ValidateCode({
  franchiseId,
  email,
  onSuccess,
  onError,
  onBack,
}: ValidateCodeProps) {
  const [code, setCode] = useState('')

  const {
    mutate: validateCode,
    isPending: isValidating,
    isSuccess: isValidatedSuccess,
    isError: isValidatedError,
    error: validationError,
  } = useValidateCode()

  useEffect(() => {
    if (isValidatedSuccess) {
      onSuccess?.()
    }
  }, [isValidatedSuccess, onSuccess])

  useEffect(() => {
    if (isValidatedError) {
      onError?.()
    }
  }, [isValidatedError, onError])

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center min-h-[30vh]">
        <DigitCodeInput
          maxLength={6}
          value={code}
          onChange={(value) => setCode(value as string)}
          onComplete={(value) => {
            if (!isValidating) {
              validateCode({
                franchiseId,
                code: value,
                email,
              })
            }
          }}
          disabled={isValidating}
        />

        <h3 className="text-sm text-center text-gray-500 mt-2">
          Verifique também seu email na caixa de spam.
        </h3>

        {isValidatedError && (
          <div className="text-red-500 text-sm text-center">
            {validationError instanceof Error
              ? validationError.message
              : 'Código incorreto'}
          </div>
        )}
      </div>

      <h4 className="text-sm text-center">
        Email não chegou?
        <a
          className="text-[#E25E3E] underline ml-1 hover:text-[#E20E3E] cursor-pointer"
          onClick={() => onBack?.()}
        >
          Tente novamente.
        </a>
      </h4>
    </div>
  )
}
