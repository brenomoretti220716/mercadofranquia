interface ToogleButtonProps {
  isActive: boolean
  isUpdating: boolean
  isTogglingStatus: boolean
  handleOpenToggleModal: () => void
  /** When true, button is disabled (e.g. max limit reached for sponsored) */
  disabled?: boolean
}

export default function ToogleButton({
  isActive,
  isUpdating,
  isTogglingStatus,
  handleOpenToggleModal,
  disabled: disabledProp = false,
}: ToogleButtonProps) {
  const disabled = disabledProp || isUpdating || isTogglingStatus
  return (
    <button
      type="button"
      onClick={handleOpenToggleModal}
      disabled={disabled}
      className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#E25E3E] focus:ring-offset-2
          ${isActive ? 'bg-[#22C55E] hover:bg-[#16A34A]' : 'bg-gray-200 hover:bg-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${isActive ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  )
}
