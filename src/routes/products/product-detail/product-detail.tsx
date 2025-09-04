import { useParams } from "react-router-dom"

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { useProduct } from "../../../hooks/api/products"
import { ProductAttributeSection } from "./components/product-attribute-section"
import { ProductGeneralSection } from "./components/product-general-section"
import { ProductMediaSection } from "./components/product-media-section"
import { ProductOptionSection } from "./components/product-option-section"
import { ProductOrganizationSection } from "./components/product-organization-section"
import { ProductVariantSection } from "./components/product-variant-section"

import { useDashboardExtension } from "../../../extensions"
import { ProductAdditionalAttributesSection } from "./components/product-additional-attribute-section/ProductAdditionalAttributesSection"
// import { ProductShippingProfileSection } from './components/product-shipping-profile-section';

export const ProductDetail = () => {
  const { id } = useParams()
  
  // Log the product ID being requested
  console.log("Loading product:", id)
  
  const { product, isLoading, isError, error } = useProduct(id!, {
    fields: "*variants.inventory_items,*categories",
  })

  const { getWidgets } = useDashboardExtension()

  const after = getWidgets("product.details.after")
  const before = getWidgets("product.details.before")
  const sideAfter = getWidgets("product.details.side.after")
  const sideBefore = getWidgets("product.details.side.before")

  if (isLoading) {
    return <TwoColumnPageSkeleton mainSections={4} sidebarSections={3} />
  }

  if (isError) {
    console.error("Product load error:", error)
    
    // Show a user-friendly error message instead of throwing
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="text-ui-fg-error mb-2">Failed to load product</div>
          <div className="text-ui-fg-subtle text-sm">
            {error?.message || "Product not found or you don't have access to it"}
          </div>
        </div>
      </div>
    )
  }
  
  if (!product) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-ui-fg-subtle">Product not found</div>
      </div>
    )
  }

  return (
    <TwoColumnPage
      widgets={{
        after,
        before,
        sideAfter,
        sideBefore,
      }}
      data={product}
    >
      <TwoColumnPage.Main>
        <ProductGeneralSection product={product} />
        <ProductMediaSection product={product} />
        <ProductOptionSection product={product} />
        <ProductVariantSection product={product} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        {/* <ProductShippingProfileSection product={product} /> */}
        <ProductOrganizationSection product={product} />
        <ProductAttributeSection product={product} />
        {/* <ProductAdditionalAttributesSection product={product as any} /> */}
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}
