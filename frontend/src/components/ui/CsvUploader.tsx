import { useEffect, useRef, useState } from 'react'
import DeleteIcon from '../icons/deleteIcon'

export default function CsvUploader({
  onChange,
  defaultValue,
  maxSize = 5 * 1024 * 1024, // 10MB para CSV
  module = 'csv',
}: {
  onChange: (files: File[]) => void
  defaultValue?: string | null
  maxSize?: number
  module?: string
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [defaultLoaded, setDefaultLoaded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userDeleted, setUserDeleted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Debug logs
  useEffect(() => {
    console.log('CsvUploader - Props:', {
      defaultValue,
      module,
      defaultLoaded,
      selectedFile: selectedFile?.name,
      userDeleted,
    })
  }, [defaultValue, module, defaultLoaded, selectedFile, userDeleted])

  // Reset state when defaultValue changes
  useEffect(() => {
    console.log('CsvUploader - defaultValue changed, resetting state')
    setDefaultLoaded(false)
    setSelectedFile(null)
    setIsLoading(false)
    setUserDeleted(false)
  }, [defaultValue])

  // Carregar arquivo padrão se existir
  useEffect(() => {
    async function fetchDefaultFile() {
      if (!defaultValue || defaultLoaded || userDeleted) {
        console.log('CsvUploader - Skipping fetch:', {
          defaultValue,
          defaultLoaded,
          userDeleted,
        })
        return
      }

      setIsLoading(true)
      console.log('CsvUploader - Starting fetch for:', defaultValue)

      try {
        const fileUrl = defaultValue
        console.log('CsvUploader - Fetching from URL:', fileUrl)

        const response = await fetch(fileUrl, {
          method: 'GET',
          headers: {
            Accept: 'text/csv,application/csv',
          },
        })

        console.log('CsvUploader - Response:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        })

        if (!response.ok) {
          throw new Error(
            `HTTP error! status: ${response.status} - ${response.statusText}`,
          )
        }

        const blob = await response.blob()
        console.log('CsvUploader - Blob:', {
          size: blob.size,
          type: blob.type,
        })

        if (blob.size === 0) {
          throw new Error('Empty file received')
        }

        const filename = defaultValue.split('/').pop() || 'file.csv'
        const file = new File([blob], filename, { type: 'text/csv' })

        console.log('CsvUploader - Created file:', {
          name: file.name,
          size: file.size,
          type: file.type,
        })

        setSelectedFile(file)
        onChange([file])
        setDefaultLoaded(true)
      } catch (error) {
        console.error('CsvUploader - Error loading default file:', error)
        setDefaultLoaded(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDefaultFile()
  }, [defaultValue, onChange, defaultLoaded, userDeleted])

  // Calculate progress percentage (0-100) based on file size vs maxSize
  const getProgressPercentage = () => {
    if (!selectedFile) return 0
    const percentage = Math.min((selectedFile.size / maxSize) * 100, 100)
    return percentage
  }

  const validateFile = (file: File): boolean => {
    const allowedTypes = ['text/csv', 'application/csv', 'text/plain']
    const allowedExtensions = ['.csv']

    // Check file extension
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf('.'))
    if (!allowedExtensions.includes(fileExtension)) {
      alert('Apenas arquivos CSV são permitidos')
      return false
    }

    // Check MIME type (pode ser menos restritivo para CSV)
    if (!allowedTypes.includes(file.type) && file.type !== '') {
      console.warn(
        'Tipo MIME não reconhecido, mas extensão é válida:',
        file.type,
      )
    }

    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(2)
      alert(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`)
      return false
    }

    return true
  }

  const handleFileChange = (file: File | null) => {
    if (file && !validateFile(file)) {
      return
    }

    console.log('CsvUploader - File changed:', file?.name || 'null')
    setSelectedFile(file)
    onChange(file ? [file] : [])

    if (file) {
      setUserDeleted(false)
    }
  }

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    handleFileChange(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      handleFileChange(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const deleteFile = () => {
    console.log('CsvUploader - Deleting file')
    setSelectedFile(null)
    onChange([])
    setUserDeleted(true)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const progressPercentage = getProgressPercentage()
  const maxSizeMB = maxSize / 1024 / 1024

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="flex items-center mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              progressPercentage >= 100 ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <span className="text-sm ml-5 text-[#E25E3E]">{maxSizeMB}MB</span>

        {progressPercentage >= 100 && (
          <span className="text-xs text-red-500 mt-1">
            Arquivo excede o limite de {maxSizeMB}MB
          </span>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv,application/csv"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Loading state */}
      {isLoading && (
        <div className="border-dashed border-gray-300 rounded-2xl w-full min-h-[15vh] flex items-center justify-center border-2 flex-col gap-2 p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E25E3E]/20"></div>
          <span className="text-gray-600 text-sm">Carregando arquivo...</span>
        </div>
      )}

      {/* Show file info when file is selected or loaded */}
      {!isLoading && selectedFile && (
        <div className="border-dashed border-gray-300 rounded-2xl w-full min-w-[20vw] min-h-[15vh] flex items-center justify-center border-2 flex-col gap-2 p-4 relative">
          <div className="flex items-center justify-center flex-col gap-3 p-6">
            {/* CSV Icon */}
            <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            {/* File info */}
            <div className="text-center">
              <p className="font-medium text-gray-900 text-sm">
                {selectedFile.name}
              </p>
              <p className="text-gray-500 text-xs">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>

            {/* Delete button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                deleteFile()
              }}
              className="absolute top-2 right-2 bg-black hover:bg-red-600 rounded-full p-1.5 opacity-80 hover:opacity-100 transition-all duration-200 z-50 shadow-lg"
            >
              <DeleteIcon width={16} height={16} color="white" />
            </button>
          </div>
        </div>
      )}

      {/* Drop zone - only show when no file is selected and not loading */}
      {!isLoading && !selectedFile && (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-dashed rounded-2xl w-full min-w-[20vw] min-h-[15vh] flex items-center justify-center border-2 flex-col gap-2 transition-colors cursor-pointer p-4 ${
            isDragging
              ? 'border-[#E25E3E] bg-[#E25E3E]/10'
              : 'border-gray-300 hover:border-[#E25E3E]'
          }`}
        >
          {/* CSV Icon */}
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-gray-600"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <span className="text-gray-600 text-sm text-center">
            {isDragging
              ? 'Solte o arquivo CSV aqui'
              : 'Clique ou arraste um arquivo CSV aqui'}
          </span>
        </div>
      )}
    </div>
  )
}
