import { createContext, useContext } from 'react'
import type { Store } from './store'
export const ProductContext = createContext<Store | null>(null)
export function useProduct() {
  const value = useContext(ProductContext)
  if (!value) throw new Error('ProductProvider is required')
  return value
}
