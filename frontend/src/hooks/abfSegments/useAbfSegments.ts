import {
  AbfSegmentEntry,
  fetchAbfSegments,
  type FetchAbfSegmentsParams,
} from '@/src/services/abfSegments'
import { useQuery } from '@tanstack/react-query'

export function useAbfSegments(params: FetchAbfSegmentsParams) {
  return useQuery<AbfSegmentEntry[]>({
    queryKey: ['abfSegments', params],
    queryFn: () => fetchAbfSegments(params),
  })
}
