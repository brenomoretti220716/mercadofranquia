'use client'

import BaseModal from '@/src/components/ui/BaseModal'
import ModalConfirmation from '@/src/components/ui/ModalConfirmation'
import MultiSelect from '@/src/components/ui/MultiSelect'
import RoundedButton from '@/src/components/ui/RoundedButton'
import {
  useApproveFranchisorRequest,
  useRejectFranchisorRequest,
} from '@/src/hooks/users/useFranchisorRequest'
import { franchiseQueries } from '@/src/queries/franchises'
import {
  FranchisorRequest,
  FranchisorRequestStatus,
} from '@/src/schemas/users/FranchisorRequest'
import { formatDateTimeToBrazilian } from '@/src/utils/dateFormatters'
import { formatErrorMessage } from '@/src/utils/errorHandlers'
import { useSuspenseQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

interface Props {
  isOpen: boolean
  onClose: () => void
  request: FranchisorRequest | null
  onSuccess: () => void
}

export default function FranchisorRequestModal({
  isOpen,
  onClose,
  request,
  onSuccess,
}: Props) {
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [selectedFranchises, setSelectedFranchises] = useState<string[]>([])
  const [rejectionReason, setRejectionReason] = useState('')
  const [showApproveConfirmModal, setShowApproveConfirmModal] = useState(false)
  const [showRejectConfirmModal, setShowRejectConfirmModal] = useState(false)

  const approveMutation = useApproveFranchisorRequest()
  const rejectMutation = useRejectFranchisorRequest()
  const { data: franchiseOptions } = useSuspenseQuery(
    franchiseQueries.availableOptions(),
  )

  if (!request) return null

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5',
    )
  }

  const formatPhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
    }
    return numbers.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
  }

  const formatDate = formatDateTimeToBrazilian

  const statusColors = {
    [FranchisorRequestStatus.PENDING]: 'text-yellow-600 bg-yellow-50',
    [FranchisorRequestStatus.UNDER_REVIEW]: 'text-blue-600 bg-blue-50',
    [FranchisorRequestStatus.APPROVED]: 'text-green-600 bg-green-50',
    [FranchisorRequestStatus.REJECTED]: 'text-red-600 bg-red-50',
  }

  const statusLabels = {
    [FranchisorRequestStatus.PENDING]: 'Pendente',
    [FranchisorRequestStatus.UNDER_REVIEW]: 'Em Análise',
    [FranchisorRequestStatus.APPROVED]: 'Aprovado',
    [FranchisorRequestStatus.REJECTED]: 'Rejeitado',
  }

  const handleApprove = () => {
    if (selectedFranchises.length === 0) {
      toast.error('Por favor, selecione pelo menos uma franquia')
      return
    }

    setShowApproveConfirmModal(true)
  }

  const confirmApprove = async () => {
    try {
      await approveMutation.mutateAsync({
        requestId: request.id,
        data: { ownedFranchises: selectedFranchises },
      })
      toast.success('Solicitação aprovada com sucesso!')
      setShowApproveConfirmModal(false)
      onSuccess()
      handleClose()
    } catch (error: unknown) {
      const message = formatErrorMessage(
        error,
        'Não foi possível aprovar a solicitação. Tente novamente.',
      )

      // Fallback: translate common backend English messages (if they ever leak)
      const normalized = message.toLowerCase()
      const translated =
        normalized.includes('already owned') ||
        normalized.includes('already owned by') ||
        normalized.includes('already has an owner')
          ? 'Uma ou mais franquias selecionadas já estão vinculadas a outro franqueador. Atualize a lista e tente novamente.'
          : message

      toast.error(translated)
    }
  }

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Por favor, informe o motivo da rejeição')
      return
    }

    setShowRejectConfirmModal(true)
  }

  const confirmReject = async () => {
    try {
      await rejectMutation.mutateAsync({
        requestId: request.id,
        data: { rejectionReason },
      })
      toast.success('Solicitação rejeitada com sucesso!')
      setShowRejectConfirmModal(false)
      onSuccess()
      handleClose()
    } catch (error: unknown) {
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível rejeitar a solicitação. Tente novamente.',
        ),
      )
    }
  }

  const handleClose = () => {
    setIsApproving(false)
    setIsRejecting(false)
    setSelectedFranchises([])
    setRejectionReason('')
    setShowApproveConfirmModal(false)
    setShowRejectConfirmModal(false)
    onClose()
  }

  const isPending = request.status === FranchisorRequestStatus.PENDING

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      tittleText="Detalhes da Solicitação de Franqueador"
      subtittleText="Revise as informações e aprove ou rejeite a solicitação"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
        {/* Status Badge */}
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <span
              className={`inline-block mt-1 px-3 py-1 text-sm font-semibold rounded-full ${statusColors[request.status]}`}
            >
              {statusLabels[request.status]}
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Data de Criação</p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {formatDateTimeToBrazilian(request.createdAt)}
            </p>
          </div>
        </div>

        {/* Company Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Informações da Empresa
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Nome da Marca/Empresa
              </label>
              <p className="text-sm text-gray-900 mt-1">{request.streamName}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">CNPJ</label>
              <p className="text-sm text-gray-900 mt-1">
                {formatCNPJ(request.cnpj)}
              </p>
            </div>
          </div>
        </div>

        {/* Responsible Person */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Responsável
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Nome</label>
              <p className="text-sm text-gray-900 mt-1">
                {request.responsable}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Cargo</label>
              <p className="text-sm text-gray-900 mt-1">
                {request.responsableRole}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Contatos Comerciais
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p className="text-sm text-gray-900 mt-1">
                {request.commercialEmail}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">
                Telefone
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {formatPhone(request.commercialPhone)}
              </p>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Documentos
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Cartão CNPJ
              </label>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/${request.cnpjCardPath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-1 text-sm text-[#E25E3E] hover:text-[#c04e2e] underline"
              >
                Visualizar documento
              </a>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">
                Contrato Social
              </label>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/${request.socialContractPath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-1 text-sm text-[#E25E3E] hover:text-[#c04e2e] underline"
              >
                Visualizar documento
              </a>
            </div>
          </div>
        </div>

        {/* Rejection Reason (if rejected) */}
        {request.status === FranchisorRequestStatus.REJECTED &&
          request.rejectionReason && (
            <div className="space-y-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-sm font-semibold text-red-900">
                Motivo da Rejeição
              </h3>
              <p className="text-sm text-red-800">{request.rejectionReason}</p>
              {request.reviewedAt && (
                <p className="text-xs text-red-600 mt-2">
                  Rejeitado em: {formatDate(request.reviewedAt)}
                </p>
              )}
            </div>
          )}

        {/* Approval Section */}
        {isPending && !isRejecting && (
          <div className="space-y-4 rounded-lg">
            {isApproving ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900">
                  Selecione as Franquias
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Escolha quais franquias serão atribuídas a este franqueador
                </p>
                <MultiSelect
                  options={franchiseOptions.map(
                    (franchise: { value: string; label: string }) => ({
                      value: franchise.value,
                      label: franchise.label,
                    }),
                  )}
                  value={selectedFranchises}
                  onChange={(value) => setSelectedFranchises(value)}
                  placeholder="Selecione as franquias"
                />

                <p className="text-sm text-gray-600">
                  Franquia não existe ainda?
                  <Link
                    href="/admin/franquias?isRegisterModalOpen=true"
                    className="text-[#E25E3E] hover:text-[#c04e2e] hover:underline cursor-pointer"
                  >
                    {' '}
                    Clique aqui para criar
                  </Link>
                </p>

                <div className="flex gap-3 mt-4">
                  <div className="grid w-full">
                    <RoundedButton
                      text={
                        approveMutation.isPending
                          ? 'Aprovando...'
                          : 'Confirmar Aprovação'
                      }
                      color="#E25E3E"
                      textColor="white"
                      onClick={handleApprove}
                      disabled={
                        approveMutation.isPending ||
                        selectedFranchises.length === 0
                      }
                    />
                  </div>
                  <div className="grid w-full">
                    <RoundedButton
                      text={
                        approveMutation.isPending ? 'Cancelando...' : 'Cancelar'
                      }
                      color="#E25E3E"
                      textColor="white"
                      onClick={() => {
                        setIsApproving(false)
                        setSelectedFranchises([])
                      }}
                      disabled={approveMutation.isPending}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex gap-2">
                <div className="grid w-full">
                  <RoundedButton
                    text="Aprovar Solicitação"
                    color="#E25E3E"
                    textColor="white"
                    onClick={() => setIsApproving(true)}
                  />
                </div>

                <div className="grid w-full">
                  <RoundedButton
                    text="Rejeitar Solicitação"
                    color="#E25E3E"
                    textColor="white"
                    onClick={() => setIsRejecting(true)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rejection Section */}
        {isPending && isRejecting && !isApproving && (
          <div className="space-y-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-lg font-semibold text-red-900">
              Rejeitar Solicitação
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo da Rejeição *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Descreva o motivo da rejeição..."
              />
            </div>
            <div className="flex gap-3">
              <div className="grid w-full">
                <RoundedButton
                  text="Cancelar"
                  color="#E25E3E"
                  textColor="white"
                  onClick={() => {
                    setIsRejecting(false)
                    setRejectionReason('')
                  }}
                />
              </div>

              <div className="grid w-full">
                <RoundedButton
                  text="Confirmar Rejeição"
                  color="#E25E3E"
                  textColor="white"
                  onClick={handleReject}
                  disabled={rejectMutation.isPending || !rejectionReason.trim()}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Approve Confirmation Modal */}
      <ModalConfirmation
        isOpen={showApproveConfirmModal}
        onClose={() => setShowApproveConfirmModal(false)}
        onConfirm={confirmApprove}
        buttonText="Aprovar"
        action="aprovar esta solicitação"
        text={`Ao aprovar, o usuário se tornará franqueador e terá acesso às ${selectedFranchises.length} franquia(s) selecionada(s).`}
        isLoading={approveMutation.isPending}
      />

      {/* Reject Confirmation Modal */}
      <ModalConfirmation
        isOpen={showRejectConfirmModal}
        onClose={() => setShowRejectConfirmModal(false)}
        onConfirm={confirmReject}
        buttonText="Rejeitar"
        action="rejeitar esta solicitação"
        text="O usuário será notificado sobre a rejeição e poderá visualizar o motivo informado."
        isLoading={rejectMutation.isPending}
      />
    </BaseModal>
  )
}
