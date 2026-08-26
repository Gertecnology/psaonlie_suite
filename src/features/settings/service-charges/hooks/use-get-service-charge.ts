import { useQuery } from '@tanstack/react-query'
import { getServiceChargeById } from '../services/service-charge.service'

/**
 * A single service charge, by id.
 *
 * The edit page is reachable by URL, so it cannot count on the record being in
 * memory: a reload, a shared link or a bookmark all arrive with nothing but the
 * id. The old drawer took the whole object through a store, which is precisely
 * why it only ever opened from the row it belonged to.
 */
export function useGetServiceCharge(id: string | undefined) {
  return useQuery({
    queryKey: ['service-charge', id],
    queryFn: () => getServiceChargeById(id!),
    enabled: Boolean(id),
  })
}
