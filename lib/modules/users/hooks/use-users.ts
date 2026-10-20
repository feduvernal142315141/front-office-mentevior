
import { MemberUserListItem} from "@/lib/types/user.types"
import {getUsers} from "@/lib/modules/users/services/users.service";
import {QueryModel} from "@/lib/models/queryModel";
import { usePaginatedResource } from "@/lib/hooks/use-paginated-resource"

interface UseUsersParams {
  page?: number
  pageSize?: number
  filters?: string[]
}

interface UseUsersReturn {
  users: MemberUserListItem[]
  isLoading: boolean
  error: Error | null
  totalCount: number
  refetch: (params?: UseUsersParams) => Promise<void>
}

export function useUsers(initialParams?: UseUsersParams): UseUsersReturn {
  const initialParamsKey = JSON.stringify({
    page: initialParams?.page ?? 0,
    pageSize: initialParams?.pageSize ?? 10,
    filters: initialParams?.filters ?? [],
  })

  const resource = usePaginatedResource<MemberUserListItem, UseUsersParams>({
    params: initialParams,
    paramsKey: initialParamsKey,
    fetcher: async (params) => {
      const query: QueryModel = {
        page: params?.page ?? 0,
        pageSize: params?.pageSize ?? 10,
        filters: params?.filters && params.filters.length ? params.filters : undefined,
        orders: undefined,
      }
      const data = await getUsers(query)
      return { items: data.users, totalCount: data.totalCount }
    },
  })

  return {
    users: resource.items,
    isLoading: resource.isLoading,
    error: resource.error,
    totalCount: resource.totalCount,
    refetch: resource.refetch,
  }
}
