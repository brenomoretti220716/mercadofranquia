'use client'

import RoundedButton from '@/src/components/ui/RoundedButton'

interface ModalRedirectSeccondStepProps {
  isOpen: boolean
  onClose: () => void
}

export default function ModalRedirectSeccondStep({
  isOpen,
  onClose,
}: ModalRedirectSeccondStepProps) {
  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="complete-registration-title"
          className="relative flex w-full max-w-lg flex-col gap-6 rounded-2xl bg-white p-8 shadow-xl"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-xl text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Fechar modal"
          >
            ×
          </button>
          <div className="flex flex-col gap-2">
            <h2 id="complete-registration-title" className="text-2xl font-bold">
              Complete seu cadastro
            </h2>
            <p className="text-sm text-gray-600">
              Para adicionar esta franquia aos seus favoritos, você precisa
              completar seu cadastro.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid w-full">
              <RoundedButton
                text="Completar cadastro"
                color="#E25E3E"
                textColor="#FFFFFF"
                hoverTextColor="#f8f8f8"
                href="/login"
              />
            </div>
            <div className="grid w-full">
              <RoundedButton
                text="Cancelar"
                textColor="#E25E3E"
                borderColor="#E25E3E"
                hoverBorderColor="#C94C2E"
                hoverTextColor="#C94C2E"
                onClick={onClose}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
