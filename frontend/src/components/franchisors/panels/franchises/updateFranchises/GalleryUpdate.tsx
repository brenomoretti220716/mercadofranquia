'use client'

import CameraIcon from '@/src/components/icons/cameraIcon'
import TrashIcon from '@/src/components/icons/trashIcon'
import ModalConfirmation from '@/src/components/ui/ModalConfirmation'
import RoundedButton from '@/src/components/ui/RoundedButton'
import {
  useAddGalleryImages,
  useDeleteGalleryImage,
} from '@/src/hooks/franchises/useFranchiseMutations'
import { Franchise } from '@/src/schemas/franchises/Franchise'
import { normalizeGalleryUrls } from '@/src/utils/franchiseImageUtils'
import Image from 'next/image'
import { useRef, useState } from 'react'

interface GalleryUpdateProps {
  franchise: Franchise
}

export default function GalleryUpdate({ franchise }: GalleryUpdateProps) {
  const addGalleryImagesMutation = useAddGalleryImages()
  const deleteGalleryImageMutation = useDeleteGalleryImage()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [imageToDelete, setImageToDelete] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get existing gallery images
  const existingImages = normalizeGalleryUrls(franchise.galleryUrls)

  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ]
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(file.type)) {
      alert(
        `${file.name}: Apenas arquivos JPEG, PNG, GIF e WebP são permitidos`,
      )
      return false
    }
    if (file.size > maxSize) {
      alert(`${file.name}: O arquivo deve ter no máximo 5MB`)
      return false
    }
    return true
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter((file) => validateFile(file))

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles)
      // Create preview URLs
      const urls = validFiles.map((file) => URL.createObjectURL(file))
      setPreviewUrls(urls)
    }
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

    const files = Array.from(e.dataTransfer.files)
    const validFiles = files.filter((file) => validateFile(file))

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles)
      const urls = validFiles.map((file) => URL.createObjectURL(file))
      setPreviewUrls(urls)
    }
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    await addGalleryImagesMutation.mutateAsync({
      franchiseId: franchise.id,
      files: selectedFiles,
    })

    // Clear selection after successful upload
    setSelectedFiles([])
    setPreviewUrls([])
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeleteClick = (imageUrl: string) => {
    setImageToDelete(imageUrl)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!imageToDelete) return

    await deleteGalleryImageMutation.mutateAsync({
      franchiseId: franchise.id,
      imageUrl: imageToDelete,
    })

    setImageToDelete(null)
    setIsDeleteModalOpen(false)
  }

  const handleCancelDelete = () => {
    setImageToDelete(null)
    setIsDeleteModalOpen(false)
  }

  const clearSelection = () => {
    setSelectedFiles([])
    setPreviewUrls([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('http')) {
      return imageUrl
    }
    return `${process.env.NEXT_PUBLIC_API_URL}/uploads/franchises/${imageUrl}`
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-bold text-2xl">Galeria de Fotos</h2>
          <p className="text-muted-foreground-600 text-sm mt-1">
            Adicione ou remova imagens da galeria da sua franquia
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-muted-foreground-500">
              • Resolução recomendada: 1920x1080px
            </p>
            <p className="text-sm text-muted-foreground-500">
              • Você pode selecionar múltiplas imagens de uma vez
            </p>
            <p className="text-sm text-muted-foreground-500">
              • Tamanho máximo por arquivo: 5MB
            </p>
            <p className="text-sm text-muted-foreground-500">
              • Limite: até 10 imagens por upload
            </p>
          </div>
        </div>
      </div>

      {/* Gallery Card with Images and Upload */}
      <div className="bg-white rounded-2xl p-5">
        {existingImages.length === 0 && selectedFiles.length === 0 ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-2xl p-6 sm:p-10 flex items-center justify-center cursor-pointer 
              transition-colors min-h-[200px]
              ${
                isDragging
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-input-300 hover:border-[#E25E3E]'
              }
              ${addGalleryImagesMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="flex flex-col items-center gap-2">
              <CameraIcon className="text-black" width={50} />
              <span className="text-muted-foreground-600 text-sm text-center">
                {isDragging
                  ? 'Solte os arquivos aqui'
                  : 'Clique ou arraste arquivos aqui'}
              </span>
              <span className="text-xs text-muted-foreground-500 mt-1">
                Imagens (JPG, PNG, GIF, WebP)
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              multiple
              onChange={handleFileChange}
              disabled={addGalleryImagesMutation.isPending}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {existingImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
                >
                  <Image
                    src={getImageUrl(imageUrl)}
                    alt={`Gallery image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  />
                  <button
                    onClick={() => handleDeleteClick(imageUrl)}
                    disabled={deleteGalleryImageMutation.isPending}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                    title="Deletar imagem"
                  >
                    <TrashIcon width={16} height={16} />
                  </button>
                </div>
              ))}

              {/* Add New Images Card */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-2xl p-4 sm:p-6 flex items-center justify-center cursor-pointer 
                  transition-colors aspect-square
                  ${
                    isDragging
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-input-300 hover:border-[#E25E3E]'
                  }
                  ${addGalleryImagesMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex flex-col items-center gap-2">
                  <CameraIcon className="text-black" width={28} />
                  <span className="text-muted-foreground-600 text-xs sm:text-sm text-center">
                    {isDragging ? 'Solte os arquivos aqui' : 'Adicionar novo'}
                  </span>
                  <span className="text-xs text-muted-foreground-500 text-center px-1">
                    Imagens (JPG, PNG, GIF, WebP)
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  multiple
                  onChange={handleFileChange}
                  disabled={addGalleryImagesMutation.isPending}
                />
              </div>
            </div>

            {/* Preview Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center">
                  <p className="text-sm font-medium">
                    {selectedFiles.length} arquivo(s) selecionado(s)
                  </p>
                  <button
                    onClick={clearSelection}
                    className="text-sm text-muted-foreground-500 ml-5 hover:underline cursor-pointer hover:text-[#E25E3E]"
                    disabled={addGalleryImagesMutation.isPending}
                  >
                    Limpar seleção
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {previewUrls.map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-orange-300"
                    >
                      <Image
                        src={url}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                      />
                      <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-xs">
                        Novo
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <RoundedButton
                    color="hsl(10 79% 57%)"
                    textColor="white"
                    text={
                      addGalleryImagesMutation.isPending
                        ? 'Enviando...'
                        : `Adicionar ${selectedFiles.length} imagem${selectedFiles.length > 1 ? 'ns' : ''}`
                    }
                    disabled={addGalleryImagesMutation.isPending}
                    onClick={handleUpload}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ModalConfirmation
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        action="deletar esta imagem"
        text="Esta ação não pode ser desfeita. A imagem será permanentemente removida da galeria."
        buttonText="Deletar Imagem"
        isLoading={deleteGalleryImageMutation.isPending}
      />
    </div>
  )
}
