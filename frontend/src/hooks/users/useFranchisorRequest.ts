import { franchiseKeys } from '@/src/queries/franchises'
import {
  ApproveFranchisorRequestDto,
  CreateFranchisorRequestDto,
  RejectFranchisorRequestDto,
  UpdateFranchisorRequestDto,
} from '@/src/schemas/users/FranchisorRequest'
import {
  approveFranchisorRequest,
  createFranchisorRequest,
  deleteFranchisorRequest,
  getAllFranchisorRequests,
  getMyFranchisorRequest,
  rejectFranchisorRequest,
  updateFranchisorRequest,
} from '@/src/services/users'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'

// User hooks (for franchisors)
export function useMyFranchisorRequest() {
  const { token } = useAuth()

  return useQuery({
    queryKey: ['franchisor-request', 'my-request'],
    queryFn: () => getMyFranchisorRequest(token!),
    enabled: !!token,
    retry: false,
  })
}

export function useCreateFranchisorRequest() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateFranchisorRequestDto) =>
      createFranchisorRequest(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['franchisor-request', 'my-request'],
      })
    },
  })
}

export function useUpdateFranchisorRequest() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateFranchisorRequestDto) =>
      updateFranchisorRequest(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['franchisor-request', 'my-request'],
      })
    },
  })
}

export function useDeleteFranchisorRequest() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => deleteFranchisorRequest(token!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['franchisor-request', 'my-request'],
      })
    },
  })
}

// Admin hooks
export function useAllFranchisorRequests() {
  const { token } = useAuth()

  return useQuery({
    queryKey: ['franchisor-requests', 'all'],
    queryFn: () => getAllFranchisorRequests(token!),
    enabled: !!token,
  })
}

export function useApproveFranchisorRequest() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      requestId,
      data,
    }: {
      requestId: string
      data: ApproveFranchisorRequestDto
    }) => approveFranchisorRequest(token!, requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['franchisor-requests', 'all'],
      })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      // Refresh available franchise options for the next approval
      queryClient.invalidateQueries({
        queryKey: franchiseKeys.availableOptions(),
      })
    },
  })
}

export function useRejectFranchisorRequest() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      requestId,
      data,
    }: {
      requestId: string
      data: RejectFranchisorRequestDto
    }) => rejectFranchisorRequest(token!, requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['franchisor-requests', 'all'],
      })
    },
  })
}
