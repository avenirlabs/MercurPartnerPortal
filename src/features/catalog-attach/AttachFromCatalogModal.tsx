import { FocusModal, Button, ProgressTabs, ProgressAccordion } from "@medusajs/ui"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { SearchGlobalProducts } from "./steps/SearchGlobalProducts"
import { ConfigureVariants } from "./steps/ConfigureVariants"
import { ReviewAndSubmit } from "./steps/ReviewAndSubmit"
import { AttachmentData, GlobalProduct, VariantAttachmentInput } from "./types"
import { useStockLocations } from "../../hooks/api/stock-locations"
import { useRegions } from "../../hooks/api/regions"

type AttachFromCatalogModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const AttachFromCatalogModal = ({ 
  open, 
  onOpenChange 
}: AttachFromCatalogModalProps) => {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(0)
  
  // Load stock locations and regions
  const { stock_locations, isLoading: locationsLoading } = useStockLocations()
  const { regions, isLoading: regionsLoading } = useRegions()
  
  // Wizard state
  const [attachmentData, setAttachmentData] = useState<AttachmentData>({
    selectedProduct: null,
    productVariants: [],
    selectedVariants: new Map(),
    stockLocations: stock_locations || [],
    regions: regions || []
  })
  
  // Update stock locations and regions when loaded
  useEffect(() => {
    if (stock_locations) {
      setAttachmentData(prev => ({
        ...prev,
        stockLocations: stock_locations
      }))
    }
  }, [stock_locations])
  
  useEffect(() => {
    if (regions) {
      setAttachmentData(prev => ({
        ...prev,
        regions: regions
      }))
    }
  }, [regions])
  
  const handleProductSelect = (product: GlobalProduct) => {
    setAttachmentData(prev => ({
      ...prev,
      selectedProduct: product,
      selectedVariants: new Map() // Reset variants when product changes
    }))
    setCurrentStep(1)
  }
  
  const handleVariantsConfigured = (variants: Map<string, VariantAttachmentInput>) => {
    setAttachmentData(prev => ({
      ...prev,
      selectedVariants: variants
    }))
    setCurrentStep(2)
  }
  
  const handleGoBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  const handleClose = () => {
    // Reset state
    setCurrentStep(0)
    setAttachmentData({
      selectedProduct: null,
      productVariants: [],
      selectedVariants: new Map(),
      stockLocations: stock_locations || [],
      regions: regions || []
    })
    onOpenChange(false)
  }
  
  const steps = [
    {
      title: t("products.attachFromCatalog.searchProducts", "Search Products"),
      description: t("products.attachFromCatalog.searchDescription", "Find products from the global catalog")
    },
    {
      title: t("products.attachFromCatalog.configureVariants", "Configure Variants"),
      description: t("products.attachFromCatalog.configureDescription", "Set SKU, prices, and inventory")
    },
    {
      title: t("products.attachFromCatalog.review", "Review & Submit"),
      description: t("products.attachFromCatalog.reviewDescription", "Review and confirm attachment")
    }
  ]
  
  const isLoading = locationsLoading || regionsLoading
  
  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content>
        <FocusModal.Header>
          <div className="flex items-center justify-between">
            <h1 className="text-ui-fg-base text-xl font-semibold">
              {t("products.attachFromCatalog", "Attach from Catalog")}
            </h1>
            <Button variant="transparent" size="small" onClick={handleClose}>
              {t("actions.close", "Close")}
            </Button>
          </div>
          <ProgressTabs value={currentStep.toString()} className="mt-4">
            <ProgressTabs.List>
              {steps.map((step, index) => (
                <ProgressTabs.Trigger 
                  key={index} 
                  value={index.toString()}
                  status={
                    index < currentStep ? "completed" : 
                    index === currentStep ? "in-progress" : 
                    "not-started"
                  }
                  disabled={index > currentStep}
                >
                  <span className="text-sm">{step.title}</span>
                </ProgressTabs.Trigger>
              ))}
            </ProgressTabs.List>
          </ProgressTabs>
        </FocusModal.Header>
        
        <FocusModal.Body className="relative">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-ui-fg-subtle">
                {t("general.loading", "Loading...")}
              </div>
            </div>
          ) : (
            <>
              {currentStep === 0 && (
                <SearchGlobalProducts 
                  onProductSelect={handleProductSelect}
                  onCancel={handleClose}
                />
              )}
              
              {currentStep === 1 && attachmentData.selectedProduct && (
                <ConfigureVariants
                  product={attachmentData.selectedProduct}
                  variants={attachmentData.productVariants}
                  selectedVariants={attachmentData.selectedVariants}
                  stockLocations={attachmentData.stockLocations}
                  regions={attachmentData.regions}
                  onNext={handleVariantsConfigured}
                  onPrev={handleGoBack}
                />
              )}
              
              {currentStep === 2 && attachmentData.selectedProduct && (
                <ReviewAndSubmit
                  product={attachmentData.selectedProduct}
                  variants={attachmentData.productVariants}
                  selectedVariants={attachmentData.selectedVariants}
                  onSuccess={handleClose}
                  onPrev={handleGoBack}
                />
              )}
            </>
          )}
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  )
}