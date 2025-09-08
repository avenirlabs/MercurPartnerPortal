import { Button } from "@medusajs/ui"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { AttachFromCatalogModal } from "./AttachFromCatalogModal"
import { useConfiguration } from "../../hooks/api/store"

export const AttachFromCatalogButton = () => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  
  // Get configuration to check if global_product_catalog is enabled
  const { configuration, isLoading } = useConfiguration()
  
  // TEMPORARY: Force enable button for testing
  // TODO: Remove this override once backend configuration is properly set
  const globalProductCatalogEnabled = true // configuration?.global_product_catalog === true
  
  if (isLoading || !globalProductCatalogEnabled) {
    return null
  }
  
  return (
    <>
      <Button 
        size="small" 
        variant="secondary"
        onClick={() => setOpen(true)}
      >
        {t("products.attachFromCatalog", "Attach from Catalog")}
      </Button>
      {open && (
        <AttachFromCatalogModal 
          open={open} 
          onOpenChange={setOpen} 
        />
      )}
    </>
  )
}