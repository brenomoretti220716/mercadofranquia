import Api from '@/src/api/Api'
import UpdateIcon from '@/src/components/icons/updateIcon'
import CsvUploader from '@/src/components/ui/CsvUploader'
import ModalConfirmation from '@/src/components/ui/ModalConfirmation'
import RoundedButton from '@/src/components/ui/RoundedButton'
import ToogleButton from '@/src/components/ui/ToogleButton'
import { franchiseKeys } from '@/src/queries/franchises'
import { Franchise } from '@/src/schemas/franchises/Franchise'
import { getClientAuthCookie } from '@/src/utils/clientCookie'
import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

interface UpdateCsvResponse {
  success: boolean
  message: string
  data?: {
    updated: number
    errors?: string[]
  }
}

const token = getClientAuthCookie()

const updateCsv = async (
  file: File,
  franchiseId: string,
): Promise<UpdateCsvResponse> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(
    Api(`/franchises/import/csv/update/${franchiseId}`),
    {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`,
    )
  }

  return await response.json()
}

const toggleFranchiseStatus = async (
  franchiseId: string,
  newStatus: boolean,
): Promise<void> => {
  const response = await fetch(
    Api(`/franchises/${franchiseId}/toggle-status`),
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isActive: newStatus }),
    },
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.message ||
        `Erro ao ${newStatus ? 'ativar' : 'desativar'} franquia`,
    )
  }
}

const toggleReviewStatus = async (
  franchiseId: string,
  newStatus: boolean,
): Promise<void> => {
  const response = await fetch(
    Api(`/franchises/${franchiseId}/toggle-review`),
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isReview: newStatus }),
    },
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('Erro na requisição toggle review:', errorData)
    throw new Error(
      errorData.message ||
        `Erro ao ${newStatus ? 'ativar' : 'desativar'} franquia deve ser avaliada`,
    )
  }
}

const toggleSponsoredStatus = async (
  franchiseId: string,
  newStatus: boolean,
): Promise<void> => {
  const response = await fetch(
    Api(`/franchises/${franchiseId}/toggle-sponsored`),
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isSponsored: newStatus }),
    },
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.message ||
        `Erro ao ${newStatus ? 'ativar' : 'desativar'} patrocínio da franquia`,
    )
  }
}

const scrapingUpdate = async (franchiseId: string): Promise<void> => {
  const response = await fetch(Api(`/scraping/${franchiseId}`), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.message || `Erro ao atualizar franquia via scraping`,
    )
  }
}

const MAX_SPONSORED_FRANCHISES = 5

interface EditFranchiseProps {
  franchise: Franchise
  onSuccess?: () => void
  onToggleStatus?: (franchiseId: string, newStatus: boolean) => void
  onToggleReview?: (franchiseId: string, newStatus: boolean) => void
  onToggleSponsored?: (franchiseId: string, newStatus: boolean) => void
  /** Current number of sponsored franchises (from admin list); used to disable "Ativar patrocínio" when at limit */
  totalSponsored?: number
}

export default function EditFranchise({
  franchise,
  onSuccess,
  onToggleStatus,
  onToggleReview,
  onToggleSponsored,
  totalSponsored,
}: EditFranchiseProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isToggleModalOpen, setIsToggleModalOpen] = useState(false)
  const [isToggleReviewModalOpen, setIsToggleReviewModalOpen] = useState(false)
  const [isToggleSponsoredModalOpen, setIsToggleSponsoredModalOpen] =
    useState(false)
  const [isScrapingModalOpen, setIsScrapingModalOpen] = useState(false)
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: (file: File) => updateCsv(file, franchise.id),
    onSuccess: () => {
      toast.success('Franquia atualizada com sucesso!', {
        description: `Os dados da franquia "${franchise.name}" foram atualizados via CSV.`,
        duration: 5000,
      })

      // Admin table is powered by franchiseQueries.paginated (['franchises', 'paginated', ...]).
      // Invalidate all franchise queries so the table refreshes without page reload.
      queryClient.invalidateQueries({ queryKey: franchiseKeys.all })
      // Backward-compat: other parts of the app still use these keys.
      queryClient.invalidateQueries({ queryKey: ['admin-franchises'] })
      queryClient.invalidateQueries({ queryKey: ['admin-franchises-all'] })

      setSelectedFile(null)

      onSuccess?.()
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar franquia via CSV:', error)
      toast.error('Erro ao atualizar franquia', {
        description:
          error.message || 'Ocorreu um erro inesperado ao processar o arquivo.',
        duration: 5000,
      })
    },
  })

  const scrapingMutation = useMutation({
    mutationKey: ['scraping', franchise.id],
    mutationFn: () => scrapingUpdate(franchise.id),
    onSuccess: () => {
      toast.success('Franquia atualizada com sucesso!', {
        description: `Os dados da franquia "${franchise.name}" foram atualizados via scraping.`,
        duration: 5000,
      })

      queryClient.invalidateQueries({ queryKey: franchiseKeys.all })
      queryClient.invalidateQueries({ queryKey: ['admin-franchises'] })
      queryClient.invalidateQueries({ queryKey: ['admin-franchises-all'] })

      onSuccess?.()
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar franquia via scraping:', error)
      toast.error('Erro ao atualizar franquia', {
        description:
          error.message ||
          'Ocorreu um erro inesperado ao processar o scraping.',
        duration: 5000,
      })
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: (newStatus: boolean) =>
      toggleFranchiseStatus(franchise.id, newStatus),
    onSuccess: (_, newStatus) => {
      toast.success(
        `Franquia ${newStatus ? 'ativada' : 'desativada'} com sucesso!`,
        {
          description: `A franquia "${franchise.name}" foi ${newStatus ? 'ativada' : 'desativada'}.`,
          duration: 5000,
        },
      )

      queryClient.invalidateQueries({ queryKey: franchiseKeys.all })
      queryClient.invalidateQueries({
        queryKey: franchiseKeys.detail(franchise.id),
      })
      queryClient.invalidateQueries({ queryKey: ['admin-franchises'] })
      queryClient.invalidateQueries({ queryKey: ['admin-franchises-all'] })
      queryClient.invalidateQueries({ queryKey: ['franchise', franchise.id] })

      onToggleStatus?.(franchise.id, newStatus)

      setIsToggleModalOpen(false)
      onSuccess?.()
    },
    onError: (error: Error) => {
      console.error('Erro ao alterar status da franquia:', error)
      toast.error('Erro ao alterar status da franquia', {
        description: error.message || 'Ocorreu um erro inesperado.',
        duration: 5000,
      })
    },
  })

  const toggleReviewMutation = useMutation({
    mutationFn: (newStatus: boolean) =>
      toggleReviewStatus(franchise.id, newStatus),
    onSuccess: (_, newStatus) => {
      toast.success(
        `Franquia deve ser avaliada ${newStatus ? 'ativada' : 'desativada'} com sucesso!`,
        {
          description: `A franquia "${franchise.name}" foi ${newStatus ? 'ativada' : 'desativada'}.`,
          duration: 5000,
        },
      )

      queryClient.invalidateQueries({ queryKey: franchiseKeys.all })
      queryClient.invalidateQueries({
        queryKey: franchiseKeys.detail(franchise.id),
      })
      queryClient.invalidateQueries({ queryKey: ['admin-franchises'] })
      queryClient.invalidateQueries({ queryKey: ['admin-franchises-all'] })
      queryClient.invalidateQueries({ queryKey: ['franchise', franchise.id] })

      onToggleReview?.(franchise.id, newStatus)

      setIsToggleReviewModalOpen(false)
      onSuccess?.()
    },
    onError: (error: Error) => {
      console.error('Erro ao alterar status de avaliação da franquia:', error)
      toast.error('Erro ao alterar status de avaliação da franquia', {
        description: error.message || 'Ocorreu um erro inesperado.',
        duration: 5000,
      })
    },
  })

  const toggleSponsoredMutation = useMutation({
    mutationFn: (newStatus: boolean) =>
      toggleSponsoredStatus(franchise.id, newStatus),
    onSuccess: (_, newStatus) => {
      toast.success(
        `Patrocínio ${newStatus ? 'ativado' : 'desativado'} com sucesso!`,
        {
          description: `O patrocínio da franquia "${franchise.name}" foi ${newStatus ? 'ativado' : 'desativado'}.`,
          duration: 5000,
        },
      )

      queryClient.invalidateQueries({ queryKey: franchiseKeys.all })
      queryClient.invalidateQueries({
        queryKey: franchiseKeys.detail(franchise.id),
      })
      queryClient.invalidateQueries({ queryKey: ['admin-franchises'] })
      queryClient.invalidateQueries({ queryKey: ['admin-franchises-all'] })
      queryClient.invalidateQueries({ queryKey: ['franchise', franchise.id] })

      onToggleSponsored?.(franchise.id, newStatus)

      setIsToggleSponsoredModalOpen(false)
      onSuccess?.()
    },
    onError: (error: Error) => {
      console.error('Erro ao alterar status de patrocínio da franquia:', error)
      toast.error('Erro ao alterar status de patrocínio', {
        description: error.message || 'Ocorreu um erro inesperado.',
        duration: 5000,
      })
    },
  })

  const handleFileChange = (files: File[]) => {
    const file = files[0] || null
    setSelectedFile(file)
  }

  const handleUpdate = () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo CSV', {
        description:
          'É necessário selecionar um arquivo CSV antes de atualizar.',
      })
      return
    }

    updateMutation.mutate(selectedFile)
  }

  const handleOpenToggleModal = () => {
    setIsToggleModalOpen(true)
  }

  const handleCloseToggleModal = () => {
    setIsToggleModalOpen(false)
  }

  const handleConfirmToggleStatus = () => {
    const newStatus = !franchise.isActive
    toggleStatusMutation.mutate(newStatus)
  }

  const handleOpenToggleReviewModal = () => {
    setIsToggleReviewModalOpen(true)
  }

  const handleCloseToggleReviewModal = () => {
    setIsToggleReviewModalOpen(false)
  }

  const handleOpenScrapingModal = () => {
    if (isScrapingBusy) return
    setIsScrapingModalOpen(true)
  }

  const handleCloseScrapingModal = () => {
    setIsScrapingModalOpen(false)
  }

  const handleConfirmScraping = () => {
    if (isScrapingBusy) return
    setIsScrapingModalOpen(false)
    scrapingMutation.mutate()
  }

  const handleConfirmToggleReview = () => {
    const newStatus = !franchise.isReview
    toggleReviewMutation.mutate(newStatus)
  }

  const handleOpenToggleSponsoredModal = () => {
    setIsToggleSponsoredModalOpen(true)
  }

  const handleCloseToggleSponsoredModal = () => {
    setIsToggleSponsoredModalOpen(false)
  }

  const handleConfirmToggleSponsored = () => {
    const newStatus = !franchise.isSponsored
    toggleSponsoredMutation.mutate(newStatus)
  }

  const isUpdating = updateMutation.isPending
  const isScraping = scrapingMutation.isPending
  const isTogglingStatus = toggleStatusMutation.isPending
  const isScrapingBusy =
    useIsMutating({ mutationKey: ['scraping', franchise.id] }) > 0

  const isTogglingReview = toggleReviewMutation.isPending
  const isReviewing =
    useIsMutating({ mutationKey: ['reviews', franchise.id] }) > 0
  const isTogglingSponsored = toggleSponsoredMutation.isPending

  return (
    <>
      <div className="flex flex-col w-full p-10 gap-5">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {franchise.name}
            </h3>
            {franchise.segment && (
              <p className="text-sm text-gray-600">
                Segmento: {franchise.segment}
              </p>
            )}
          </div>

          <div className="flex items-start gap-4">
            {/* Botão de Update */}
            <button
              onClick={handleOpenScrapingModal}
              disabled={isScrapingBusy || isUpdating || isTogglingStatus}
              className={`${isScrapingBusy ? 'animate-spin cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <UpdateIcon color={isScrapingBusy ? '#000000' : '#E25E3E'} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Status e Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Franquia ativa?</span>
            <ToogleButton
              isActive={franchise.isActive}
              isUpdating={isScraping}
              isTogglingStatus={isTogglingStatus}
              handleOpenToggleModal={handleOpenToggleModal}
            />
          </div>

          {/* Status e Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              Franquia deve ser avaliada?
            </span>
            <ToogleButton
              isActive={franchise.isReview}
              isUpdating={isReviewing}
              isTogglingStatus={isTogglingReview}
              handleOpenToggleModal={handleOpenToggleReviewModal}
            />
          </div>

          {/* Sponsored Toggle */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Franquia patrocinada?</span>
              <ToogleButton
                isActive={franchise.isSponsored}
                isUpdating={false}
                isTogglingStatus={isTogglingSponsored}
                handleOpenToggleModal={handleOpenToggleSponsoredModal}
                disabled={
                  totalSponsored !== undefined &&
                  totalSponsored >= MAX_SPONSORED_FRANCHISES &&
                  !franchise.isSponsored
                }
              />
            </div>
            {totalSponsored !== undefined &&
              totalSponsored >= MAX_SPONSORED_FRANCHISES &&
              !franchise.isSponsored && (
                <span className="text-xs text-amber-600">
                  Já existem 5 franquias patrocinadas. Desative um patrocínio
                  para ativar outro.
                </span>
              )}
          </div>
        </div>

        <CsvUploader onChange={handleFileChange} maxSize={10 * 1024 * 1024} />

        {selectedFile && (
          <div className="mt-4 p-4 bg-[#E4AC9E]/20 rounded-lg border border-[#E25E3E]">
            <p className="text-sm text-black">
              <strong>Arquivo selecionado:</strong> {selectedFile.name}
            </p>
            <p className="text-sm text-black mt-1">
              Tamanho: {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
            <p className="text-xs text-black mt-2">
              ⚠️ Este arquivo será usado para atualizar os dados da franquia
              &quot;{franchise.name}&quot;.
            </p>
          </div>
        )}

        <div className="mt-4 p-4 bg-[#E4AC9E]/20 rounded-lg border border-[#E25E3E]">
          <h4 className="text-sm font-medium text-black mb-2">
            Informações importantes:
          </h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>
              • O arquivo CSV deve conter os dados atualizados da franquia
            </li>
            <li>• Apenas os dados válidos serão atualizados</li>
            <li>• Em caso de erro, os dados originais serão mantidos</li>
            <li>• As alterações serão refletidas imediatamente na listagem</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          <RoundedButton
            color={!selectedFile ? '#777777' : '#E25E3E'}
            hoverColor={'#000000'}
            text={isUpdating ? 'Atualizando...' : 'Atualizar Franquia'}
            textColor="white"
            onClick={handleUpdate}
            disabled={
              !selectedFile || isUpdating || isTogglingStatus || isScraping
            }
          />

          <div className="flex justify-center text-sm">
            <a
              onClick={() => onSuccess?.()}
              className="text-[#E25E3E] underline ml-1 hover:text-[#E20E3E] cursor-pointer"
            >
              Cancelar
            </a>
          </div>
        </div>
      </div>

      <ModalConfirmation
        isOpen={isToggleModalOpen}
        onClose={handleCloseToggleModal}
        onConfirm={handleConfirmToggleStatus}
        action={franchise.isActive ? 'desativar' : 'ativar'}
        isLoading={isTogglingStatus}
        text={
          franchise.isActive
            ? 'Tem certeza que deseja desativar esta franquia? Todos os dados serão preservados, mas ela não estará mais ativa.'
            : 'Tem certeza que deseja ativar esta franquia? Ela voltará a estar ativa e disponível para uso.'
        }
        buttonText={
          franchise.isActive ? 'Desativar Franquia' : 'Ativar Franquia'
        }
      />

      <ModalConfirmation
        isOpen={isScrapingModalOpen}
        onClose={handleCloseScrapingModal}
        onConfirm={handleConfirmScraping}
        action="atualizar"
        isLoading={isScrapingBusy}
        text="Tem certeza que deseja atualizar esta franquia via scraping?"
        buttonText="Atualizar Franquia"
      />

      <ModalConfirmation
        isOpen={isToggleReviewModalOpen}
        onClose={handleCloseToggleReviewModal}
        onConfirm={handleConfirmToggleReview}
        action="atualizar avaliação"
        isLoading={isTogglingReview}
        text="Tem certeza que deseja atualizar a avaliação desta franquia?"
        buttonText="Atualizar Avaliação"
      />

      <ModalConfirmation
        isOpen={isToggleSponsoredModalOpen}
        onClose={handleCloseToggleSponsoredModal}
        onConfirm={handleConfirmToggleSponsored}
        action={
          franchise.isSponsored ? 'desativar patrocínio' : 'ativar patrocínio'
        }
        isLoading={isTogglingSponsored}
        text={
          franchise.isSponsored
            ? 'Tem certeza que deseja desativar o patrocínio desta franquia? Ela deixará de aparecer em destaque.'
            : 'Tem certeza que deseja ativar o patrocínio desta franquia? Ela passará a aparecer em destaque.'
        }
        buttonText={
          franchise.isSponsored ? 'Desativar Patrocínio' : 'Ativar Patrocínio'
        }
      />
    </>
  )
}
