export type GlobalProduct = {
  id: string
  title: string
  status: "published" | "draft" | "proposed"
  handle?: string
  collection_title?: string | null
  variants_count: number
}

export type GlobalVariant = {
  id: string
  title: string
  sku?: string | null
  options?: Array<{ id: string; title: string; value: string }>
}

export type SellerStockLocation = {
  id: string
  name: string
}

export type RegionPrice = {
  region_id: string
  currency_code: string
  amount: number // in minor units if that's what the panel uses elsewhere
}

export type VariantAttachmentInput = {
  variant_id: string
  seller_sku?: string
  allow_backorder?: boolean
  manage_inventory?: boolean
  prices: RegionPrice[]
  inventory_by_location: Array<{ location_id: string; quantity: number }>
}

export type AttachRequest = {
  product_id: string
  variants: VariantAttachmentInput[]
}

export type WizardStepProps = {
  onNext: () => void
  onPrev: () => void
}

export type AttachmentData = {
  selectedProduct: GlobalProduct | null
  productVariants: GlobalVariant[]
  selectedVariants: Map<string, VariantAttachmentInput>
  stockLocations: SellerStockLocation[]
  regions: Array<{ id: string; currency_code: string; name: string }>
}