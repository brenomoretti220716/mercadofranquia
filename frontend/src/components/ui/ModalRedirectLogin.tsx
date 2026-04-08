'use client'

import RoundedButton from '@/src/components/ui/RoundedButton'

interface ModalRedirectLoginProps {
  isOpen: boolean
  onClose: () => void
  message?: string
  /** When false, modal cannot be closed by overlay or close button. Default true. */
  closable?: boolean
  /** When set, overlay and dialog start below this offset (e.g. 64 for header height). Keeps header clickable. */
  excludeTopHeight?: number
}

export default function ModalRedirectLogin({
  isOpen,
  onClose,
  message = 'Para adicionar esta franquia aos seus favoritos, você precisa estar logado.',
  closable = true,
  excludeTopHeight = 0,
}: ModalRedirectLoginProps) {
  if (!isOpen) return null

  const overlayStyle = {
    top: excludeTopHeight,
    left: 0,
    right: 0,
    bottom: 0,
  }

  return (
    <>
      <div
        className="fixed z-40 bg-black/50"
        style={overlayStyle}
        onClick={closable ? onClose : undefined}
      />
      <div
        className="fixed z-50 flex items-center justify-center p-4"
        style={overlayStyle}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-redirect-title"
          className="relative flex w-full max-w-lg flex-col gap-6 rounded-2xl bg-white p-8 shadow-xl"
          onClick={(event) => event.stopPropagation()}
        >
          {closable && (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 text-xl text-gray-400 transition-colors hover:text-gray-600"
              aria-label="Fechar modal"
            >
              ×
            </button>
          )}
          <div className="flex flex-col gap-2">
            <h2 id="login-redirect-title" className="text-2xl font-bold">
              Faça login
            </h2>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid w-full">
              <RoundedButton
                text="Faça login"
                color="#E25E3E"
                textColor="#FFFFFF"
                hoverTextColor="#f8f8f8"
                href="/login"
              />
            </div>
            <div className="grid w-full">
              <RoundedButton
                text="Crie uma conta gratuita"
                textColor="#E25E3E"
                borderColor="#E25E3E"
                hoverBorderColor="#C94C2E"
                hoverTextColor="#C94C2E"
                href="/cadastro"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
