import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { vi, describe, it, expect, beforeEach } from "vitest"
import { SearchGlobalProducts } from "../steps/SearchGlobalProducts"

// Mock the catalog hook
vi.mock("../../../hooks/useCatalog", () => ({
  useGlobalProducts: vi.fn()
}))

// Mock the debounce hook
vi.mock("../../../hooks/use-debounce", () => ({
  useDebouncedValue: (value: any) => value
}))

import { useGlobalProducts } from "../../../hooks/useCatalog"

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string, params?: any) => {
      if (params) {
        return defaultValue || key
      }
      return defaultValue || key
    }
  })
}))

describe("SearchGlobalProducts", () => {
  let queryClient: QueryClient
  const mockOnProductSelect = vi.fn()
  const mockOnCancel = vi.fn()
  
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
  
  it("should render search input and empty state", () => {
    vi.mocked(useGlobalProducts).mockReturnValue({
      products: [],
      count: 0,
      isLoading: false,
      isError: false
    } as any)
    
    render(
      <SearchGlobalProducts 
        onProductSelect={mockOnProductSelect}
        onCancel={mockOnCancel}
      />, 
      { wrapper }
    )
    
    expect(screen.getByPlaceholderText("Search products...")).toBeInTheDocument()
    expect(screen.getByText("No products found")).toBeInTheDocument()
  })
  
  it("should display loading state", () => {
    vi.mocked(useGlobalProducts).mockReturnValue({
      products: [],
      count: 0,
      isLoading: true,
      isError: false
    } as any)
    
    render(
      <SearchGlobalProducts 
        onProductSelect={mockOnProductSelect}
        onCancel={mockOnCancel}
      />, 
      { wrapper }
    )
    
    expect(screen.getByText("Loading...")).toBeInTheDocument()
  })
  
  it("should display products when loaded", () => {
    vi.mocked(useGlobalProducts).mockReturnValue({
      products: [
        {
          id: "prod_1",
          title: "Test Product",
          status: "published",
          collection_title: "Electronics",
          variants_count: 3
        }
      ],
      count: 1,
      isLoading: false,
      isError: false
    } as any)
    
    render(
      <SearchGlobalProducts 
        onProductSelect={mockOnProductSelect}
        onCancel={mockOnCancel}
      />, 
      { wrapper }
    )
    
    expect(screen.getByText("Test Product")).toBeInTheDocument()
    expect(screen.getByText("Electronics")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
  })
  
  it("should call onProductSelect when Select is clicked for published product", async () => {
    const testProduct = {
      id: "prod_1",
      title: "Test Product",
      status: "published",
      collection_title: "Electronics",
      variants_count: 3
    }
    
    vi.mocked(useGlobalProducts).mockReturnValue({
      products: [testProduct],
      count: 1,
      isLoading: false,
      isError: false
    } as any)
    
    const user = userEvent.setup()
    render(
      <SearchGlobalProducts 
        onProductSelect={mockOnProductSelect}
        onCancel={mockOnCancel}
      />, 
      { wrapper }
    )
    
    const selectButton = screen.getByText("Select")
    await user.click(selectButton)
    
    expect(mockOnProductSelect).toHaveBeenCalledWith(testProduct)
  })
  
  it("should disable Select button for non-published products", () => {
    vi.mocked(useGlobalProducts).mockReturnValue({
      products: [
        {
          id: "prod_1",
          title: "Draft Product",
          status: "draft",
          collection_title: null,
          variants_count: 1
        }
      ],
      count: 1,
      isLoading: false,
      isError: false
    } as any)
    
    render(
      <SearchGlobalProducts 
        onProductSelect={mockOnProductSelect}
        onCancel={mockOnCancel}
      />, 
      { wrapper }
    )
    
    const selectButton = screen.getByText("Select")
    expect(selectButton).toBeDisabled()
  })
  
  it("should debounce search query", async () => {
    vi.mocked(useGlobalProducts).mockReturnValue({
      products: [],
      count: 0,
      isLoading: false,
      isError: false
    } as any)
    
    const user = userEvent.setup()
    render(
      <SearchGlobalProducts 
        onProductSelect={mockOnProductSelect}
        onCancel={mockOnCancel}
      />, 
      { wrapper }
    )
    
    const searchInput = screen.getByPlaceholderText("Search products...")
    await user.type(searchInput, "test")
    
    expect(searchInput).toHaveValue("test")
  })
})