import { useTranslation } from "react-i18next"
import { RouteFocusModal } from "../../../components/modals"
import { useSalesChannels } from "../../../hooks/api"
import { useStore } from "../../../hooks/api/store"
import { ProductCreateForm } from "./components/product-create-form/product-create-form"

export const ProductCreate = () => {
  const { t } = useTranslation()

  const { store, isPending: isStorePending, isError: isStoreError, error: storeError } = useStore()

  const { sales_channels, isPending: isSalesChannelPending, isError: isSalesChannelError, error: salesChannelError } =
    useSalesChannels()

  const ready =
    !!store && !isStorePending && !!sales_channels && !isSalesChannelPending

  // Log errors for debugging
  if (isStoreError) {
    console.error("Store fetch error:", storeError)
  }
  if (isSalesChannelError) {
    console.error("Sales channels fetch error:", salesChannelError)
  }

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("products.create.title")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">{t("products.create.description")}</span>
      </RouteFocusModal.Description>
      {(isStorePending || isSalesChannelPending) && (
        <div className="flex h-96 items-center justify-center">
          <div className="text-ui-fg-muted">Loading...</div>
        </div>
      )}
      {(isStoreError || isSalesChannelError) && (
        <div className="flex h-96 items-center justify-center">
          <div className="text-ui-fg-error">
            {isStoreError && <div>Failed to load store data</div>}
            {isSalesChannelError && <div>Failed to load sales channels</div>}
          </div>
        </div>
      )}
      {ready && sales_channels.length > 0 && (
        <ProductCreateForm defaultChannel={sales_channels[0]} store={store} />
      )}
      {ready && sales_channels.length === 0 && (
        <div className="flex h-96 items-center justify-center">
          <div className="text-ui-fg-muted">No sales channels available. Please create a sales channel first.</div>
        </div>
      )}
    </RouteFocusModal>
  )
}
