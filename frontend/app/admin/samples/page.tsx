"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import AdminSampleManager from "@/components/admin/admin-sample-manager"

export default function AdminSamplesPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) router.push("/login")
    else if (user && user.role !== "admin") router.push("/")
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || !user || user.role !== "admin") return null
  return <AdminSampleManager />
}
