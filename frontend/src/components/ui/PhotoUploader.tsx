'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import CameraIcon from '../icons/cameraIcon'
import DeleteIcon from '../icons/deleteIcon'

export default function PhotoUploader({
  allowPdf = true,
  onChange,
  defaultValue,
  maxSize = 5 * 1024 * 1024,
  module = 'news',
}: {
  allowPdf?: boolean
  onChange: (files: File[]) => void
  defaultValue?: string | null
  maxSize?: number
  module?: string
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [defaultLoaded, setDefaultLoaded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userDeleted, setUserDeleted] = useState(false) // Nova state para controlar se usuário deletou
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Debug logs
  useEffect(() => {
    console.log('PhotoUploader - Props:', {
      defaultValue,
      module,
      defaultLoaded,
      selectedFile: selectedFile?.name,
      userDeleted,
    })
  }, [defaultValue, module, defaultLoaded, selectedFile, userDeleted])

  // Reset state when defaultValue changes
  useEffect(() => {
    console.log('PhotoUploader - defaultValue changed, resetting state')
    setDefaultLoaded(false)
    setSelectedFile(null)
    setIsLoading(false)
    setUserDeleted(false) // Reset quando defaultValue muda
  }, [defaultValue])

  // Carregar arquivo padrão se existir
  useEffect(() => {
    async function fetchDefaultFile() {
      if (typeof window === 'undefined' || typeof File === 'undefined') {
        return
      }
      // Não carregar se não tem defaultValue, já foi carregado, ou usuário deletou
      if (!defaultValue || defaultLoaded || userDeleted) {
        console.log('PhotoUploader - Skipping fetch:', {
          defaultValue,
          defaultLoaded,
          userDeleted,
        })
        return
      }

      setIsLoading(true)
      console.log('PhotoUploader - Starting fetch for:', defaultValue)

      try {
        const fileUrl = defaultValue // Não modificar a URL que já vem completa

        console.log('PhotoUploader - Fetching from URL:', fileUrl)

        const response = await fetch(fileUrl, {
          method: 'GET',
          headers: {
            Accept: 'image/*',
          },
        })

        console.log('PhotoUploader - Response:', {
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
        console.log('PhotoUploader - Blob:', {
          size: blob.size,
          type: blob.type,
        })

        if (blob.size === 0) {
          throw new Error('Empty file received')
        }

        const filename = defaultValue.split('/').pop() || 'image'
        const file = new File([blob], filename, { type: blob.type })

        console.log('PhotoUploader - Created file:', {
          name: file.name,
          size: file.size,
          type: file.type,
        })

        setSelectedFile(file)
        onChange([file])
        setDefaultLoaded(true)
      } catch (error) {
        console.error('PhotoUploader - Error loading default file:', error)
        setDefaultLoaded(true) // Marcar como carregado mesmo com erro para evitar loops
      } finally {
        setIsLoading(false)
      }
    }

    fetchDefaultFile()
  }, [defaultValue, onChange, defaultLoaded, userDeleted]) // Adicionado userDeleted às dependências

  // Calculate progress percentage (0-100) based on file size vs maxSize
  const getProgressPercentage = () => {
    if (!selectedFile) return 0
    const percentage = Math.min((selectedFile.size / maxSize) * 100, 100)
    return percentage
  }

  const validateFile = (file: File): boolean => {
    const allowedTypes = allowPdf
      ? [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
        ]
      : ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
      alert(
        `Apenas arquivos ${allowPdf ? 'JPEG, PNG, GIF, WebP e PDF' : 'JPEG, PNG, GIF, WebP'} são permitidos`,
      )
      return false
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

    console.log('PhotoUploader - File changed:', file?.name || 'null')
    setSelectedFile(file)
    onChange(file ? [file] : [])

    // Se usuário selecionou um novo arquivo, marcar que não foi deletado
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

  const deleteImage = () => {
    console.log('PhotoUploader - Deleting image')
    setSelectedFile(null)
    onChange([])
    setUserDeleted(true) // Marcar que usuário deletou a imagem

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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
        accept={
          allowPdf
            ? 'image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf'
            : 'image/jpeg,image/jpg,image/png,image/gif,image/webp'
        }
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Loading state */}
      {isLoading && (
        <div className="border-dashed border-gray-300 rounded-2xl w-full min-h-[12vh] flex items-center justify-center border-2 flex-col gap-2 p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E25E3E]/20"></div>
          <span className="text-gray-600 text-sm">Carregando arquivo...</span>
        </div>
      )}

      {/* Show file when selected or loaded */}
      {!isLoading && selectedFile && (
        <div className="border-dashed border-gray-300 rounded-2xl w-full min-h-[12vh] flex items-center justify-center border-2 flex-col gap-2 p-4 relative">
          {selectedFile.type === 'application/pdf' ? (
            // PDF Display
            <div className="flex items-center justify-center flex-col gap-3 p-6">
              {/* PDF Icon */}
              <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
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
                <p className="text-gray-500 text-xs mt-1">
                  PDF - {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          ) : (
            // Image Display
            <div className="w-100 h-100 overflow-hidden">
              <Image
                src={URL.createObjectURL(selectedFile)}
                alt="Foto selecionada"
                fill
                className="object-cover rounded-2xl"
                onError={(e) => {
                  console.error('PhotoUploader - Error loading image:', e)
                }}
              />
            </div>
          )}

          {/* Delete button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              deleteImage()
            }}
            className="absolute top-2 right-2 bg-black hover:bg-red-600 rounded-full p-1.5 opacity-80 hover:opacity-100 transition-all duration-200 z-50 shadow-lg"
          >
            <DeleteIcon width={16} height={16} color="white" />
          </button>
        </div>
      )}

      {/* Drop zone - only show when no file is selected and not loading */}
      {!isLoading && !selectedFile && (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-dashed rounded-2xl w-full min-h-[12vh] flex items-center justify-center border-2 flex-col gap-2 transition-colors cursor-pointer p-4 ${
            isDragging
              ? 'border-[#E25E3E] bg-[#E25E3E]/10'
              : 'border-gray-300 hover:border-[#E25E3E]'
          }`}
        >
          <CameraIcon className="text-black" width={50} />
          <span className="text-gray-600 text-sm text-center">
            {isDragging
              ? 'Solte o arquivo aqui'
              : 'Clique ou arraste um arquivo aqui'}
          </span>
          <span className="text-xs text-gray-500 mt-1">
            Imagens (JPG, PNG, GIF, WebP) ou PDF
          </span>
        </div>
      )}
    </div>
  )
}
