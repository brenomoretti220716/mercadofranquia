'use client'

import { ReactNode } from 'react'

type BaseModalProps = {
  tittleText: string
  subtittleText: string
  isOpen: boolean | (() => void)
  onClose: () => void
  children: ReactNode
}

export default function BaseModal({
  tittleText,
  subtittleText,
  isOpen,
  onClose,
  children,
}: BaseModalProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Background overlay */}
      <div
        className="fixed inset-0 bg-black opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div
          className="p-10 gap-5 flex flex-col bg-white relative w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header fixo */}
          <div className="">
            <h2 className="text-xl font-bold">{tittleText}</h2>
            <h3 className="font-light">{subtittleText}</h3>
          </div>

          {/* Content scrollable */}
          <div className="flex-1 overflow-y-auto p-1">{children}</div>
        </div>
      </div>
    </>
  )
}
