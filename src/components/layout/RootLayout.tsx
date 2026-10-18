import { Outlet } from 'react-router'
import { ProductProvider } from '@/features/product/store'
export default function RootLayout() {
  return <ProductProvider><Outlet /></ProductProvider>
}
