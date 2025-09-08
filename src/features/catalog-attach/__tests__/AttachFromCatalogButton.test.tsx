import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { vi, describe, it, expect, beforeEach } from "vitest"
import { AttachFromCatalogButton } from "../AttachFromCatalogButton"

// Mock the store hook
vi.mock("../../../hooks/api/store", () => ({
  useConfiguration: vi.fn()
}))

import { useConfiguration } from "../../../hooks/api/store"

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key
  })
}))

describe("AttachFromCatalogButton", () => {
  let queryClient: QueryClient
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    vi.clearAllMocks()
  })
  
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
  
  it("should be hidden when global_product_catalog is false", () => {
    vi.mocked(useConfiguration).mockReturnValue({
      configuration: { global_product_catalog: false },
      isLoading: false
    } as any)
    
    const { container } = render(<AttachFromCatalogButton />, { wrapper })
    expect(container.firstChild).toBeNull()
  })
  
  it("should be visible when global_product_catalog is true", () => {
    vi.mocked(useConfiguration).mockReturnValue({
      configuration: { global_product_catalog: true },
      isLoading: false
    } as any)
    
    render(<AttachFromCatalogButton />, { wrapper })
    expect(screen.getByText("Attach from Catalog")).toBeInTheDocument()
  })
  
  it("should be hidden while loading configuration", () => {
    vi.mocked(useConfiguration).mockReturnValue({
      configuration: null,
      isLoading: true
    } as any)
    
    const { container } = render(<AttachFromCatalogButton />, { wrapper })
    expect(container.firstChild).toBeNull()
  })
  
  it("should open modal when clicked", async () => {
    vi.mocked(useConfiguration).mockReturnValue({
      configuration: { global_product_catalog: true },
      isLoading: false
    } as any)
    
    const user = userEvent.setup()
    render(<AttachFromCatalogButton />, { wrapper })
    
    const button = screen.getByText("Attach from Catalog")
    await user.click(button)
    
    // Modal should be rendered (though it may not be visible in jsdom)
    await waitFor(() => {
      expect(document.querySelector('[role="dialog"]')).toBeInTheDocument()
    })
  })
})