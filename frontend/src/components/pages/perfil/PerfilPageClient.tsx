'use client'

import BasicInfoForm from '@/src/components/login/BasicInfoForm'
import EmailUpdateForm from '@/src/components/login/EmailUpdateForm'
import { FranchisorRequestAccordion } from '@/src/components/login/FranchisorRequestAccordion'
import PasswordUpdateForm from '@/src/components/login/PasswordUpdateForm'
import ProfileCompletionForm from '@/src/components/login/ProfileCompletionForm'
import Accordion from '@/src/components/ui/Accordion'
import PerfilPageSkeleton from '@/src/components/ui/skeletons/PerfilPageSkeleton'
import { isMember, useAuthContext } from '@/src/hooks/users/useAuth'
import { useGetMe } from '@/src/hooks/users/useUserMutations'
import { useRouter } from 'next/navigation'
import ProfileProgressBar from './ProfileProgressBar'

export default function PerfilPageClient() {
  const { payload: contextPayload, revalidate, isValidating } = useAuthContext()
  const router = useRouter()

  const validateMember = isMember(contextPayload)
  const { data: user, isLoading: isLoadingUser } = useGetMe()

  // Mostrar skeleton enquanto está carregando
  if (isValidating || isLoadingUser || !contextPayload || !user) {
    return <PerfilPageSkeleton />
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-600">
          Gerencie suas informações pessoais e preferências
        </p>
      </div>

      <ProfileProgressBar />

      <div className="space-y-4">
        <Accordion title="Informações Básicas" defaultOpen={false}>
          <BasicInfoForm
            initialData={{
              name: user.name,
              phone: user.phone || '',
              cpf: user.cpf || '',
            }}
          />
        </Accordion>

        <Accordion title="Alterar E-mail" defaultOpen={false}>
          <EmailUpdateForm initialEmail={user.email} />
        </Accordion>

        <Accordion title="Alterar Senha" defaultOpen={false}>
          <PasswordUpdateForm />
        </Accordion>

        <Accordion
          title={validateMember ? 'Completar Perfil' : 'Informações do Perfil'}
          defaultOpen
          toComplete={validateMember}
        >
          {validateMember && (
            <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
              <p className="text-sm text-orange-600">
                Complete seu perfil para ter uma experiência personalizada e
                receber recomendações de franquias que se adequam ao seu perfil.
              </p>
            </div>
          )}

          <ProfileCompletionForm
            mode={validateMember ? 'register' : 'update'}
            initialData={{
              role: [
                'FRANCHISEE',
                'CANDIDATE',
                'ENTHUSIAST',
                'FRANCHISOR',
              ].includes(user.role)
                ? (user.role as
                    | 'FRANCHISEE'
                    | 'CANDIDATE'
                    | 'ENTHUSIAST'
                    | 'FRANCHISOR')
                : undefined,
              city: user.profile?.city,
              interestSectors: user.profile?.interestSectors || '',
              interestRegion: user.profile?.interestRegion || '',
              investmentRange: user.profile?.investmentRange || '',
              franchiseeOf: user.franchiseeOf.map(
                (franchise: { id: string }) => franchise.id,
              ),
            }}
            onSuccess={() => {
              revalidate()
              router.refresh()
            }}
          />
        </Accordion>

        {user.role === 'FRANCHISOR' && <FranchisorRequestAccordion />}
      </div>
    </div>
  )
}
