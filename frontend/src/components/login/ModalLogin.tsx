'use client'

import { ReactNode } from 'react'

type ModalLoginProps = {
  tittleText: string
  subtittleText: string
  children: ReactNode
}

export default function ModalLogin({
  tittleText,
  subtittleText,
  children,
}: ModalLoginProps) {
  return (
    <div className="flex flex-col bg-white relative w-full h-auto rounded-2xl shadow-sm border border-border/50 p-4 sm:p-6 md:p-8">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          {tittleText}
        </h2>
        <h3 className="text-sm sm:text-base font-normal text-muted-foreground">
          {subtittleText}
        </h3>
      </div>
      <div className="flex justify-center w-full">{children}</div>
    </div>
  )
}
