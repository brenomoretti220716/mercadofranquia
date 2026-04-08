import RoundedButton from '@/src/components/ui/RoundedButton'

interface ModalConfirmationProps {
  buttonText: string
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
  action: string
  text: string
}

export default function ModalConfirmation({
  isOpen,
  onClose,
  onConfirm,
  text,
  isLoading = false,
  buttonText,
  action,
}: ModalConfirmationProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 bg-opacity-50 backdrop-blur-sm"
        onClick={() => {
          onClose()
        }}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Certeza que deseja {action}?
            </h2>
            <h3 className="text-gray-600 leading-relaxed">{text}</h3>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <RoundedButton
              text={isLoading ? 'Processando...' : buttonText}
              color="#000000"
              hoverColor="#E25E3E"
              textColor="#FFFFFF"
              onClick={onConfirm}
              disabled={isLoading}
            />
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-[#E25E3E] underline hover:text-[#E20E3E] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
