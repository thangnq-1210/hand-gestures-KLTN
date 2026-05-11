"use client"

import { useAuth } from "@/lib/auth-context"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"

type Role = "user" | "caregiver" | "admin"

type ProtectedPageProps = {
  children: React.ReactNode
  allowRoles?: Role[]
  redirectTo?: string
}

export default function ProtectedPage({
  children,
  allowRoles,
  redirectTo = "/",
}: ProtectedPageProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      const query = searchParams?.toString()
      const next = query ? `${pathname}?${query}` : pathname
      router.replace(`/login?next=${encodeURIComponent(next)}`)
      return
    }

    if (allowRoles && user && !allowRoles.includes(user.role)) {
      router.replace(redirectTo)
    }
  }, [isLoading, isAuthenticated, user, allowRoles, redirectTo, router, pathname, searchParams])

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Đang kiểm tra đăng nhập...</p>
      </main>
    )
  }

  if (!isAuthenticated || !user) return null
  if (allowRoles && !allowRoles.includes(user.role)) return null

  return <>{children}</>
}