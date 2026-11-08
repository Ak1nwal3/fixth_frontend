import { Outlet } from 'react-router'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { ProductProvider } from '@/features/product/store'
export default function RootLayout() {
  return <AuthProvider><ProductProvider><Outlet /></ProductProvider></AuthProvider>
}
