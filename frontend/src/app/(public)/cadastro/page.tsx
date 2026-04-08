'use client'

import Header from '@/src/components/header/Header'
import RegisterModalSkeleton from '@/src/components/ui/skeletons/RegisterModalSkeleton'
import dynamic from 'next/dynamic'

const RegisterFlow = dynamic(
  () => import('@/src/components/login/RegisterFlow'),
  {
    ssr: false,
    loading: () => <RegisterModalSkeleton />,
  },
)

export default function CadastroPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header variant="minimal" />
      <div className="flex flex-1 flex-col justify-center items-center px-4 py-4 sm:py-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col bg-white relative w-full h-auto rounded-2xl shadow-sm border border-border/50 p-4 sm:p-6 md:p-8">
            <RegisterFlow />
          </div>
        </div>
      </div>
    </div>
  )
}
