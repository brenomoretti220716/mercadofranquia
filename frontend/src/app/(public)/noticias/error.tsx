'use client'

import Header from '@/src/components/header/Header'
import { useRouter } from 'next/navigation'

export default function Error() {
  const router = useRouter()
  return (
    <>
      <Header />
      <div className="flex flex-col items-center justify-center min-h-[40vh] p-6">
        <div className="text-red-500 text-lg mb-4">Página não encontrada.</div>
        <button
          onClick={() => router.push('/noticias')}
          className="px-4 py-2 bg-[#000000] text-white rounded-lg cursor-pointer hover:bg-[#E25E3E]"
        >
          Voltar para notícias
        </button>
      </div>
    </>
  )
}
