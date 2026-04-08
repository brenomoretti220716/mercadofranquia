'use client'

import FormInput from '@/src/components/ui/FormInput'
import PhoneInput from '@/src/components/ui/PhoneInput'
import RangeInput from '@/src/components/ui/RangeInput'
import RoundedButton from '@/src/components/ui/RoundedButton'
import FranchiseDataEditSkeleton from '@/src/components/ui/skeletons/FranchiseDataEditSkeleton'
import { useUpdateFranchise } from '@/src/hooks/franchises/useFranchiseMutations'
import { franchiseKeys } from '@/src/queries/franchises'
import type { Franchise } from '@/src/schemas/franchises/Franchise'
import {
  type FranchiseEditFormInput,
  FranchiseEditFormSchema,
  FranchiseEditSchema,
} from '@/src/schemas/franchises/FranchiseEdit'
import { formatDateToBrazilian } from '@/src/utils/dateFormatters'
import { formatPhone } from '@/src/utils/formaters'
import { formatInvestmentRange, formatROIRange } from '@/src/utils/formatters'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { ZodError, ZodIssue } from 'zod'

interface FranchiseDataEditProps {
  franchise: Franchise
  token: string
}

export default function FranchiseDataEdit({
  franchise,
}: FranchiseDataEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const updateMutation = useUpdateFranchise()
  const queryClient = useQueryClient()

  // Check if the franchise query is being refetched/revalidated
  const isRefetching = Boolean(
    queryClient.isFetching({
      queryKey: franchiseKeys.detail(franchise.id),
    }),
  )

  const methods = useForm<FranchiseEditFormInput>({
    resolver: zodResolver(FranchiseEditFormSchema),
    mode: 'onChange', // Enable real-time validation
    defaultValues: {
      name: franchise.name || '',
      minimumInvestment: franchise.minimumInvestment?.toString() || '',
      maximumInvestment: franchise.maximumInvestment?.toString() || '',
      minimumReturnOnInvestment:
        franchise.minimumReturnOnInvestment?.toString() || '',
      maximumReturnOnInvestment:
        franchise.maximumReturnOnInvestment?.toString() || '',
      headquarterState: franchise.headquarterState || '',
      totalUnits: franchise.totalUnits?.toString() || '',
      segment: franchise.segment || '',
      subsegment: franchise.subsegment || '',
      businessType: franchise.businessType || '',
      brandFoundationYear: franchise.brandFoundationYear?.toString() || '',
      franchiseStartYear: franchise.franchiseStartYear?.toString() || '',
      abfSince: franchise.abfSince?.toString() || '',
      phone: franchise.contact?.phone || '',
      email: franchise.contact?.email || '',
      website: franchise.contact?.website || '',
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty, dirtyFields, isValid },
  } = methods

  // Watch phone value to keep PhoneInput in sync
  const phoneValue = watch('phone')

  // Reset form when franchise data changes
  useEffect(() => {
    reset({
      name: franchise.name || '',
      minimumInvestment: franchise.minimumInvestment?.toString() || '',
      maximumInvestment: franchise.maximumInvestment?.toString() || '',
      minimumReturnOnInvestment:
        franchise.minimumReturnOnInvestment?.toString() || '',
      maximumReturnOnInvestment:
        franchise.maximumReturnOnInvestment?.toString() || '',
      headquarterState: franchise.headquarterState || '',
      totalUnits: franchise.totalUnits?.toString() || '',
      segment: franchise.segment || '',
      subsegment: franchise.subsegment || '',
      businessType: franchise.businessType || '',
      brandFoundationYear: franchise.brandFoundationYear?.toString() || '',
      franchiseStartYear: franchise.franchiseStartYear?.toString() || '',
      abfSince: franchise.abfSince?.toString() || '',
      phone: franchise.contact?.phone || '',
      email: franchise.contact?.email || '',
      website: franchise.contact?.website || '',
    })
  }, [franchise, reset])

  const onSubmit = async (data: FranchiseEditFormInput) => {
    try {
      // Only send fields that were actually changed
      const changedData: Partial<FranchiseEditFormInput> = {}

      Object.keys(dirtyFields).forEach((key) => {
        const fieldKey = key as keyof FranchiseEditFormInput
        changedData[fieldKey] = data[fieldKey]
      })

      // If no fields were changed, don't send the request
      if (Object.keys(changedData).length === 0) {
        console.warn('No fields were changed')
        setIsEditing(false)
        return
      }

      // Create validation data that includes related range fields
      // When validating max, we need the current min value, and vice versa
      const validationData: Partial<FranchiseEditFormInput> = {
        ...changedData,
      }

      // Include both investment fields if either changed (for validation)
      if (
        'minimumInvestment' in changedData ||
        'maximumInvestment' in changedData
      ) {
        validationData.minimumInvestment =
          changedData.minimumInvestment ?? data.minimumInvestment
        validationData.maximumInvestment =
          changedData.maximumInvestment ?? data.maximumInvestment
      }

      // Include both ROI fields if either changed (for validation)
      if (
        'minimumReturnOnInvestment' in changedData ||
        'maximumReturnOnInvestment' in changedData
      ) {
        validationData.minimumReturnOnInvestment =
          changedData.minimumReturnOnInvestment ??
          data.minimumReturnOnInvestment
        validationData.maximumReturnOnInvestment =
          changedData.maximumReturnOnInvestment ??
          data.maximumReturnOnInvestment
      }

      // Validate with all related fields
      try {
        FranchiseEditSchema.parse(validationData)
      } catch (validationError) {
        // If validation fails, show errors in the form
        if (
          validationError &&
          typeof validationError === 'object' &&
          'issues' in validationError
        ) {
          const zodError = validationError as ZodError
          if (Array.isArray(zodError.issues)) {
            zodError.issues.forEach((issue: ZodIssue) => {
              if (issue.path && issue.path.length > 0) {
                const fieldName = issue.path[0] as keyof FranchiseEditFormInput
                methods.setError(fieldName, {
                  type: 'manual',
                  message: issue.message || 'Valor inválido',
                })
              }
            })
          }
        }
        // Don't submit if validation fails
        console.error('Validation error:', validationError)
        return
      }

      // Transform for API submission - include related fields if range field changed
      // This ensures validation passes during transformation
      const dataToTransform: Partial<FranchiseEditFormInput> = {
        ...changedData,
      }

      // Include both investment fields if either changed (needed for transform validation)
      if (
        'minimumInvestment' in changedData ||
        'maximumInvestment' in changedData
      ) {
        dataToTransform.minimumInvestment =
          changedData.minimumInvestment ?? data.minimumInvestment
        dataToTransform.maximumInvestment =
          changedData.maximumInvestment ?? data.maximumInvestment
      }

      // Include both ROI fields if either changed (needed for transform validation)
      if (
        'minimumReturnOnInvestment' in changedData ||
        'maximumReturnOnInvestment' in changedData
      ) {
        dataToTransform.minimumReturnOnInvestment =
          changedData.minimumReturnOnInvestment ??
          data.minimumReturnOnInvestment
        dataToTransform.maximumReturnOnInvestment =
          changedData.maximumReturnOnInvestment ??
          data.maximumReturnOnInvestment
      }

      FranchiseEditSchema.parse(dataToTransform)

      // Use the original changedData directly - it's already validated and has correct string types
      const result = await updateMutation.mutateAsync({
        data: changedData,
        id: franchise.id,
      })

      // Reset form with updated data after successful submission
      if (result) {
        reset({
          name: result.name || '',
          minimumInvestment: result.minimumInvestment?.toString() || '',
          maximumInvestment: result.maximumInvestment?.toString() || '',
          minimumReturnOnInvestment:
            result.minimumReturnOnInvestment?.toString() || '',
          maximumReturnOnInvestment:
            result.maximumReturnOnInvestment?.toString() || '',
          headquarterState: result.headquarterState || '',
          totalUnits: result.totalUnits?.toString() || '',
          segment: result.segment || '',
          subsegment: result.subsegment || '',
          businessType: result.businessType || '',
          brandFoundationYear: result.brandFoundationYear?.toString() || '',
          franchiseStartYear: result.franchiseStartYear?.toString() || '',
          abfSince: result.abfSince?.toString() || '',
          phone: result.contact?.phone || '',
          email: result.contact?.email || '',
          website: result.contact?.website || '',
        })
      }

      setIsEditing(false)
    } catch (error) {
      console.error('Error updating franchise:', error)
    }
  }

  const handleCancel = () => {
    reset()
    setIsEditing(false)
  }

  if (!isEditing) {
    // View mode
    return (
      <>
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-3xl text-foreground">Meus dados</h2>
          <RoundedButton
            text="Editar"
            color="hsl(10 79% 57%)"
            textColor="white"
            onClick={() => setIsEditing(true)}
            disabled={isRefetching}
          />
        </div>

        {isRefetching ? (
          <FranchiseDataEditSkeleton />
        ) : (
          <div className="flex flex-col md:flex-row gap-5 items-stretch">
            {/* Card Principal */}
            <div className="flex flex-col w-full bg-white rounded-2xl shadow-sm border border-border/50">
              <div className="flex flex-col p-4 sm:p-6 md:p-10 gap-5">
                <h2 className="font-manrope text-2xl font-bold text-foreground">
                  {franchise.name}
                </h2>

                <div className="flex flex-col">
                  <h3 className="text-xl font-manrope font-semibold text-foreground">
                    Investimento
                  </h3>
                  <p className="font-normal text-muted-foreground">
                    {formatInvestmentRange(
                      franchise.minimumInvestment,
                      franchise.maximumInvestment,
                    )}
                  </p>
                </div>

                <div className="flex flex-col">
                  <h3 className="text-xl font-manrope font-semibold text-foreground">
                    Retorno sobre Investimento
                  </h3>
                  <p className="font-normal text-muted-foreground">
                    {formatROIRange(
                      franchise.minimumReturnOnInvestment,
                      franchise.maximumReturnOnInvestment,
                    )}
                  </p>
                </div>

                <div className="flex flex-col">
                  <h3 className="text-xl font-manrope font-semibold text-foreground">
                    Estado Sede
                  </h3>
                  <p className="font-normal text-muted-foreground">
                    {franchise.headquarterState || 'Não informado'}
                  </p>
                </div>

                <div className="flex flex-col">
                  <h3 className="text-xl font-manrope font-semibold text-foreground">
                    Número de Unidades
                  </h3>
                  <p className="font-normal text-muted-foreground">
                    {franchise.totalUnits?.toLocaleString('pt-BR') ||
                      'Não informado'}
                  </p>
                </div>

                <div className="flex flex-col">
                  <h3 className="text-xl font-manrope font-semibold text-foreground">
                    Segmento de atuação da franquia
                  </h3>
                  <p className="font-normal text-muted-foreground">
                    {franchise.segment || 'Não informado'}
                  </p>
                </div>

                <div className="flex flex-col">
                  <h3 className="text-xl font-manrope font-semibold text-foreground">
                    Subsegmento primário
                  </h3>
                  <p className="font-normal text-muted-foreground">
                    {franchise.subsegment || 'Não informado'}
                  </p>
                </div>

                <div className="flex flex-col">
                  <h3 className="text-xl font-manrope font-semibold text-foreground">
                    Tipo de Negócio
                  </h3>
                  <p className="font-normal text-muted-foreground">
                    {franchise.businessType || 'Não informado'}
                  </p>
                </div>
              </div>
            </div>

            {/* SideCard */}
            <div className="flex flex-col w-full gap-5 h-full">
              {/* SideCard Top */}
              <div className="flex flex-col w-full flex-1 min-h-0 md:min-h-[42vh] bg-white shadow-sm border border-border/50 p-4 sm:p-6 md:p-10 rounded-2xl">
                <h2 className="text-2xl font-manrope font-bold text-foreground">
                  Sobre o negócio
                </h2>

                <div className="flex flex-col mt-5">
                  <h3 className="text-xl font-manrope font-semibold text-foreground">
                    Fundação
                  </h3>
                  <p className="font-normal text-muted-foreground">
                    {franchise.brandFoundationYear || 'Não informado'}
                  </p>
                </div>

                <div className="flex flex-col mt-5">
                  <h3 className="text-xl font-manrope font-semibold text-foreground">
                    Início da franquia
                  </h3>
                  <p className="font-normal text-muted-foreground">
                    {franchise.franchiseStartYear || 'Não informado'}
                  </p>
                </div>

                <div className="flex flex-col mt-5">
                  <h3 className="text-xl font-manrope font-semibold text-foreground">
                    Associada ABF desde
                  </h3>
                  <p className="font-normal text-muted-foreground">
                    {franchise.abfSince || 'Não informado'}
                  </p>
                </div>
              </div>

              {/* SideCard Bottom */}
              <div className="flex flex-col w-full flex-1 min-h-0 md:min-h-[42vh] bg-white shadow-sm border border-border/50 p-4 sm:p-6 md:p-10 rounded-2xl">
                <div className="flex flex-col mb-5">
                  <h2 className="text-2xl font-manrope font-bold text-foreground">
                    Informações de contato
                  </h2>
                  <p className="mt-2">
                    Última atualização pela franquia:{' '}
                    {formatDateToBrazilian(franchise.updatedAt)}
                  </p>
                </div>

                <div className="flex flex-col gap-5 flex-1">
                  {franchise.contact ? (
                    <>
                      <div className="flex flex-col">
                        <h3 className="text-xl font-semibold">Telefone</h3>
                        <p className="font-normal text-muted-foreground">
                          {franchise.contact.phone
                            ? formatPhone(franchise.contact.phone)
                            : 'Não informado'}
                        </p>
                      </div>

                      <div className="flex flex-col">
                        <h3 className="text-xl font-manrope font-semibold text-foreground">
                          E-mail
                        </h3>
                        <p className="font-normal text-muted-foreground">
                          {franchise.contact.email || 'Não informado'}
                        </p>
                      </div>

                      <div className="flex flex-col">
                        <h3 className="text-xl font-manrope font-semibold text-foreground">
                          Site
                        </h3>
                        {franchise.contact.website ? (
                          <a
                            href={franchise.contact.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-normal text-orange-600 hover:text-orange-800 underline"
                          >
                            {franchise.contact.website}
                          </a>
                        ) : (
                          <p className="font-normal text-muted-foreground">
                            Não informado
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col">
                        <h3 className="text-xl font-semibold">Telefone</h3>
                        <p className="font-normal text-muted-foreground">
                          Não informado
                        </p>
                      </div>

                      <div className="flex flex-col">
                        <h3 className="text-xl font-manrope font-semibold text-foreground">
                          E-mail
                        </h3>
                        <p className="font-normal text-muted-foreground">
                          Não informado
                        </p>
                      </div>

                      <div className="flex flex-col">
                        <h3 className="text-xl font-manrope font-semibold text-foreground">
                          Site
                        </h3>
                        <p className="font-normal text-muted-foreground">
                          Não informado
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // Edit mode
  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-3xl text-foreground">Meus dados</h2>
          <div className="flex gap-3 flex-shrink-0">
            <RoundedButton
              text="Cancelar"
              color="#747473"
              hoverColor="#E25E3E"
              textColor="white"
              onClick={handleCancel}
              disabled={updateMutation.isPending || isRefetching}
            />
            <RoundedButton
              text={updateMutation.isPending ? 'Salvando...' : 'Salvar'}
              color={
                updateMutation.isPending || !isDirty || isRefetching || !isValid
                  ? '#747473'
                  : '#E25E3E'
              }
              hoverColor={
                updateMutation.isPending || !isDirty || isRefetching || !isValid
                  ? '#747473'
                  : '#E25E3E'
              }
              textColor="white"
              onClick={handleSubmit(onSubmit)}
              disabled={
                updateMutation.isPending || !isDirty || isRefetching || !isValid
              }
            />
          </div>
        </div>

        {isRefetching ? (
          <FranchiseDataEditSkeleton />
        ) : (
          <div className="flex flex-col md:flex-row gap-5 items-stretch">
            {/* Card Principal */}
            <div className="flex flex-col w-full bg-white shadow-sm border border-border/50 rounded-2xl">
              <div className="flex flex-col p-4 sm:p-6 md:p-10 gap-5">
                <FormInput
                  label="Nome da Franquia"
                  id="name"
                  type="text"
                  error={errors.name?.message}
                  register={register('name')}
                  disabled={updateMutation.isPending || isRefetching}
                  labelClassName="text-xl font-manrope font-semibold"
                />

                <RangeInput
                  label="Investimento"
                  minId="minimumInvestment"
                  maxId="maximumInvestment"
                  minPlaceholder="Mínimo"
                  maxPlaceholder="Máximo (opcional)"
                  minError={errors.minimumInvestment?.message}
                  maxError={errors.maximumInvestment?.message}
                  minRegister={register('minimumInvestment')}
                  maxRegister={register('maximumInvestment')}
                  disabled={updateMutation.isPending || isRefetching}
                  formatType="currency"
                  labelClassName="text-xl font-manrope font-semibold"
                />

                <RangeInput
                  label="Retorno sobre Investimento (meses)"
                  minId="minimumReturnOnInvestment"
                  maxId="maximumReturnOnInvestment"
                  minPlaceholder="Mínimo"
                  maxPlaceholder="Máximo (opcional)"
                  minError={errors.minimumReturnOnInvestment?.message}
                  maxError={errors.maximumReturnOnInvestment?.message}
                  minRegister={register('minimumReturnOnInvestment')}
                  maxRegister={register('maximumReturnOnInvestment')}
                  disabled={updateMutation.isPending || isRefetching}
                  formatType="months"
                  labelClassName="text-xl font-manrope font-semibold"
                />

                <FormInput
                  label="Estado Sede"
                  id="headquarterState"
                  type="text"
                  error={errors.headquarterState?.message}
                  register={register('headquarterState')}
                  disabled={updateMutation.isPending || isRefetching}
                  labelClassName="text-xl font-manrope font-semibold"
                />

                <FormInput
                  label="Número de Unidades"
                  id="totalUnits"
                  type="text"
                  placeholder="0"
                  error={errors.totalUnits?.message}
                  register={register('totalUnits')}
                  disabled={updateMutation.isPending || isRefetching}
                  labelClassName="text-xl font-manrope font-semibold"
                />

                <FormInput
                  label="Segmento de atuação da franquia"
                  id="segment"
                  type="text"
                  error={errors.segment?.message}
                  register={register('segment')}
                  disabled={updateMutation.isPending || isRefetching}
                  labelClassName="text-xl font-manrope font-semibold"
                />

                <FormInput
                  label="Subsegmento primário"
                  id="subsegment"
                  type="text"
                  error={errors.subsegment?.message}
                  register={register('subsegment')}
                  disabled={updateMutation.isPending || isRefetching}
                  labelClassName="text-xl font-manrope font-semibold"
                />

                <FormInput
                  label="Tipo de Negócio"
                  id="businessType"
                  type="text"
                  error={errors.businessType?.message}
                  register={register('businessType')}
                  disabled={updateMutation.isPending || isRefetching}
                  labelClassName="text-xl font-manrope font-semibold"
                />
              </div>
            </div>

            {/* SideCard */}
            <div className="flex flex-col w-full gap-5">
              {/* SideCard Top */}
              <div className="flex flex-col w-full bg-white shadow-sm border border-border/50 p-4 sm:p-6 md:p-10 rounded-2xl">
                <h2 className="text-2xl font-manrope font-bold text-foreground mb-5">
                  Sobre o negócio
                </h2>

                <div className="flex flex-col gap-5">
                  <FormInput
                    label="Fundação"
                    id="brandFoundationYear"
                    type="text"
                    placeholder="YYYY"
                    error={errors.brandFoundationYear?.message}
                    register={register('brandFoundationYear')}
                    disabled={updateMutation.isPending || isRefetching}
                    labelClassName="text-xl font-manrope font-semibold"
                    maxLength={4}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault()
                      }
                    }}
                  />

                  <FormInput
                    label="Início da franquia"
                    id="franchiseStartYear"
                    type="text"
                    placeholder="YYYY"
                    error={errors.franchiseStartYear?.message}
                    register={register('franchiseStartYear')}
                    disabled={updateMutation.isPending || isRefetching}
                    labelClassName="text-xl font-manrope font-semibold"
                    maxLength={4}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault()
                      }
                    }}
                  />

                  <FormInput
                    label="Associada ABF desde"
                    id="abfSince"
                    type="text"
                    placeholder="YYYY"
                    error={errors.abfSince?.message}
                    register={register('abfSince')}
                    disabled={updateMutation.isPending || isRefetching}
                    labelClassName="text-xl font-manrope font-semibold"
                    maxLength={4}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault()
                      }
                    }}
                  />
                </div>
              </div>

              {/* SideCard Bottom */}
              <div className="flex flex-col w-full bg-white shadow-sm border border-border/50 p-10 rounded-2xl">
                <div className="flex flex-col mb-5">
                  <h2 className="text-2xl font-manrope font-bold text-foreground">
                    Informações de contato
                  </h2>
                  <p className="text-muted-foreground">
                    Última atualização pela franquia:{' '}
                    {formatDateToBrazilian(franchise.updatedAt)}
                  </p>
                </div>

                <div className="flex flex-col gap-5">
                  <PhoneInput
                    label="Telefone"
                    id="phone"
                    error={errors.phone?.message}
                    register={register('phone')}
                    value={phoneValue}
                    disabled={updateMutation.isPending || isRefetching}
                  />

                  <FormInput
                    label="E-mail"
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    error={errors.email?.message}
                    register={register('email')}
                    disabled={updateMutation.isPending || isRefetching}
                    labelClassName="text-xl font-manrope font-semibold"
                  />

                  <FormInput
                    label="Site"
                    id="website"
                    type="url"
                    placeholder="https://exemplo.com"
                    error={errors.website?.message}
                    register={register('website')}
                    disabled={updateMutation.isPending || isRefetching}
                    labelClassName="text-xl font-manrope font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </FormProvider>
  )
}
