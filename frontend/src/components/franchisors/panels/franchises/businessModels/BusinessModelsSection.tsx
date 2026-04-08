'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBusinessModelsByFranchise } from '@/src/hooks/businessModels/useBusinessModels'
import { useDeleteBusinessModel } from '@/src/hooks/businessModels/useBusinessModelMutations'
import BaseModal from '@/src/components/ui/BaseModal'
import BusinessModelRegister from './BusinessModelRegister'
import Image from 'next/image'
import AddIcon from '@/src/components/icons/addIcon'
import DeleteIcon from '@/src/components/icons/deleteIcon'
import ModalConfirmation from '@/src/components/ui/ModalConfirmation'

interface BusinessModelsSectionProps {
  franchiseId: string
  token: string
  isOwner?: boolean
}

export default function BusinessModelsSection({
  franchiseId,
  token,
  isOwner = false,
}: BusinessModelsSectionProps) {
  const router = useRouter()
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [deleteModelId, setDeleteModelId] = useState<string | null>(null)

  const { data: businessModels = [], isLoading } =
    useBusinessModelsByFranchise(franchiseId)
  const deleteMutation = useDeleteBusinessModel(token, franchiseId)

  const handleDelete = () => {
    if (deleteModelId) {
      deleteMutation.mutate(deleteModelId, {
        onSuccess: () => {
          setDeleteModelId(null)
        },
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="font-bold text-2xl sm:text-3xl text-foreground">
          Modelos de negócios da minha franquia
        </h2>
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <h2 className="font-bold text-2xl sm:text-3xl my-5 text-foreground">
          Modelos de negócios da minha franquia
        </h2>

        {businessModels.length === 0 && isOwner ? (
          <div
            onClick={() => setIsRegisterModalOpen(true)}
            className="border-2 border-dashed border-input rounded-2xl p-6 sm:p-10 flex items-center justify-center cursor-pointer hover:border-primary transition-colors min-h-[150px] sm:min-h-[200px]"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                <AddIcon width={40} height={40} color="#747473" />
              </div>
              <span className="text-muted-foreground font-medium text-sm sm:text-base text-center px-2">
                Adicionar modelo de negócio
              </span>
            </div>
          </div>
        ) : businessModels.length === 0 ? (
          <div className="text-muted-foreground text-center py-6 sm:py-10 text-sm sm:text-base">
            Nenhum modelo de negócio cadastrado
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {businessModels.map((model) => (
              <div
                key={model.id}
                className="bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden relative cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                onClick={() => router.push(`/modelos-negocio/${model.id}`)}
              >
                {isOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteModelId(model.id)
                    }}
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 bg-destructive hover:bg-destructive/90 text-white p-1.5 sm:p-2 rounded-full transition-colors"
                    aria-label="Excluir modelo"
                  >
                    <DeleteIcon width={14} height={14} color="white" />
                  </button>
                )}

                <div className="relative w-full h-[200px] sm:h-[250px] lg:h-[35vh] px-3 sm:px-5 pt-3 sm:pt-5">
                  <div className="relative w-full h-full rounded-2xl overflow-hidden">
                    <Image
                      src={model.photoUrl}
                      alt={model.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  <h3 className="font-bold text-lg sm:text-xl mb-2 text-foreground">
                    {model.name}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground line-clamp-3">
                    {model.description}
                  </p>
                </div>
              </div>
            ))}

            {isOwner && (
              <div
                onClick={() => setIsRegisterModalOpen(true)}
                className="border-2 border-dashed border-input rounded-2xl p-4 sm:p-6 flex items-center justify-center cursor-pointer hover:border-primary transition-colors min-h-[150px] sm:min-h-[200px]"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
                    <AddIcon width={28} height={28} color="#747473" />
                  </div>
                  <span className="text-muted-foreground font-medium text-xs sm:text-sm text-center">
                    Adicionar novo
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isOwner && (
        <BaseModal
          tittleText="Insira um modelo de negócio"
          subtittleText="Adicione as informações do modelo de negócio da sua franquia"
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
        >
          <BusinessModelRegister
            franchiseId={franchiseId}
            token={token}
            onSuccess={() => setIsRegisterModalOpen(false)}
          />
        </BaseModal>
      )}

      {isOwner && (
        <ModalConfirmation
          isOpen={!!deleteModelId}
          onClose={() => setDeleteModelId(null)}
          onConfirm={handleDelete}
          action="excluir este modelo de negócio"
          text="Esta ação não pode ser desfeita."
          buttonText="Excluir"
          isLoading={deleteMutation.isPending}
        />
      )}
    </>
  )
}
