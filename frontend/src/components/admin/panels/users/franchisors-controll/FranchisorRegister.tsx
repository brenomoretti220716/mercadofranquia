import MailIcon from '@/src/components/icons/emailIcon'
import ProfileIcon from '@/src/components/icons/profileIcon'
import CNPJInput from '@/src/components/ui/CNPJInput'
import FormInput from '@/src/components/ui/FormInput'
import MultiSelect from '@/src/components/ui/MultiSelect'
import PasswordInput from '@/src/components/ui/PasswordInput'
import RoundedButton from '@/src/components/ui/RoundedButton'
import { useFranchises } from '@/src/hooks/franchises/useFranchises'
import { useFranchisorRegister } from '@/src/hooks/users/useUserMutations'
import {
  FranchisorUserRegisterInput,
  FranchisorUserRegisterSchema,
} from '@/src/schemas/users/FranchisorUsers'
import { formatCNPJ, stripNonDigits } from '@/src/utils/formaters'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface FranchisorRegisterProps {
  onClose?: () => void
  onSuccess?: () => void
}

export default function FranchisorRegister({
  onClose,
  onSuccess,
}: FranchisorRegisterProps) {
  const registerMutation = useFranchisorRegister()
  const [showPassword, setShowPassword] = useState(false)

  const {
    franchiseOptions,
    isLoading: isLoadingFranchises,
    isError: hasErrorFranchises,
    error: franchisesError,
    refetch: refetchFranchises,
  } = useFranchises()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FranchisorUserRegisterInput>({
    resolver: zodResolver(FranchisorUserRegisterSchema),
    defaultValues: {
      ownedFranchises: [],
    },
  })

  async function handleAdmin(data: FranchisorUserRegisterInput) {
    registerMutation.mutate(data, {
      onSuccess: () => {
        reset()
        onSuccess?.()
        onClose?.()
      },
    })
  }

  if (isLoadingFranchises) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
        <span className="text-gray-600">Carregando franquias...</span>
      </div>
    )
  }

  if (hasErrorFranchises) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="text-red-500 mb-4">
          Erro ao carregar franquias: {franchisesError || 'Erro desconhecido'}
        </div>
        <button
          onClick={() => refetchFranchises()}
          className="px-4 py-2 bg-[#000000] text-white rounded-lg hover:bg-[#E25E3E]"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <form
      className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 rounded-md w-full"
      onSubmit={handleSubmit(handleAdmin)}
      noValidate
    >
      <FormInput
        label="Nome Completo"
        id="name"
        type="text"
        placeholder="Preencha o seu nome completo"
        leftIcon={<ProfileIcon width={20} height={20} color="#747473" />}
        error={errors.name?.message}
        register={register('name')}
        disabled={registerMutation.isPending}
        errorClassName="text-red-500"
      />

      <FormInput
        label="E-mail"
        id="email"
        type="email"
        placeholder="seu@email.com"
        leftIcon={<MailIcon width={20} height={20} color="#747473" />}
        error={errors.email?.message}
        register={register('email')}
        disabled={registerMutation.isPending}
        errorClassName="text-red-500"
      />

      <CNPJInput
        label="CNPJ"
        id="cpfCnpj"
        placeholder="00.000.000/0000-00"
        error={errors.cpfCnpj?.message}
        disabled={registerMutation.isPending}
        value={watch('cpfCnpj') ? formatCNPJ(watch('cpfCnpj')) : ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const formatted = formatCNPJ(e.target.value)
          // Store raw digits in form state
          setValue('cpfCnpj', stripNonDigits(formatted))
        }}
      />

      <div className="flex flex-col">
        <label htmlFor="ownedFranchises" className="mb-1 font-medium">
          Qual(is) a(s) franquia(s)?
        </label>

        {franchiseOptions.length > 0 ? (
          <MultiSelect
            options={franchiseOptions}
            value={watch('ownedFranchises') || []}
            onChange={(value) => setValue('ownedFranchises', value)}
            placeholder="Selecione a(s) franquia(s)"
            error={errors.ownedFranchises?.message}
          />
        ) : (
          <div className="p-3 border border-gray-300 rounded-3xl bg-gray-50">
            <span className="text-gray-500 text-sm">
              Nenhuma franquia disponível no momento
            </span>
          </div>
        )}
        <div className="text-red-500">{errors.ownedFranchises?.message}</div>
      </div>

      <PasswordInput
        label="Senha"
        id="password"
        error={errors.password?.message}
        register={register('password')}
        disabled={registerMutation.isPending}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
      />

      <PasswordInput
        label="Confirme sua senha"
        id="confirmPassword"
        error={errors.confirmPassword?.message}
        register={register('confirmPassword')}
        disabled={registerMutation.isPending}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
      />

      <div className="text-left mt-2">
        <p className="text-xs text-gray-500 mb-1">A senha deve conter:</p>
        <ul className="text-xs text-gray-500 list-disc list-inside space-y-0.5">
          <li>Mínimo de 6 caracteres</li>
          <li>Pelo menos uma letra maiúscula</li>
          <li>Pelo menos um número</li>
        </ul>
      </div>

      <div className="grid w-full mt-8">
        <RoundedButton
          color="#000000"
          hoverColor="#E25E3E"
          text={registerMutation.isPending ? 'Cadastrando...' : 'Cadastrar'}
          textColor="white"
          disabled={registerMutation.isPending}
        />
      </div>
      <div className="flex justify-center text-sm">
        <a
          onClick={onClose}
          className="text-[#E25E3E] underline ml-1 hover:text-[#E20E3E] cursor-pointer"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}
