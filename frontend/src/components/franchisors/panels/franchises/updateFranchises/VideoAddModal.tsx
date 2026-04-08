'use client'

import VideoIcon from '@/src/components/icons/videoIcon'
import RoundedButton from '@/src/components/ui/RoundedButton'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

interface VideoAddModalProps {
  onAdd: (videoUrl: string) => void
  isPending?: boolean
}

const VideoAddSchema = z.object({
  videoUrl: z
    .string()
    .min(1, 'URL é obrigatória')
    .url('Precisa ser uma URL válida')
    .refine(
      (url) => url.includes('youtube.com') || url.includes('youtu.be'),
      'Apenas vídeos do YouTube são suportados',
    ),
})

type VideoAddSchema = z.infer<typeof VideoAddSchema>

export default function VideoAddModal({
  onAdd,
  isPending = false,
}: VideoAddModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<VideoAddSchema>({
    resolver: zodResolver(VideoAddSchema),
    mode: 'onChange',
  })

  const handleAdd = async ({ videoUrl }: VideoAddSchema) => {
    onAdd(videoUrl)
    reset()
  }

  return (
    <form
      className="space-y-4 w-full"
      onSubmit={handleSubmit(handleAdd)}
      noValidate
    >
      <div className="flex flex-col">
        <label className="mb-2 font-medium text-foreground" htmlFor="videoUrl">
          URL do vídeo do YouTube
        </label>
        <div className="relative">
          <input
            type="text"
            id="videoUrl"
            className="border border-input rounded-md h-[4vh] p-5 pl-12 w-full font-normal placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            placeholder="https://www.youtube.com/watch?v=..."
            disabled={isPending}
            {...register('videoUrl')}
          />
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <VideoIcon width={20} height={20} color="#747473" />
          </div>
        </div>

        {errors.videoUrl && (
          <div className="text-destructive text-sm mt-1">
            {errors.videoUrl.message}
          </div>
        )}
      </div>

      <div className="grid w-full mt-6">
        <RoundedButton
          color="hsl(10 79% 57%)"
          hoverColor="hsl(240 24% 12%)"
          text={isPending ? 'Adicionando...' : 'Adicionar Vídeo'}
          textColor="white"
          disabled={isPending}
        />
      </div>
    </form>
  )
}
