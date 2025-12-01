"use client"

import type React from "react"

import { AuthProvider } from "@/lib/auth-context"
import Navigation from "@/components/navigation"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-16">{children}</main>
      </div>
    </AuthProvider>
  )
}
