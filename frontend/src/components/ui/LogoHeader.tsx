'use client'

import Image from 'next/image'
import Link from 'next/link'

interface LogoHeaderProps {
  dark?: boolean
}

export default function LogoHeader({ dark }: LogoHeaderProps) {
  return (
    <Link href="/" className="flex items-center gap-1">
      {dark ? (
        <div className="lg:w-50">
          <Image
            src="/assets/MercadoFranquiaBlack.png"
            alt="Logo"
            width={100}
            height={100}
          />
        </div>
      ) : (
        <div className="lg:w-50">
          <Image
            src="/assets/MercadoFranquia.png"
            alt="Logo"
            width={100}
            height={100}
          />
        </div>
      )}
    </Link>
  )
}
