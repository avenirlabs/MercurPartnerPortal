import { Button, Badge, toast } from "@medusajs/ui"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { GlobalProduct, GlobalVariant, VariantAttachmentInput, AttachRequest } from "../types"
import { useAttachGlobalProduct } from "../../../hooks/useCatalog"
import { useQueryClient } from "@tanstack/react-query"
import { productsQueryKeys } from "../../../hooks/api/products"

type ReviewAndSubmitProps = {
  product: GlobalProduct
  variants: GlobalVariant[]
  selectedVariants: Map<string, VariantAttachmentInput>
  onSuccess: () => void
  onPrev: () => void
}

export const ReviewAndSubmit = ({ 
  product,
  variants,
  selectedVariants,
  onSuccess,
  onPrev
}: ReviewAndSubmitProps) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const attachMutation = useAttachGlobalProduct()
  
  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    const attachRequest: AttachRequest = {
      product_id: product.id,
      variants: Array.from(selectedVariants.values())
    }
    
    try {
      await attachMutation.mutateAsync(attachRequest, {
        onSuccess: () => {
          // Invalidate products query to refresh the list
          queryClient.invalidateQueries({
            queryKey: productsQueryKeys.all
          })
          
          toast.success(
            t("products.attachSuccess.header", "Products attached successfully"),
            {
              description: t("products.attachSuccess.description", {
                count: selectedVariants.size,
                title: product.title
              }, `${selectedVariants.size} variant(s) of "${product.title}" have been attached to your catalog`)
            }
          )
          
          onSuccess()
        },
        onError: (error: any) => {
          toast.error(
            t("products.attachError.header", "Failed to attach products"),
            {
              description: error.message || t("products.attachError.description", "An error occurred while attaching the products")
            }
          )
        }
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const formatCurrency = (amount: number, currencyCode: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2
    }).format(amount / 100) // Assuming amounts are in minor units
  }
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">
          {t("products.reviewAttachment", "Review Attachment")}
        </h3>
        <p className="text-sm text-ui-fg-subtle">
          {t("products.reviewDescription", "Please review the details before submitting")}
        </p>
      </div>
      
      <div className="rounded-lg border p-4">
        <div className="mb-4">
          <h4 className="font-semibold mb-2">{product.title}</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm text-ui-fg-subtle">
              {t("products.selectedVariants", "Selected variants")}:
            </span>
            <Badge size="small" color="blue">
              {selectedVariants.size} / {variants.length}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-4">
          {Array.from(selectedVariants.entries()).map(([variantId, config]) => {
            const variant = variants.find(v => v.id === variantId)
            if (!variant) return null
            
            return (
              <div key={variantId} className="border rounded-lg p-3">
                <div className="font-medium mb-2">{variant.title}</div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-ui-fg-subtle">{t("fields.sellerSku", "Seller SKU")}: </span>
                    <span className="font-medium">{config.seller_sku || "-"}</span>
                  </div>
                  
                  <div>
                    <span className="text-ui-fg-subtle">{t("fields.settings", "Settings")}: </span>
                    <div className="flex gap-2">
                      {config.allow_backorder && (
                        <Badge size="xsmall" color="green">
                          {t("fields.backorderAllowed", "Backorder")}
                        </Badge>
                      )}
                      {config.manage_inventory && (
                        <Badge size="xsmall" color="blue">
                          {t("fields.managedInventory", "Managed")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 space-y-2">
                  <div>
                    <span className="text-sm text-ui-fg-subtle">{t("fields.prices", "Prices")}:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {config.prices
                        .filter(p => p.amount > 0)
                        .map((price) => (
                          <Badge key={price.region_id} size="small" color="grey">
                            {formatCurrency(price.amount, price.currency_code)}
                          </Badge>
                        ))}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm text-ui-fg-subtle">{t("fields.inventory", "Inventory")}:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {config.inventory_by_location.map((inv) => (
                        <Badge key={inv.location_id} size="small" color="grey">
                          {inv.quantity} units
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      <div className="rounded-lg bg-ui-bg-subtle p-4">
        <div className="text-sm space-y-1">
          <div className="font-semibold mb-2">{t("products.summary", "Summary")}</div>
          <div>
            • {t("products.summaryProduct", { title: product.title }, `Product: ${product.title}`)}
          </div>
          <div>
            • {t("products.summaryVariants", { count: selectedVariants.size }, `Variants to attach: ${selectedVariants.size}`)}
          </div>
          <div>
            • {t("products.summaryAction", "These variants will be added to your product catalog with the configured prices and inventory")}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between gap-2 pt-4 border-t">
        <Button 
          variant="secondary" 
          onClick={onPrev}
          disabled={isSubmitting}
        >
          {t("actions.back", "Back")}
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          {isSubmitting 
            ? t("actions.submitting", "Submitting...") 
            : t("actions.submit", "Submit")}
        </Button>
      </div>
    </div>
  )
}