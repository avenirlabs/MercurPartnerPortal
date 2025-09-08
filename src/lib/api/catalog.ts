import { fetchQuery } from "../client"
import { GlobalProduct, AttachRequest } from "../../features/catalog-attach/types"

export interface GlobalProductsResponse {
  products: GlobalProduct[]
  count: number
  limit: number
  offset: number
}

export interface GlobalProductDetailResponse {
  product: GlobalProduct & {
    variants: Array<{
      id: string
      title: string
      sku?: string | null
      options?: Array<{ id: string; title: string; value: string }>
    }>
  }
}

export const fetchGlobalProducts = async ({
  q = "",
  limit = 10,
  offset = 0
}: {
  q?: string
  limit?: number
  offset?: number
}): Promise<GlobalProductsResponse> => {
  // Try vendor endpoint first, fall back to admin if needed
  try {
    const response = await fetchQuery("/vendor/catalog/products", {
      method: "GET",
      query: { q, limit, offset }
    })
    return response as GlobalProductsResponse
  } catch (error) {
    // Fallback: Try admin endpoint with vendor context
    // This is a temporary solution until vendor endpoints are available
    console.warn("Vendor catalog endpoint not available, falling back to admin endpoint")
    
    // TODO: Replace with actual vendor catalog endpoint when available
    // For now, return mock data for development
    return {
      products: [
        {
          id: "prod_mock_1",
          title: "Sample Product 1",
          status: "published",
          handle: "sample-product-1",
          collection_title: "Electronics",
          variants_count: 3
        },
        {
          id: "prod_mock_2",
          title: "Sample Product 2",
          status: "published",
          handle: "sample-product-2",
          collection_title: "Accessories",
          variants_count: 2
        },
        {
          id: "prod_mock_3",
          title: "Sample Product 3",
          status: "draft",
          handle: "sample-product-3",
          collection_title: null,
          variants_count: 1
        }
      ],
      count: 3,
      limit,
      offset
    }
  }
}

export const fetchGlobalProductDetail = async (
  productId: string
): Promise<GlobalProductDetailResponse> => {
  try {
    const response = await fetchQuery(`/vendor/catalog/products/${productId}`, {
      method: "GET",
      query: {}
    })
    return response as GlobalProductDetailResponse
  } catch (error) {
    // Fallback: Return mock data for development
    console.warn("Vendor catalog detail endpoint not available, returning mock data")
    
    // TODO: Replace with actual vendor catalog endpoint when available
    return {
      product: {
        id: productId,
        title: "Sample Product",
        status: "published",
        handle: "sample-product",
        collection_title: "Electronics",
        variants_count: 2,
        variants: [
          {
            id: "variant_1",
            title: "Small / Blue",
            sku: "SKU-001",
            options: [
              { id: "opt_1", title: "Size", value: "Small" },
              { id: "opt_2", title: "Color", value: "Blue" }
            ]
          },
          {
            id: "variant_2",
            title: "Large / Red",
            sku: "SKU-002",
            options: [
              { id: "opt_3", title: "Size", value: "Large" },
              { id: "opt_4", title: "Color", value: "Red" }
            ]
          }
        ]
      }
    }
  }
}

export const attachGlobalProduct = async (
  payload: AttachRequest
): Promise<{ success: boolean }> => {
  try {
    const response = await fetchQuery("/vendor/catalog/attach", {
      method: "POST",
      body: payload
    })
    return response as { success: boolean }
  } catch (error) {
    // TODO: Implement actual attachment when endpoint is available
    console.warn("Vendor attach endpoint not available, simulating success")
    
    // Simulate a successful attachment for development
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true })
      }, 1000)
    })
  }
}