'use client'

import { useRequestEmailChange } from '@/src/hooks/users/useUserMutations'
import {
  RequestEmailChangeInput,
  RequestEmailChangeSchema,
} from '@/src/schemas/users/profile'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import MailIcon from '../icons/emailIcon'
import BaseModal from '../ui/BaseModal'
import FormInput from '../ui/FormInput'
import RoundedButton from '../ui/RoundedButton'
import EmailChangeVerificationCode from './EmailChangeVerificationCode'

interface EmailUpdateFormProps {
  initialEmail: string
}

export default function EmailUpdateForm({
  initialEmail,
}: EmailUpdateFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [pendingVerification, setPendingVerification] = useState(false)
  const [initialExpiresIn, setInitialExpiresIn] = useState<number | null>(null)

  const requestEmailChange = useRequestEmailChange()

  const emailForm = useForm<RequestEmailChangeInput>({
    resolver: zodResolver(RequestEmailChangeSchema),
    defaultValues: {
      newEmail: '',
    },
  })

  const handleEdit = () => {
    setIsEditing(true)
    emailForm.reset({ newEmail: '' })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setPendingVerification(false)
    setNewEmail('')
    emailForm.reset({ newEmail: '' })
  }

  const handleRequestEmailChange = async (data: RequestEmailChangeInput) => {
    setNewEmail(data.newEmail)
    requestEmailChange.mutate(
      { newEmail: data.newEmail },
      {
        onSuccess: (result) => {
          if (result.success || result.rateLimited) {
            setPendingVerification(true)
            if (result.rateLimited && result.expiresIn) {
              setInitialExpiresIn(result.expiresIn)
            }
            setIsCodeModalOpen(true)
          }
        },
      },
    )
  }

  const handleCloseCodeModal = useCallback(() => {
    setIsCodeModalOpen(false)
    // Keep pendingVerification true so user can reopen
  }, [])

  const handleVerificationSuccess = useCallback(() => {
    setIsCodeModalOpen(false)
    setPendingVerification(false)
    setIsEditing(false)
    setNewEmail('')
    setInitialExpiresIn(null)
    emailForm.reset({ newEmail: '' })
  }, [emailForm])

  const handleBackToForm = useCallback(() => {
    setIsCodeModalOpen(false)
    setPendingVerification(false)
    setNewEmail('')
    setInitialExpiresIn(null)
  }, [])

  const handleReopenModal = useCallback(() => {
    setIsCodeModalOpen(true)
  }, [])

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 py-2">
          <MailIcon width={20} height={20} color="#747473" />
          <div>
            <p className="text-sm text-gray-600">E-mail atual</p>
            <p className="text-base font-medium text-gray-900">
              {initialEmail}
            </p>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <RoundedButton
            color="#E25E3E"
            text="Editar"
            textColor="white"
            onClick={handleEdit}
          />
        </div>
      </div>
    )
  }

  return (
    <>
      <form
        className="space-y-4"
        onSubmit={emailForm.handleSubmit(handleRequestEmailChange)}
        noValidate
      >
        <FormInput
          label="Novo E-mail"
          id="newEmail"
          type="email"
          placeholder="seu@novoemail.com"
          leftIcon={<MailIcon width={20} height={20} color="#747473" />}
          error={emailForm.formState.errors.newEmail?.message}
          register={emailForm.register('newEmail')}
          disabled={requestEmailChange.isPending}
        />

        <div className="flex gap-2">
          <RoundedButton
            color="#6B7280"
            text="Cancelar"
            textColor="white"
            type="button"
            onClick={handleCancel}
            disabled={requestEmailChange.isPending}
          />
          <RoundedButton
            color="#E25E3E"
            text={
              requestEmailChange.isPending
                ? 'Enviando código...'
                : 'Solicitar Código'
            }
            textColor="white"
            loading={requestEmailChange.isPending}
            disabled={requestEmailChange.isPending}
          />
        </div>

        {pendingVerification && !isCodeModalOpen && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-md">
            <div className="flex flex-col items-center justify-between gap-2">
              <p className="text-sm text-center">
                Verificação pendente para <strong>{newEmail}</strong>
              </p>
              <button
                type="button"
                onClick={handleReopenModal}
                className="text-sm text-[#E25E3E] underline hover:text-[#E20E3E] font-medium whitespace-nowrap"
              >
                Inserir código de verificação
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Modal do código de verificação */}
      <BaseModal
        tittleText="Digite o código de verificação"
        subtittleText="Digite o código de verificação que você recebeu no novo e-mail"
        isOpen={isCodeModalOpen}
        onClose={handleCloseCodeModal}
      >
        <EmailChangeVerificationCode
          newEmail={newEmail}
          initialExpiresIn={initialExpiresIn}
          onSuccess={handleVerificationSuccess}
          onBack={handleBackToForm}
        />
      </BaseModal>
    </>
  )
}
