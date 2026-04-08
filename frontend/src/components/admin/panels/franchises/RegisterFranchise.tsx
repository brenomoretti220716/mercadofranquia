import Api from '@/src/api/Api'
import CsvUploader from '@/src/components/ui/CsvUploader'
import RoundedButton from '@/src/components/ui/RoundedButton'
import { franchiseKeys } from '@/src/queries/franchises'
import { getClientAuthCookie } from '@/src/utils/clientCookie'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

interface ImportError {
  row: number
  data: Record<string, unknown>
  error: string
}

interface ImportResult {
  total: number
  success: number
  failed: number
  errors: ImportError[]
}

const uploadCsv = async (file: File): Promise<ImportResult> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(Api('/franchises/import/csv'), {
    method: 'POST',
    body: formData,
    headers: {
      Authorization: `Bearer ${getClientAuthCookie()}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      (errorData && (errorData.message as string)) ||
        `HTTP error! status: ${response.status}`,
    )
  }

  const result = (await response.json()) as ImportResult

  // Se nenhuma franquia foi importada, tratar como erro para o usuário
  if (!result || typeof result.success !== 'number') {
    throw new Error('Resposta inesperada do servidor ao importar CSV.')
  }

  if (result.success === 0) {
    const firstError = result.errors?.[0]
    const errorMessage = firstError
      ? `Linha ${firstError.row}: ${firstError.error}`
      : 'Nenhuma linha foi importada. Verifique o formato do arquivo.'

    throw new Error(errorMessage)
  }

  return result
}

interface RegisterFranchiseProps {
  onSuccess?: () => void
}

export default function RegisterFranchise({
  onSuccess,
}: RegisterFranchiseProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const queryClient = useQueryClient()

  const csvExampleHeader =
    'nome,descrição,segmento,investimento_mínimo,investimento_máximo,cidade,estado,site,e-mail,telefone,total_unidades'

  const handleDownloadExampleCsv = () => {
    const csvContent = `${csvExampleHeader}\n`
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'franchises-example.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const importMutation = useMutation({
    mutationFn: uploadCsv,
    onSuccess: (result) => {
      toast.success('Arquivo CSV importado com sucesso!', {
        description: `${result.success} franquia(s) importada(s) com sucesso.`,
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
      console.error('Erro ao importar CSV:', error)
      toast.error('Erro ao importar arquivo CSV', {
        description:
          error.message || 'Ocorreu um erro inesperado ao processar o arquivo.',
        duration: 5000,
      })
    },
  })

  const handleFileChange = (files: File[]) => {
    const file = files[0] || null
    setSelectedFile(file)
  }

  const handleImport = () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo CSV', {
        description:
          'É necessário selecionar um arquivo CSV antes de importar.',
      })
      return
    }

    importMutation.mutate(selectedFile)
  }

  const isImporting = importMutation.isPending

  return (
    <div className="flex flex-col m-10 w-auto gap-5">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload de Arquivo CSV
        </h3>

        <div className="rounded-md border border-orange-300 bg-orange-50 p-3 text-xs text-orange-900 space-y-1">
          <p className="font-semibold uppercase tracking-wide text-[11px]">
            Atenção ao preenchimento do arquivo
          </p>
          <p>
            Selecione um arquivo CSV contendo os dados das franquias para
            importação. <strong>Não altere os nomes das colunas</strong> do
            arquivo de exemplo.
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>
              <strong>nome</strong> é obrigatório; as demais colunas são
              opcionais.
            </li>
            <li>
              Use apenas números para valores de investimento (sem R$, pontos ou
              vírgulas).
            </li>
            <li>
              Telefone deve conter DDD (10 ou 11 dígitos) e e-mail/site devem
              ser válidos. Sites devem começar com <code>http://</code> ou{' '}
              <code>https://</code>.
            </li>
          </ul>
          <p>
            Você pode baixar um arquivo de exemplo com o formato correto{' '}
            <button
              type="button"
              onClick={handleDownloadExampleCsv}
              className="font-semibold text-[#E25E3E] underline hover:text-[#E20E3E]"
            >
              clicando aqui
            </button>
            .
          </p>
        </div>
      </div>

      <CsvUploader onChange={handleFileChange} maxSize={10 * 1024 * 1024} />

      <RoundedButton
        color={!selectedFile ? '#777777' : '#E25E3E'}
        hoverColor="#000000"
        text={isImporting ? 'Importando...' : 'Importar CSV'}
        textColor="white"
        onClick={handleImport}
        disabled={!selectedFile || isImporting}
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
  )
}
