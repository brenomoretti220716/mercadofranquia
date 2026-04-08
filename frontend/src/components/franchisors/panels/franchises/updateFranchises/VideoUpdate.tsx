'use client'

import AddIcon from '@/src/components/icons/addIcon'
import TrashIcon from '@/src/components/icons/trashIcon'
import VideoIcon from '@/src/components/icons/videoIcon'
import BaseModal from '@/src/components/ui/BaseModal'
import LazyYouTubeEmbed from '@/src/components/ui/LazyYouTubeEmbed'
import ModalConfirmation from '@/src/components/ui/ModalConfirmation'
import {
  useDeleteVideo,
  useUpdateFranchise,
} from '@/src/hooks/franchises/useFranchiseMutations'
import { Franchise } from '@/src/schemas/franchises/Franchise'
import { normalizeVideoUrls } from '@/src/utils/franchiseImageUtils'
import { useState } from 'react'
import VideoAddModal from './VideoAddModal'

interface VideoUpdateProps {
  franchise: Franchise
}

export default function VideoUpdate({ franchise }: VideoUpdateProps) {
  const updateFranchiseMutation = useUpdateFranchise()
  const deleteVideoMutation = useDeleteVideo()
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Get existing videos
  const existingVideos = normalizeVideoUrls(franchise.videoUrl)

  const handleAddVideo = async (videoUrl: string) => {
    // Check if video already exists
    if (existingVideos.includes(videoUrl)) {
      alert('Este vídeo já foi adicionado')
      return
    }

    // Merge with existing videos
    const updatedVideos = [...existingVideos, videoUrl]
    const videoUrlJson = JSON.stringify(updatedVideos)

    await updateFranchiseMutation.mutateAsync({
      data: { videoUrl: videoUrlJson },
      id: franchise.id,
    })

    setIsAddModalOpen(false)
  }

  const handleDeleteClick = (videoUrl: string) => {
    setVideoToDelete(videoUrl)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!videoToDelete) return

    await deleteVideoMutation.mutateAsync({
      franchiseId: franchise.id,
      videoUrl: videoToDelete,
    })

    setVideoToDelete(null)
    setIsDeleteModalOpen(false)
  }

  const handleCancelDelete = () => {
    setVideoToDelete(null)
    setIsDeleteModalOpen(false)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-bold text-2xl text-foreground">
            Vídeos do YouTube
          </h2>
          <p className="text-muted-foreground-600 text-sm mt-1">
            Adicione ou remova vídeos da sua franquia
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-muted-foreground-500">
              • Apenas vídeos do YouTube são suportados
            </p>
            <p className="text-sm text-muted-foreground-500">
              • Cole a URL completa do vídeo (ex:
              https://www.youtube.com/watch?v=...)
            </p>
          </div>
        </div>
      </div>

      {/* Videos Card with Grid and Add Container */}
      <div className="bg-white rounded-2xl p-5">
        {existingVideos.length === 0 ? (
          <div
            onClick={() => setIsAddModalOpen(true)}
            className="border-2 border-dashed border-input-300 rounded-2xl p-6 sm:p-10 flex items-center justify-center cursor-pointer hover:border-primary transition-colors min-h-[200px]"
          >
            <div className="flex flex-col items-center gap-2">
              <VideoIcon width={50} color="#747473" />
              <span className="text-muted-foreground-600 text-sm text-center">
                Clique para adicionar um vídeo
              </span>
              <span className="text-xs text-muted-foreground-500 mt-1">
                Vídeos do YouTube
              </span>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {existingVideos.map((videoUrl, index) => (
                <div
                  key={index}
                  className="relative aspect-video rounded-lg overflow-hidden bg-secondary-100 group"
                >
                  <LazyYouTubeEmbed
                    videoUrl={videoUrl}
                    title={`Vídeo ${index + 1}`}
                    className="h-full w-full"
                  />
                  <button
                    onClick={() => handleDeleteClick(videoUrl)}
                    disabled={deleteVideoMutation.isPending}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50 z-10"
                    title="Deletar vídeo"
                  >
                    <TrashIcon width={16} height={16} />
                  </button>
                </div>
              ))}

              {/* Add New Video Card */}
              <div
                onClick={() => setIsAddModalOpen(true)}
                className="border-2 border-dashed border-input-300 rounded-2xl p-4 sm:p-6 flex items-center justify-center cursor-pointer hover:border-primary transition-colors aspect-video"
              >
                <div className="flex flex-col items-center gap-2">
                  <AddIcon width={28} height={28} color="#747473" />
                  <span className="text-muted-foreground-600 text-xs sm:text-sm text-center">
                    Adicionar novo
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Video Modal */}
      <BaseModal
        tittleText="Adicionar vídeo"
        subtittleText="Cole a URL do vídeo do YouTube que deseja adicionar"
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      >
        <VideoAddModal
          onAdd={handleAddVideo}
          isPending={updateFranchiseMutation.isPending}
        />
      </BaseModal>

      {/* Delete Confirmation Modal */}
      <ModalConfirmation
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        action="deletar este vídeo"
        text="Esta ação não pode ser desfeita. O vídeo será permanentemente removido."
        buttonText="Deletar Vídeo"
        isLoading={deleteVideoMutation.isPending}
      />
    </div>
  )
}
