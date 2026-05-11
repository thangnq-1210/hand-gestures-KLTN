"use client"

import ProtectedPage from "@/components/auth/protected-page"
import AdminSampleManager from "@/components/admin/admin-sample-manager"

export default function AdminSamplesPage() {
  return (
    <ProtectedPage allowRoles={["admin"]}>
      <AdminSampleManager />
    </ProtectedPage>
  )
}
