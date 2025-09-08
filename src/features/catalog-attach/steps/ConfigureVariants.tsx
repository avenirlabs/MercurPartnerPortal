import { Button, Input, Checkbox, Switch, Alert, Label, Select, Table } from "@medusajs/ui"
import { ExclamationCircle } from "@medusajs/icons"
import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { GlobalProduct, GlobalVariant, VariantAttachmentInput, SellerStockLocation } from "../types"
import { useGlobalProductDetail } from "../../../hooks/useCatalog"

type ConfigureVariantsProps = {
  product: GlobalProduct
  variants: GlobalVariant[]
  selectedVariants: Map<string, VariantAttachmentInput>
  stockLocations: SellerStockLocation[]
  regions: Array<{ id: string; currency_code: string; name: string }>
  onNext: (variants: Map<string, VariantAttachmentInput>) => void
  onPrev: () => void
}

export const ConfigureVariants = ({ 
  product,
  variants: initialVariants,
  selectedVariants: initialSelectedVariants,
  stockLocations,
  regions,
  onNext,
  onPrev
}: ConfigureVariantsProps) => {
  const { t } = useTranslation()
  const [selectedVariants, setSelectedVariants] = useState<Map<string, VariantAttachmentInput>>(
    initialSelectedVariants || new Map()
  )
  
  // Fetch product details including variants
  const { product: productDetail, isLoading } = useGlobalProductDetail(product.id)
  const variants = productDetail?.variants || initialVariants || []
  
  const hasStockLocations = stockLocations && stockLocations.length > 0
  
  const handleVariantToggle = useCallback((variantId: string, checked: boolean) => {
    setSelectedVariants(prev => {
      const newMap = new Map(prev)
      if (checked) {
        // Initialize variant configuration with defaults
        newMap.set(variantId, {
          variant_id: variantId,
          seller_sku: "",
          allow_backorder: false,
          manage_inventory: true,
          prices: regions.map(region => ({
            region_id: region.id,
            currency_code: region.currency_code,
            amount: 0
          })),
          inventory_by_location: stockLocations.map(location => ({
            location_id: location.id,
            quantity: 0
          }))
        })
      } else {
        newMap.delete(variantId)
      }
      return newMap
    })
  }, [regions, stockLocations])
  
  const updateVariantField = useCallback((
    variantId: string, 
    field: keyof VariantAttachmentInput, 
    value: any
  ) => {
    setSelectedVariants(prev => {
      const newMap = new Map(prev)
      const variant = newMap.get(variantId)
      if (variant) {
        newMap.set(variantId, {
          ...variant,
          [field]: value
        })
      }
      return newMap
    })
  }, [])
  
  const updateVariantPrice = useCallback((
    variantId: string,
    regionId: string,
    amount: number
  ) => {
    setSelectedVariants(prev => {
      const newMap = new Map(prev)
      const variant = newMap.get(variantId)
      if (variant) {
        const updatedPrices = variant.prices.map(price =>
          price.region_id === regionId
            ? { ...price, amount }
            : price
        )
        newMap.set(variantId, {
          ...variant,
          prices: updatedPrices
        })
      }
      return newMap
    })
  }, [])
  
  const updateVariantInventory = useCallback((
    variantId: string,
    locationId: string,
    quantity: number
  ) => {
    setSelectedVariants(prev => {
      const newMap = new Map(prev)
      const variant = newMap.get(variantId)
      if (variant) {
        const updatedInventory = variant.inventory_by_location.map(inv =>
          inv.location_id === locationId
            ? { ...inv, quantity }
            : inv
        )
        newMap.set(variantId, {
          ...variant,
          inventory_by_location: updatedInventory
        })
      }
      return newMap
    })
  }, [])
  
  const isValidConfiguration = () => {
    if (selectedVariants.size === 0) return false
    if (!hasStockLocations) return false
    
    for (const [_, config] of selectedVariants) {
      // Check if at least one price is set
      const hasPrice = config.prices.some(p => p.amount > 0)
      if (!hasPrice) return false
      
      // Check if inventory is set for at least one location
      const hasInventory = config.inventory_by_location.some(inv => inv.quantity >= 0)
      if (!hasInventory) return false
    }
    
    return true
  }
  
  const handleNext = () => {
    if (isValidConfiguration()) {
      onNext(selectedVariants)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-ui-fg-subtle">
          {t("general.loading", "Loading...")}
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">{product.title}</h3>
        <p className="text-sm text-ui-fg-subtle">
          {t("products.selectVariantsToAttach", "Select variants to attach and configure their details")}
        </p>
      </div>
      
      {!hasStockLocations && (
        <Alert variant="error" dismissible={false}>
          <ExclamationCircle />
          <Alert.Content>
            {t("products.noStockLocations", "You need to have at least one stock location to attach products. Please create a stock location first.")}
          </Alert.Content>
        </Alert>
      )}
      
      <div className="overflow-hidden rounded-lg border">
        <div className="max-h-96 overflow-y-auto">
          {variants.map((variant) => {
            const isSelected = selectedVariants.has(variant.id)
            const config = selectedVariants.get(variant.id)
            
            return (
              <div key={variant.id} className="border-b last:border-b-0">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleVariantToggle(variant.id, checked as boolean)}
                      disabled={!hasStockLocations}
                    />
                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="font-medium">{variant.title}</div>
                        {variant.sku && (
                          <div className="text-sm text-ui-fg-subtle">
                            {t("fields.globalSku", "Global SKU")}: {variant.sku}
                          </div>
                        )}
                      </div>
                      
                      {isSelected && config && (
                        <div className="space-y-4 pl-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>{t("fields.sellerSku", "Seller SKU")}</Label>
                              <Input
                                type="text"
                                value={config.seller_sku || ""}
                                onChange={(e) => updateVariantField(variant.id, "seller_sku", e.target.value)}
                                placeholder={t("fields.enterSellerSku", "Enter seller SKU")}
                              />
                            </div>
                            <div className="flex items-end gap-4">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={config.allow_backorder || false}
                                  onCheckedChange={(checked) => updateVariantField(variant.id, "allow_backorder", checked)}
                                />
                                <Label>{t("fields.allowBackorder", "Allow Backorder")}</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={config.manage_inventory || true}
                                  onCheckedChange={(checked) => updateVariantField(variant.id, "manage_inventory", checked)}
                                />
                                <Label>{t("fields.manageInventory", "Manage Inventory")}</Label>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="mb-2">{t("fields.prices", "Prices")}</Label>
                            <div className="space-y-2">
                              {regions.map((region) => {
                                const price = config.prices.find(p => p.region_id === region.id)
                                return (
                                  <div key={region.id} className="flex items-center gap-2">
                                    <span className="text-sm min-w-[120px]">
                                      {region.name} ({region.currency_code})
                                    </span>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={price?.amount || 0}
                                      onChange={(e) => updateVariantPrice(
                                        variant.id, 
                                        region.id, 
                                        parseFloat(e.target.value) || 0
                                      )}
                                      placeholder="0.00"
                                      className="w-32"
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                          
                          <div>
                            <Label className="mb-2">{t("fields.inventory", "Inventory")}</Label>
                            <div className="space-y-2">
                              {stockLocations.map((location) => {
                                const inventory = config.inventory_by_location.find(
                                  inv => inv.location_id === location.id
                                )
                                return (
                                  <div key={location.id} className="flex items-center gap-2">
                                    <span className="text-sm min-w-[120px]">{location.name}</span>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={inventory?.quantity || 0}
                                      onChange={(e) => updateVariantInventory(
                                        variant.id,
                                        location.id,
                                        parseInt(e.target.value) || 0
                                      )}
                                      placeholder="0"
                                      className="w-32"
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      <div className="flex justify-between gap-2 pt-4 border-t">
        <Button variant="secondary" onClick={onPrev}>
          {t("actions.back", "Back")}
        </Button>
        <Button 
          onClick={handleNext}
          disabled={!isValidConfiguration()}
        >
          {t("actions.next", "Next")}
        </Button>
      </div>
    </div>
  )
}