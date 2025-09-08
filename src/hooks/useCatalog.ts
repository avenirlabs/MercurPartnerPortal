import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions
} from "@tanstack/react-query"
import { FetchError } from "@medusajs/js-sdk"
import { 
  fetchGlobalProducts, 
  fetchGlobalProductDetail, 
  attachGlobalProduct,
  GlobalProductsResponse,
  GlobalProductDetailResponse
} from "../lib/api/catalog"
import { AttachRequest } from "../features/catalog-attach/types"
import { queryKeysFactory } from "../lib/query-key-factory"

const CATALOG_QUERY_KEY = "catalog" as const
export const catalogQueryKeys = queryKeysFactory(CATALOG_QUERY_KEY)

export const useGlobalProducts = (
  query: {
    q?: string
    limit?: number
    offset?: number
  },
  options?: Omit<
    UseQueryOptions<GlobalProductsResponse, FetchError>,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: catalogQueryKeys.list(query),
    queryFn: () => fetchGlobalProducts(query),
    ...options
  })

  return {
    products: data?.products || [],
    count: data?.count || 0,
    limit: data?.limit || query.limit || 10,
    offset: data?.offset || query.offset || 0,
    ...rest
  }
}

export const useGlobalProductDetail = (
  productId: string,
  options?: Omit<
    UseQueryOptions<GlobalProductDetailResponse, FetchError>,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: catalogQueryKeys.detail(productId),
    queryFn: () => fetchGlobalProductDetail(productId),
    enabled: !!productId,
    ...options
  })

  return {
    product: data?.product,
    ...rest
  }
}

export const useAttachGlobalProduct = (
  options?: UseMutationOptions<
    { success: boolean },
    FetchError,
    AttachRequest
  >
) => {
  return useMutation({
    mutationFn: (payload: AttachRequest) => attachGlobalProduct(payload),
    ...options
  })
}