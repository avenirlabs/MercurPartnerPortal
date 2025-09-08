import { Button, Input, Table, Badge, Label } from "@medusajs/ui"
import { MagnifyingGlass } from "@medusajs/icons"
import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { GlobalProduct } from "../types"
import { useGlobalProducts } from "../../../hooks/useCatalog"
import { useDebouncedValue } from "../../../hooks/use-debounce"

type SearchGlobalProductsProps = {
  onProductSelect: (product: GlobalProduct) => void
  onCancel: () => void
}

export const SearchGlobalProducts = ({ 
  onProductSelect, 
  onCancel 
}: SearchGlobalProductsProps) => {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(0)
  const debouncedQuery = useDebouncedValue(searchQuery, 500)
  
  const pageSize = 10
  
  // Fetch global products
  const { 
    products, 
    count, 
    isLoading, 
    isError 
  } = useGlobalProducts({
    q: debouncedQuery,
    limit: pageSize,
    offset: currentPage * pageSize
  })
  
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(0) // Reset to first page on new search
  }, [])
  
  const handleProductSelect = (product: GlobalProduct) => {
    // Only allow published products to be attached
    if (product.status !== "published") {
      return
    }
    onProductSelect(product)
  }
  
  const handleNextPage = () => {
    if ((currentPage + 1) * pageSize < (count || 0)) {
      setCurrentPage(currentPage + 1)
    }
  }
  
  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }
  
  const totalPages = Math.ceil((count || 0) / pageSize)
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>{t("fields.search", "Search")}</Label>
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-ui-fg-subtle" />
          <Input
            type="text"
            placeholder={t("products.searchPlaceholder", "Search products...")}
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>{t("fields.title", "Title")}</Table.HeaderCell>
              <Table.HeaderCell>{t("fields.collection", "Collection")}</Table.HeaderCell>
              <Table.HeaderCell>{t("fields.variants", "Variants")}</Table.HeaderCell>
              <Table.HeaderCell>{t("fields.status", "Status")}</Table.HeaderCell>
              <Table.HeaderCell>{t("fields.action", "Action")}</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading ? (
              <Table.Row>
                <Table.Cell colSpan={5} className="text-center py-8 text-ui-fg-subtle">
                  {t("general.loading", "Loading...")}
                </Table.Cell>
              </Table.Row>
            ) : isError ? (
              <Table.Row>
                <Table.Cell colSpan={5} className="text-center py-8 text-ui-fg-error">
                  {t("general.error", "An error occurred")}
                </Table.Cell>
              </Table.Row>
            ) : products && products.length > 0 ? (
              products.map((product) => (
                <Table.Row key={product.id}>
                  <Table.Cell className="font-medium">
                    {product.title}
                  </Table.Cell>
                  <Table.Cell>
                    {product.collection_title || "-"}
                  </Table.Cell>
                  <Table.Cell>
                    {product.variants_count}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge 
                      color={product.status === "published" ? "green" : "grey"}
                      size="small"
                    >
                      {product.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() => handleProductSelect(product)}
                      disabled={product.status !== "published"}
                    >
                      {t("actions.select", "Select")}
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={5} className="text-center py-8 text-ui-fg-subtle">
                  {t("products.noProductsFound", "No products found")}
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-sm text-ui-fg-subtle">
          {count ? t("general.showingXofY", {
            from: currentPage * pageSize + 1,
            to: Math.min((currentPage + 1) * pageSize, count),
            total: count
          }, `Showing ${currentPage * pageSize + 1}-${Math.min((currentPage + 1) * pageSize, count)} of ${count}`) : ""}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="small"
            onClick={handlePrevPage}
            disabled={currentPage === 0}
          >
            {t("actions.previous", "Previous")}
          </Button>
          <span className="text-sm text-ui-fg-subtle">
            {t("general.pageXofY", { current: currentPage + 1, total: totalPages }, `Page ${currentPage + 1} of ${totalPages}`)}
          </span>
          <Button
            variant="secondary"
            size="small"
            onClick={handleNextPage}
            disabled={(currentPage + 1) * pageSize >= (count || 0)}
          >
            {t("actions.next", "Next")}
          </Button>
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="secondary" onClick={onCancel}>
          {t("actions.cancel", "Cancel")}
        </Button>
      </div>
    </div>
  )
}